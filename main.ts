import {
	App,
	ItemView,
	Menu,
	Modal,
	Notice,
	SuggestModal,
	normalizePath,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
	WorkspaceLeaf,
} from "obsidian";
import fs from "fs/promises";
import path from "path";
import initSqlJs from "sql.js";

const VIEW_TYPE_TREE_HIERARCHY = "sqlite-tree-hierarchy-view";
const DEFAULT_DB_FILENAME = "tree-hierarchy.sqlite";
const SUPPORTED_NOTE_EXTENSIONS = new Set([".md", ".html", ".htm"]);

type NodeType = "label" | "note";
type SqlValue = number | string | Uint8Array | null;

interface SqlQueryResult {
	values: SqlValue[][];
}

interface SqlStatement {
	bind(values: SqlValue[]): void;
	step(): boolean;
	getAsObject(): Record<string, SqlValue>;
	free(): void;
}

interface SqlDatabase {
	exec(sql: string): SqlQueryResult[];
	run(sql: string, params?: SqlValue[]): void;
	prepare(sql: string): SqlStatement;
	export(): Uint8Array;
}

interface SqlJsModule {
	Database: new (data?: Uint8Array) => SqlDatabase;
}

interface TreeHierarchySettings {
	dbFileName: string;
	backupDbPath: string;
	noteRootFolder: string;
	noteExtension: string;
}

interface RecoveryState {
	backupDbPath: string;
}

interface TreeNodeRecord {
	id: number;
	parentId: number | null;
	type: NodeType;
	title: string;
	notePath: string | null;
	sortOrder: number;
	children: TreeNodeRecord[];
}

interface DisplayTreeNode {
	key: string;
	dbId: number | null;
	parentId: number | null;
	type: NodeType;
	title: string;
	notePath: string | null;
	children: DisplayTreeNode[];
	isAssigned: boolean;
	aliasCount: number;
}

const DEFAULT_SETTINGS: TreeHierarchySettings = {
	dbFileName: DEFAULT_DB_FILENAME,
	backupDbPath: "",
	noteRootFolder: "",
	noteExtension: ".md",
};

function fireAndForget(task: Promise<unknown>, onError?: (error: unknown) => void): void {
	void task.catch((error) => {
		if (onError) {
			onError(error);
			return;
		}
		console.error(error);
	});
}

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
	const buffer = new ArrayBuffer(data.byteLength);
	new Uint8Array(buffer).set(data);
	return buffer;
}

interface SearchableNode {
	node: DisplayTreeNode;
	breadcrumb: string;
	ancestorDbIds: number[];
}

function flattenTree(nodes: DisplayTreeNode[], prefix = "", ancestors: number[] = []): SearchableNode[] {
	const result: SearchableNode[] = [];
	for (const node of nodes) {
		const breadcrumb = prefix ? `${prefix} / ${node.title}` : node.title;
		result.push({ node, breadcrumb, ancestorDbIds: [...ancestors] });
		const nextAncestors = node.dbId !== null ? [...ancestors, node.dbId] : [...ancestors];
		result.push(...flattenTree(node.children, breadcrumb, nextAncestors));
	}
	return result;
}

class TreeHierarchyStore {
	private sql: SqlJsModule | null = null;
	private db: SqlDatabase | null = null;

	constructor(private readonly plugin: SQLiteTreeHierarchyPlugin) {}

	async initialize(): Promise<void> {
		if (this.db) {
			return;
		}

		const adapter = this.plugin.app.vault.adapter as typeof this.plugin.app.vault.adapter & {
			exists(path: string, sensitive?: boolean): Promise<boolean>;
			mkdir(path: string): Promise<void>;
			readBinary(path: string): Promise<ArrayBuffer>;
			writeBinary(path: string, data: ArrayBuffer): Promise<void>;
		};
		const pluginDir = this.plugin.getPluginDirectory();
		const wasmPath = normalizePath(`${pluginDir}/sql-wasm.wasm`);
		const wasmBinary = new Uint8Array(await adapter.readBinary(wasmPath));

		const sql = await initSqlJs({ wasmBinary });
		this.sql = sql;

		await this.ensureDbDirectory(adapter);
		await this.restorePrimaryFromBackupIfNeeded(adapter);
		const dbPath = this.plugin.getDatabasePath();
		if (await adapter.exists(dbPath)) {
			const binary = new Uint8Array(await adapter.readBinary(dbPath));
			this.db = new sql.Database(binary);
		} else {
			this.db = new sql.Database();
		}

		this.ensureSchema();
		await this.save();
	}

	private ensureSchema(): void {
		this.db?.exec(`
			CREATE TABLE IF NOT EXISTS nodes (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				parent_id INTEGER NULL REFERENCES nodes(id) ON DELETE CASCADE,
				type TEXT NOT NULL CHECK(type IN ('label', 'note')),
				title TEXT NOT NULL,
				note_path TEXT NULL,
				sort_order INTEGER NOT NULL DEFAULT 0,
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
			);
		`);
		if (!this.hasColumn("nodes", "sort_order")) {
			this.db?.exec(`ALTER TABLE nodes ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;`);
		}
		this.db?.exec(`
			UPDATE nodes
			SET sort_order = id
			WHERE sort_order = 0;
		`);
		this.migrateGroupToLabel();
	}

	private migrateGroupToLabel(): void {
		const result = this.db?.exec(`SELECT COUNT(*) FROM nodes WHERE type = 'group';`);
		const count = result?.[0]?.values?.[0]?.[0];
		if (typeof count === "number" && count > 0) {
			this.db?.exec(`
				CREATE TABLE nodes_new (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					parent_id INTEGER NULL REFERENCES nodes_new(id) ON DELETE CASCADE,
					type TEXT NOT NULL CHECK(type IN ('label', 'note')),
					title TEXT NOT NULL,
					note_path TEXT NULL,
					sort_order INTEGER NOT NULL DEFAULT 0,
					created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
					updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
				);
				INSERT INTO nodes_new (id, parent_id, type, title, note_path, sort_order, created_at, updated_at)
				SELECT id, parent_id,
					CASE WHEN type = 'group' THEN 'label' ELSE type END,
					title, note_path, sort_order, created_at, updated_at
				FROM nodes;
				DROP TABLE nodes;
				ALTER TABLE nodes_new RENAME TO nodes;
			`);
		}
	}

	async save(): Promise<void> {
		if (!this.db) {
			return;
		}

		const adapter = this.plugin.app.vault.adapter as typeof this.plugin.app.vault.adapter & {
			writeBinary(path: string, data: ArrayBuffer): Promise<void>;
		};
		const fileData = this.exportDatabaseBytes();
		await adapter.writeBinary(this.plugin.getDatabasePath(), toArrayBuffer(fileData));
	}

	private async ensureDbDirectory(
		adapter: typeof this.plugin.app.vault.adapter & {
			exists(path: string, sensitive?: boolean): Promise<boolean>;
			mkdir(path: string): Promise<void>;
		},
	): Promise<void> {
		const dir = this.plugin.getDatabaseDirectory();
		if (!(await adapter.exists(dir))) {
			await adapter.mkdir(dir);
		}
	}

	private async restorePrimaryFromBackupIfNeeded(
		adapter: typeof this.plugin.app.vault.adapter & {
			exists(path: string, sensitive?: boolean): Promise<boolean>;
			writeBinary(path: string, data: ArrayBuffer): Promise<void>;
		},
	): Promise<void> {
		const primaryPath = this.plugin.getDatabasePath();
		if (await adapter.exists(primaryPath)) {
			return;
		}

		const backupBytes = await this.plugin.readBackupDatabase();
		if (!backupBytes) {
			return;
		}

		await adapter.writeBinary(primaryPath, toArrayBuffer(backupBytes));
		new Notice("Hierarchy view restored its database from the backup location.");
	}

	exportDatabaseBytes(): Uint8Array {
		if (!this.db) {
			throw new Error("Database is not initialized.");
		}
		return new Uint8Array(this.db.export());
	}

	getTree(): TreeNodeRecord[] {
		const result = this.db?.exec(`
			SELECT id, parent_id, type, title, note_path, sort_order
			FROM nodes
			ORDER BY COALESCE(parent_id, -1), sort_order ASC, id ASC;
		`) ?? [];

		if (result.length === 0) {
			return [];
		}

		const rows = result[0].values;
		const byId = new Map<number, TreeNodeRecord>();
		const roots: TreeNodeRecord[] = [];

		for (const row of rows) {
			const node: TreeNodeRecord = {
				id: Number(row[0]),
				parentId: row[1] === null ? null : Number(row[1]),
				type: String(row[2]) as NodeType,
				title: String(row[3]),
				notePath: row[4] === null ? null : String(row[4]),
				sortOrder: Number(row[5]),
				children: [],
			};
			byId.set(node.id, node);
		}

		for (const node of byId.values()) {
			if (node.parentId === null) {
				roots.push(node);
				continue;
			}

			const parent = byId.get(node.parentId);
			if (parent) {
				parent.children.push(node);
			} else {
				roots.push(node);
			}
		}

		return roots;
	}

	async createLabel(title: string, parentId: number | null): Promise<number> {
		const createdId = this.runInsert("label", title, parentId, null);
		await this.save();
		return createdId;
	}

	async createNoteNode(title: string, parentId: number | null, notePath: string): Promise<number> {
		const createdId = this.runInsert("note", title, parentId, notePath);
		await this.save();
		return createdId;
	}

	async assignExistingNote(title: string, parentId: number | null, notePath: string): Promise<void> {
		const existingNodeId = this.findNoteNodeIdByPath(notePath);
		if (existingNodeId !== null) {
			this.db?.run(
				`UPDATE nodes
				 SET title = ?, updated_at = CURRENT_TIMESTAMP
				 WHERE id = ?`,
				[title, existingNodeId],
			);
			await this.moveNode(existingNodeId, parentId);
		} else {
			this.runInsert("note", title, parentId, notePath);
			await this.save();
		}
	}

	async ensureTrackedNote(title: string, notePath: string): Promise<number> {
		const existingNodeId = this.findNoteNodeIdByPath(notePath);
		if (existingNodeId !== null) {
			return existingNodeId;
		}

		this.runInsert("note", title, null, notePath);
		const createdId = this.findNoteNodeIdByPath(notePath);
		if (createdId === null) {
			throw new Error("Failed to track existing note.");
		}
		await this.save();
		return createdId;
	}

	async syncVaultNotes(): Promise<void> {
		const allFiles = this.plugin.app.vault.getFiles().filter((file) => {
			const ext = file.extension ? `.${file.extension}` : "";
			return SUPPORTED_NOTE_EXTENSIONS.has(ext);
		});
		for (const file of allFiles) {
			const existingNodeId = this.findNoteNodeIdByPath(file.path);
			if (existingNodeId === null) {
				this.runInsert("note", file.path, null, file.path);
				continue;
			}

			this.db?.run(
				`UPDATE nodes
				 SET title = ?, updated_at = CURRENT_TIMESTAMP
				 WHERE id = ?`,
				[file.path, existingNodeId],
			);
		}
		await this.save();
	}

	async unassignNote(notePath: string): Promise<void> {
		const nodeId = this.findNoteNodeIdByPath(notePath);
		if (nodeId === null) {
			return;
		}
		await this.moveNodeToIndex(nodeId, null, null);
	}

	async createNoteAlias(notePath: string, title: string, parentId: number | null): Promise<number> {
		const createdId = this.runInsert("note", title, parentId, notePath);
		await this.save();
		return createdId;
	}

	async removeNode(nodeId: number): Promise<void> {
		if (!this.db) {
			return;
		}
		const node = this.getNodeById(nodeId);
		if (!node) {
			return;
		}
		const parentId = node.parentId;
		this.db.run(`DELETE FROM nodes WHERE id = ?`, [nodeId]);
		this.rewriteSiblingOrder(parentId, this.getSiblingIds(parentId));
		await this.save();
	}

	getNotePathCounts(): Map<string, number> {
		const counts = new Map<string, number>();
		if (!this.db) {
			return counts;
		}
		const result = this.db.exec(`
			SELECT note_path, COUNT(*) as cnt
			FROM nodes
			WHERE type = 'note' AND note_path IS NOT NULL
			GROUP BY note_path
			HAVING COUNT(*) > 1
		`) ?? [];
		if (result.length === 0) {
			return counts;
		}
		for (const row of result[0].values) {
			const notePath = String(row[0]);
			const count = Number(row[1]);
			counts.set(notePath, count);
		}
		return counts;
	}

	async moveNode(nodeId: number, parentId: number | null): Promise<void> {
		await this.moveNodeToIndex(nodeId, parentId, null);
	}

	async moveNodeToIndex(nodeId: number, parentId: number | null, index: number | null): Promise<void> {
		const node = this.getNodeById(nodeId);
		if (!node) {
			return;
		}
		const previousParentId = node.parentId;

		if (parentId !== null) {
			const target = this.getNodeById(parentId);
			if (!target || target.type !== "label") {
				if (target?.type !== "note") {
					throw new Error("Target parent must be an existing node.");
				}
			}
			if (this.isDescendant(parentId, nodeId) || parentId === nodeId) {
				throw new Error("A node cannot be moved into itself or one of its descendants.");
			}
		}

		const siblingIds = this.getSiblingIds(parentId).filter((id) => id !== nodeId);
		const boundedIndex = index === null ? siblingIds.length : Math.max(0, Math.min(index, siblingIds.length));
		siblingIds.splice(boundedIndex, 0, nodeId);

		this.db?.run(
			`UPDATE nodes
			 SET parent_id = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
			 WHERE id = ?`,
			[parentId, boundedIndex + 1, nodeId],
		);
		if (previousParentId !== parentId) {
			this.rewriteSiblingOrder(previousParentId, this.getSiblingIds(previousParentId).filter((id) => id !== nodeId));
		}
		this.rewriteSiblingOrder(parentId, siblingIds);
		await this.save();
	}

	getParentTargets(excludeNodeId?: number): Array<{ id: number; label: string }> {
		const targets: Array<{ id: number; label: string }> = [];
		const walk = (nodes: TreeNodeRecord[], prefix = ""): void => {
			for (const node of nodes) {
				if (excludeNodeId !== undefined) {
					if (node.id === excludeNodeId) {
						continue;
					}
					if (this.isDescendant(node.id, excludeNodeId)) {
						continue;
					}
				}
				targets.push({
					id: node.id,
					label: prefix ? `${prefix} / ${node.title}` : node.title,
				});
				walk(node.children, prefix ? `${prefix} / ${node.title}` : node.title);
			}
		};
		walk(this.getTree());
		return targets;
	}

	private runInsert(type: NodeType, title: string, parentId: number | null, notePath: string | null): number {
		const sortOrder = this.getNextSortOrder(parentId);
		this.db?.run(
			`INSERT INTO nodes(parent_id, type, title, note_path, sort_order, updated_at)
			 VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
			[parentId, type, title, notePath, sortOrder],
		);
		const inserted = this.db?.exec("SELECT last_insert_rowid();") ?? [];
		if (inserted.length === 0 || inserted[0].values.length === 0) {
			throw new Error("Failed to read inserted node id.");
		}
		return Number(inserted[0].values[0][0]);
	}

	private findNoteNodeIdByPath(notePath: string): number | null {
		if (!this.db) {
			return null;
		}

		const statement = this.db.prepare(
			`SELECT id
			 FROM nodes
			 WHERE type = 'note' AND note_path = ?
			 LIMIT 1`,
		);

		try {
			statement.bind([notePath]);
			if (!statement.step()) {
				return null;
			}
			const row = statement.getAsObject();
			return typeof row.id === "number" ? row.id : Number(row.id);
		} finally {
			statement.free();
		}
	}

	private getNodeById(nodeId: number): TreeNodeRecord | null {
		if (!this.db) {
			return null;
		}

		const statement = this.db.prepare(
			`SELECT id, parent_id, type, title, note_path, sort_order
			 FROM nodes
			 WHERE id = ?
			 LIMIT 1`,
		);

		try {
			statement.bind([nodeId]);
			if (!statement.step()) {
				return null;
			}
			const row = statement.getAsObject();
			return {
				id: Number(row.id),
				parentId: row.parent_id === null ? null : Number(row.parent_id),
				type: String(row.type) as NodeType,
				title: String(row.title),
				notePath: row.note_path === null ? null : String(row.note_path),
				sortOrder: Number(row.sort_order),
				children: [],
			};
		} finally {
			statement.free();
		}
	}

	private getNextSortOrder(parentId: number | null): number {
		const siblingIds = this.getSiblingIds(parentId);
		return siblingIds.length + 1;
	}

	private getSiblingIds(parentId: number | null): number[] {
		const statement = this.db?.prepare(
			`SELECT id
			 FROM nodes
			 WHERE parent_id IS ?
			 ORDER BY sort_order ASC, id ASC`,
		);
		if (!statement) {
			return [];
		}

		try {
			statement.bind([parentId]);
			const ids: number[] = [];
			while (statement.step()) {
				const row = statement.getAsObject();
				ids.push(Number(row.id));
			}
			return ids;
		} finally {
			statement.free();
		}
	}

	private rewriteSiblingOrder(parentId: number | null, siblingIds: number[]): void {
		siblingIds.forEach((id, index) => {
			this.db?.run(
				`UPDATE nodes
				 SET parent_id = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
				 WHERE id = ?`,
				[parentId, index + 1, id],
			);
		});
	}

	private hasColumn(tableName: string, columnName: string): boolean {
		const result = this.db?.exec(`PRAGMA table_info(${tableName});`) ?? [];
		if (result.length === 0) {
			return false;
		}
		return result[0].values.some((row) => String(row[1]) === columnName);
	}

	private isDescendant(nodeId: number, ancestorId: number): boolean {
		let current = this.getNodeById(nodeId);
		while (current?.parentId !== null && current?.parentId !== undefined) {
			if (current.parentId === ancestorId) {
				return true;
			}
			current = this.getNodeById(current.parentId);
		}
		return false;
	}
}

class CreateHierarchyItemModal extends Modal {
	private readonly type: NodeType;
	private readonly parentId: number | null;
	private readonly plugin: SQLiteTreeHierarchyPlugin;

	constructor(app: App, plugin: SQLiteTreeHierarchyPlugin, type: NodeType, parentId: number | null) {
		super(app);
		this.plugin = plugin;
		this.type = type;
		this.parentId = parentId;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("tree-hierarchy-modal");

		this.titleEl.setText(this.type === "label" ? "Create label" : "Create note");

		let title = "";
		const titleLabel = contentEl.createEl("label", { text: this.type === "label" ? "Label name" : "Note title" });
		const titleInput = titleLabel.createEl("input", { type: "text" });
		titleInput.focus();
		titleInput.addEventListener("input", () => {
			title = titleInput.value.trim();
		});

		let folder = this.plugin.settings.noteRootFolder.trim();
		if (this.type === "note") {
			const folderLabel = contentEl.createEl("label", { text: "Vault folder" });
			const folderInput = folderLabel.createEl("input", { type: "text", value: folder });
			folderInput.addEventListener("input", () => {
				folder = folderInput.value.trim();
			});
		}

		const createButton = contentEl.createEl("button", {
			text: this.type === "label" ? "Create label" : "Create note",
		});
		createButton.addEventListener("click", () => {
			fireAndForget(this.handleCreate(title, folder), (error) => {
				console.error(error);
				new Notice("Failed to create hierarchy item.");
			});
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private async handleCreate(title: string, folder: string): Promise<void> {
		if (!title) {
			new Notice("Title is required.");
			return;
		}

		if (this.type === "label") {
			await this.plugin.store.createLabel(title, this.parentId);
		} else {
			await this.plugin.createNoteInHierarchy(title, this.parentId, folder);
		}
		this.close();
		await this.plugin.refreshTreeView();
	}
}

class AssignExistingNoteModal extends Modal {
	constructor(
		app: App,
		private readonly plugin: SQLiteTreeHierarchyPlugin,
		private readonly parentId: number | null,
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("tree-hierarchy-modal");
		this.titleEl.setText("Add existing note");

		const notes = this.plugin.getRootAttachableNotes();
		if (notes.length === 0) {
			contentEl.createEl("p", { text: "No root notes are available to attach." });
			return;
		}

		let selectedPath = notes[0].path;
		const label = contentEl.createEl("label", { text: "Choose a note" });
		const select = label.createEl("select");
		for (const note of notes) {
			select.createEl("option", {
				value: note.path,
				text: note.path,
			});
		}
		select.addEventListener("change", () => {
			selectedPath = select.value;
		});

		const createButton = contentEl.createEl("button", { text: "Add to hierarchy" });
		createButton.addEventListener("click", () => {
			fireAndForget(this.handleAssign(selectedPath), (error) => {
				console.error(error);
				new Notice("Failed to add existing note.");
			});
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private async handleAssign(selectedPath: string): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(selectedPath);
		if (!(file instanceof TFile)) {
			new Notice("Selected note could not be found.");
			return;
		}

		await this.plugin.store.assignExistingNote(file.path, this.parentId, file.path);
		this.close();
		await this.plugin.refreshTreeView();
	}
}

class MoveHierarchyNodeModal {
	constructor(
		private readonly app: App,
		private readonly plugin: SQLiteTreeHierarchyPlugin,
		private readonly node: DisplayTreeNode,
	) {}

	open(): void {
		const targets = this.plugin.store.getParentTargets(this.node.dbId ?? undefined);
		new SearchMoveModal(this.app, targets, (selectedParent: number | null) => {
			fireAndForget(this.handleMove(selectedParent), (error) => {
				console.error(error);
				new Notice(error instanceof Error ? error.message : "Failed to move node.");
			});
		}).open();
	}

	private async handleMove(selectedParent: number | null): Promise<void> {
		if (this.node.dbId === null && this.node.notePath) {
			const file = this.app.vault.getAbstractFileByPath(this.node.notePath);
			if (!(file instanceof TFile)) {
				new Notice("Note file no longer exists.");
				return;
			}
			await this.plugin.store.assignExistingNote(file.path, selectedParent, file.path);
		} else if (this.node.dbId !== null) {
			await this.plugin.store.moveNode(this.node.dbId, selectedParent);
		}
		await this.plugin.refreshTreeView();
	}
}

class CreateParentHierarchyItemModal extends Modal {
	private readonly type: NodeType;
	private readonly targetNode: DisplayTreeNode;
	private readonly plugin: SQLiteTreeHierarchyPlugin;

	constructor(app: App, plugin: SQLiteTreeHierarchyPlugin, type: NodeType, targetNode: DisplayTreeNode) {
		super(app);
		this.plugin = plugin;
		this.type = type;
		this.targetNode = targetNode;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("tree-hierarchy-modal");

		this.titleEl.setText(this.type === "label" ? "Create parent label" : "Create parent note");

		let title = "";
		const titleLabel = contentEl.createEl("label", {
			text: this.type === "label" ? "Parent label name" : "Parent note title",
		});
		const titleInput = titleLabel.createEl("input", { type: "text" });
		titleInput.focus();
		titleInput.addEventListener("input", () => {
			title = titleInput.value.trim();
		});

		let folder = this.plugin.settings.noteRootFolder.trim();
		if (this.type === "note") {
			const folderLabel = contentEl.createEl("label", { text: "Vault folder" });
			const folderInput = folderLabel.createEl("input", { type: "text", value: folder });
			folderInput.addEventListener("input", () => {
				folder = folderInput.value.trim();
			});
		}

		const createButton = contentEl.createEl("button", {
			text: this.type === "label" ? "Create parent label" : "Create parent note",
		});
		createButton.addEventListener("click", () => {
			fireAndForget(this.handleCreate(title, folder), (error) => {
				console.error(error);
				new Notice(error instanceof Error ? error.message : "Failed to create parent item.");
			});
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private async handleCreate(title: string, folder: string): Promise<void> {
		if (!title) {
			new Notice("Title is required.");
			return;
		}

		await this.plugin.createParentForNode(this.targetNode, this.type, title, folder);
		this.close();
		await this.plugin.refreshTreeView();
	}
}

class TreeHierarchyPopupModal extends Modal {
	private collapsed = new Set<number>();
	private draggedNodeKey: string | null = null;
	private treeScrollTop = 0;

	constructor(app: App, private readonly plugin: SQLiteTreeHierarchyPlugin) {
		super(app);
	}

	onOpen(): void {
		this.containerEl.addClass("tree-hierarchy-popup-modal");
		this.buildChrome();
		window.requestAnimationFrame(() => {
			fireAndForget(this.render(), (error) => {
				console.error("Failed to render hierarchy popup", error);
			});
		});
	}

	onClose(): void {
		this.contentEl.empty();
		this.containerEl.removeClass("tree-hierarchy-popup-modal");
		this.plugin.onPopupClosed(this);
	}

	private buildChrome(): void {
		this.titleEl.empty();
		this.titleEl.addClass("tree-hierarchy-popup-title");

		const titleText = this.titleEl.createSpan({ text: "Hierarchy view" });
		titleText.addClass("tree-hierarchy-popup-title-text");

		const controls = this.titleEl.createDiv({ cls: "tree-hierarchy-popup-controls" });
		const closeButton = controls.createEl("button", { text: "Close" });
		closeButton.addEventListener("click", () => this.close());
	}

	async render(): Promise<void> {
		try {
			await this.plugin.whenReady();
			await this.plugin.store.syncVaultNotes();
			const container = this.contentEl;
			const previousTree = container.querySelector(".tree-hierarchy-tree");
			if (previousTree instanceof HTMLElement) {
				this.treeScrollTop = previousTree.scrollTop;
			}
			container.empty();
			container.addClass("tree-hierarchy-view");

			const toolbar = container.createDiv({ cls: "tree-hierarchy-toolbar" });
			const addRootLabelButton = toolbar.createEl("button", { text: "New root label" });
			addRootLabelButton.addEventListener("click", () => {
				new CreateHierarchyItemModal(this.app, this.plugin, "label", null).open();
			});

			const addRootNoteButton = toolbar.createEl("button", { text: "New root note" });
			addRootNoteButton.addEventListener("click", () => {
				new CreateHierarchyItemModal(this.app, this.plugin, "note", null).open();
			});

			const searchButton = toolbar.createEl("button", { cls: "tree-hierarchy-search-button", attr: { "aria-label": "Search hierarchy" } });
			searchButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
			searchButton.addEventListener("click", () => {
				this.plugin.openSearchModal("popup");
			});

		const treeWrapper = container.createDiv({ cls: "tree-hierarchy-tree" });
		treeWrapper.scrollTop = this.treeScrollTop;
		const treeInner = treeWrapper.createDiv({ cls: "tree-hierarchy-tree-inner" });
		this.registerRootDropZone(treeWrapper);
		treeInner.createDiv({
			cls: "tree-hierarchy-dropzone",
			text: "Drop here to move to root",
		});

		const tree = this.plugin.getDisplayTree();
		if (tree.length === 0) {
			treeInner.createDiv({
				cls: "tree-hierarchy-empty",
				text: "No hierarchy yet. Create a label, create a note, or assign an existing vault note.",
			});
			return;
		}

		for (const node of tree) {
			this.renderNode(treeInner, node);
		}

			window.requestAnimationFrame(() => {
				treeWrapper.scrollTop = this.treeScrollTop;
			});
		} catch (error) {
			console.error("Failed to render hierarchy popup", error);
			this.contentEl.empty();
			this.contentEl.createEl("div", {
				cls: "tree-hierarchy-empty",
				text: "Failed to render hierarchy popup. Check the developer console.",
			});
		}
	}

	private renderNode(parentEl: HTMLElement, node: DisplayTreeNode): void {
		const nodeEl = parentEl.createDiv({ cls: "tree-hierarchy-node" });
		nodeEl.dataset.nodeKey = node.key;
		const beforeDropZone = nodeEl.createDiv({ cls: "tree-hierarchy-insert-zone" });
		this.registerInsertDropZone(beforeDropZone, node, "before");
		const header = nodeEl.createDiv({ cls: "tree-hierarchy-node-header" });
		header.draggable = true;
		header.addEventListener("dragstart", (event) => {
			this.draggedNodeKey = node.key;
			header.addClass("is-dragging");
			event.dataTransfer?.setData("text/plain", node.key);
			if (event.dataTransfer) {
				event.dataTransfer.effectAllowed = "move";
			}
		});
		header.addEventListener("dragend", () => {
			this.draggedNodeKey = null;
			header.removeClass("is-dragging");
			this.clearDropIndicators();
		});

		if (node.children.length > 0) {
			const toggle = header.createEl("button", {
				cls: "tree-hierarchy-node-toggle",
				text: this.collapsed.has(node.dbId ?? this.hashNodeKey(node.key)) ? "+" : "-",
			});
			toggle.addEventListener("click", () => {
				fireAndForget(this.toggleCollapsed(node));
			});
		} else {
			header.createSpan({ cls: "tree-hierarchy-node-toggle", text: "" });
		}

		const label = header.createEl("button", {
			cls: `tree-hierarchy-node-label ${node.type === "note" ? "is-note" : ""}`,
			text: node.title,
		});
		label.addEventListener("click", () => {
			fireAndForget(this.openNodeFile(node));
		});
		if (node.aliasCount > 1) {
			header.createSpan({
				cls: "tree-hierarchy-alias-badge",
				text: `\u00D7${node.aliasCount}`,
			});
		}
		header.addEventListener("contextmenu", (event) => {
			event.preventDefault();
			this.openNodeContextMenu(event, node);
		});

		const actions = header.createDiv({ cls: "tree-hierarchy-node-actions" });
		if (node.dbId !== null || (node.type === "note" && node.notePath)) {
			header.addClass("is-drop-target");
			header.addEventListener("dragover", (event) => {
				if (!this.canDrop(node)) {
					return;
				}
				event.preventDefault();
				if (event.dataTransfer) {
					event.dataTransfer.dropEffect = "move";
				}
				header.addClass("is-drop-active");
			});
			header.addEventListener("dragleave", () => {
				header.removeClass("is-drop-active");
			});
			header.addEventListener("drop", (event) => {
				header.removeClass("is-drop-active");
				if (!this.canDrop(node)) {
					return;
				}
				event.preventDefault();
				event.stopPropagation();
				fireAndForget(this.dropOnNode(node), (error) => {
					console.error(error);
					new Notice(error instanceof Error ? error.message : "Failed to move node.");
				});
			});
			const addLabel = actions.createEl("button", { text: "Add label" });
			addLabel.addEventListener("click", () => {
				fireAndForget(this.plugin.openCreateModalForNode("label", node), (error) => {
					console.error(error);
					new Notice("Failed to open create label dialog.");
				});
			});

			const addNote = actions.createEl("button", { text: "Add note" });
			addNote.addEventListener("click", () => {
				fireAndForget(this.plugin.openCreateModalForNode("note", node), (error) => {
					console.error(error);
					new Notice("Failed to open create note dialog.");
				});
			});

			const addExisting = actions.createEl("button", { text: "Add existing" });
			addExisting.addEventListener("click", () => {
				fireAndForget(this.plugin.openAssignExistingModalForNode(node), (error) => {
					console.error(error);
					new Notice("Failed to open add existing note dialog.");
				});
			});

			if (node.dbId !== null) {
				const moveNode = actions.createEl("button", { text: "Move" });
				moveNode.addEventListener("click", () => {
					new MoveHierarchyNodeModal(this.app, this.plugin, node).open();
				});
			}
		}

		const popupNodeId = node.dbId;
		if (node.type === "note" && node.notePath && popupNodeId !== null && node.parentId !== null) {
			const rootButton = actions.createEl("button", { text: "Move to root" });
			rootButton.addEventListener("click", () => {
				fireAndForget(this.moveNodeToRoot(popupNodeId), (error) => {
					console.error(error);
					new Notice("Failed to move node.");
				});
			});
		}

		const collapseKey = node.dbId ?? this.hashNodeKey(node.key);
		if (node.children.length > 0 && !this.collapsed.has(collapseKey)) {
			const childrenEl = nodeEl.createDiv({ cls: "tree-hierarchy-node-children" });
			for (const child of node.children) {
				this.renderNode(childrenEl, child);
			}
		}
		const afterDropZone = nodeEl.createDiv({ cls: "tree-hierarchy-insert-zone" });
		this.registerInsertDropZone(afterDropZone, node, "after");
	}

	private hashNodeKey(value: string): number {
		let hash = 0;
		for (let index = 0; index < value.length; index += 1) {
			hash = (hash * 31 + value.charCodeAt(index)) | 0;
		}
		return hash;
	}

	private registerRootDropZone(treeWrapper: HTMLElement): void {
		treeWrapper.addEventListener("dragover", (event) => {
			if (!this.draggedNodeKey) {
				return;
			}
			event.preventDefault();
			treeWrapper.addClass("is-root-drop-active");
			if (event.dataTransfer) {
				event.dataTransfer.dropEffect = "move";
			}
		});
		treeWrapper.addEventListener("dragleave", (event) => {
			if (event.currentTarget === event.target) {
				treeWrapper.removeClass("is-root-drop-active");
			}
		});
		treeWrapper.addEventListener("drop", (event) => {
			event.preventDefault();
			treeWrapper.removeClass("is-root-drop-active");
			fireAndForget(this.handleDrop(null), (error) => {
				console.error(error);
				new Notice(error instanceof Error ? error.message : "Failed to move node.");
			});
		});
	}

	private registerInsertDropZone(
		dropZone: HTMLElement,
		targetNode: DisplayTreeNode,
		position: "before" | "after",
	): void {
		dropZone.addEventListener("dragover", (event) => {
			if (!this.draggedNodeKey) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			dropZone.addClass("is-drop-active");
			if (event.dataTransfer) {
				event.dataTransfer.dropEffect = "move";
			}
		});
		dropZone.addEventListener("dragleave", () => {
			dropZone.removeClass("is-drop-active");
		});
		dropZone.addEventListener("drop", (event) => {
			event.preventDefault();
			event.stopPropagation();
			dropZone.removeClass("is-drop-active");
			fireAndForget(this.handleSiblingDrop(targetNode, position), (error) => {
				console.error(error);
				new Notice(error instanceof Error ? error.message : "Failed to reorder node.");
			});
		});
	}

	private canDrop(targetNode: DisplayTreeNode): boolean {
		return Boolean(this.draggedNodeKey && (targetNode.dbId !== null || (targetNode.type === "note" && targetNode.notePath)));
	}

	private async handleDrop(parentId: number | null): Promise<void> {
		const draggedNode = this.draggedNodeKey
			? this.plugin.findDisplayNodeByKey(this.draggedNodeKey)
			: null;
		this.draggedNodeKey = null;
		this.clearDropIndicators();
		if (!draggedNode) {
			return;
		}

		try {
			await this.plugin.moveDisplayNode(draggedNode, parentId);
			await this.render();
		} catch (error) {
			console.error(error);
			new Notice(error instanceof Error ? error.message : "Failed to move node.");
		}
	}

	private async handleSiblingDrop(targetNode: DisplayTreeNode, position: "before" | "after"): Promise<void> {
		const draggedNode = this.draggedNodeKey
			? this.plugin.findDisplayNodeByKey(this.draggedNodeKey)
			: null;
		this.draggedNodeKey = null;
		this.clearDropIndicators();
		if (!draggedNode) {
			return;
		}

		try {
			const location = this.plugin.findNodeLocation(targetNode.key);
			if (!location) {
				return;
			}
			const targetIndex = position === "before" ? location.index : location.index + 1;
			await this.plugin.moveDisplayNodeToIndex(draggedNode, location.parentId, targetIndex);
			await this.render();
		} catch (error) {
			console.error(error);
			new Notice(error instanceof Error ? error.message : "Failed to reorder node.");
		}
	}

	private clearDropIndicators(): void {
		this.contentEl.querySelectorAll(".is-drop-active").forEach((element) => {
			element.removeClass("is-drop-active");
		});
		this.contentEl.querySelectorAll(".is-root-drop-active").forEach((element) => {
			element.removeClass("is-root-drop-active");
		});
	}

	private async toggleCollapsed(node: DisplayTreeNode): Promise<void> {
		const collapseKey = node.dbId ?? this.hashNodeKey(node.key);
		if (this.collapsed.has(collapseKey)) {
			this.collapsed.delete(collapseKey);
		} else {
			this.collapsed.add(collapseKey);
		}
		await this.render();
	}

	private async openNodeFile(node: DisplayTreeNode): Promise<void> {
		if (node.type !== "note" || !node.notePath) {
			return;
		}

		const file = this.app.vault.getAbstractFileByPath(node.notePath);
		if (file instanceof TFile) {
			await this.app.workspace.getLeaf(true).openFile(file);
			return;
		}

		new Notice(`Note file not found: ${node.notePath}`);
	}

	private async dropOnNode(node: DisplayTreeNode): Promise<void> {
		const parentId = await this.plugin.resolveParentIdForNode(node);
		await this.handleDrop(parentId);
	}

	private async moveNodeToRoot(nodeId: number): Promise<void> {
		await this.plugin.store.moveNode(nodeId, null);
		await this.plugin.refreshTreeView();
	}

	private openNodeContextMenu(event: MouseEvent, node: DisplayTreeNode): void {
		const menu = Menu.forEvent(event);
		menu.addItem((item) => {
			item.setTitle("Create parent label").onClick(() => {
				new CreateParentHierarchyItemModal(this.app, this.plugin, "label", node).open();
			});
		});
		menu.addItem((item) => {
			item.setTitle("Create parent note").onClick(() => {
				new CreateParentHierarchyItemModal(this.app, this.plugin, "note", node).open();
			});
		});
		if (node.type === "note" && node.notePath && node.dbId !== null) {
			menu.addSeparator();
			menu.addItem((item) => {
				item.setTitle("Add as alias elsewhere").onClick(() => {
					this.plugin.openAddAliasModal(node);
				});
			});
			menu.addItem((item) => {
				item.setTitle("Remove from hierarchy").onClick(() => {
					fireAndForget(this.plugin.removeNodeFromHierarchy(node.dbId as number), (error) => {
						console.error(error);
						new Notice(error instanceof Error ? error.message : "Failed to remove node.");
					});
				});
			});
		}
		menu.showAtMouseEvent(event);
	}

	async revealNode(nodeKey: string, ancestorDbIds: number[]): Promise<void> {
		for (const id of ancestorDbIds) {
			this.collapsed.delete(id);
		}
		await this.render();
		window.requestAnimationFrame(() => {
			const target = this.contentEl.querySelector(`[data-node-key="${nodeKey}"]`);
			if (target instanceof HTMLElement) {
				const header = target.querySelector(".tree-hierarchy-node-header");
				if (header instanceof HTMLElement) {
					header.scrollIntoView({ behavior: "smooth", block: "center" });
					header.addClass("is-search-highlight");
					window.setTimeout(() => {
						header.removeClass("is-search-highlight");
					}, 2000);
				}
			}
		});
	}
}

class TreeHierarchyView extends ItemView {
	private collapsed = new Set<number>();
	private draggedNodeKey: string | null = null;
	private treeScrollTop = 0;

	constructor(leaf: WorkspaceLeaf, private readonly plugin: SQLiteTreeHierarchyPlugin) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_TREE_HIERARCHY;
	}

	getDisplayText(): string {
		return "Hierarchy view";
	}

	getIcon(): string {
		return "workflow";
	}

	async onOpen(): Promise<void> {
		await this.openView();
	}

	render(): void {
		const container = this.contentEl;
		const previousTree = container.querySelector(".tree-hierarchy-tree");
		if (previousTree instanceof HTMLElement) {
			this.treeScrollTop = previousTree.scrollTop;
		}
		container.empty();
		container.addClass("tree-hierarchy-view");

		const toolbar = container.createDiv({ cls: "tree-hierarchy-toolbar" });
		const addRootLabelButton = toolbar.createEl("button", { text: "New root label" });
		addRootLabelButton.addEventListener("click", () => {
			new CreateHierarchyItemModal(this.app, this.plugin, "label", null).open();
		});

		const addRootNoteButton = toolbar.createEl("button", { text: "New root note" });
		addRootNoteButton.addEventListener("click", () => {
			new CreateHierarchyItemModal(this.app, this.plugin, "note", null).open();
		});

		const searchButton = toolbar.createEl("button", { cls: "tree-hierarchy-search-button", attr: { "aria-label": "Search hierarchy" } });
		searchButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
		searchButton.addEventListener("click", () => {
			this.plugin.openSearchModal("sidebar");
		});

		const treeWrapper = container.createDiv({ cls: "tree-hierarchy-tree" });
		treeWrapper.scrollTop = this.treeScrollTop;
		const treeInner = treeWrapper.createDiv({ cls: "tree-hierarchy-tree-inner" });
		this.registerRootDropZone(treeWrapper);
		treeInner.createDiv({
			cls: "tree-hierarchy-dropzone",
			text: "Drop here to move to root",
		});

		const tree = this.plugin.getDisplayTree();
		if (tree.length === 0) {
			treeInner.createDiv({
				cls: "tree-hierarchy-empty",
				text: "No hierarchy yet. Create a label, create a note, or assign an existing vault note.",
			});
			return;
		}

		for (const node of tree) {
			this.renderNode(treeInner, node);
		}

		window.requestAnimationFrame(() => {
			treeWrapper.scrollTop = this.treeScrollTop;
		});
	}

	private renderNode(parentEl: HTMLElement, node: DisplayTreeNode): void {
		const nodeEl = parentEl.createDiv({ cls: "tree-hierarchy-node" });
		nodeEl.dataset.nodeKey = node.key;
		const beforeDropZone = nodeEl.createDiv({ cls: "tree-hierarchy-insert-zone" });
		this.registerInsertDropZone(beforeDropZone, node, "before");
		const header = nodeEl.createDiv({ cls: "tree-hierarchy-node-header" });
		header.draggable = true;
		header.addEventListener("dragstart", (event) => {
			this.draggedNodeKey = node.key;
			header.addClass("is-dragging");
			event.dataTransfer?.setData("text/plain", node.key);
			if (event.dataTransfer) {
				event.dataTransfer.effectAllowed = "move";
			}
		});
		header.addEventListener("dragend", () => {
			this.draggedNodeKey = null;
			header.removeClass("is-dragging");
			this.clearDropIndicators();
		});

		if (node.children.length > 0) {
			const toggle = header.createEl("button", {
				cls: "tree-hierarchy-node-toggle",
				text: this.collapsed.has(node.dbId ?? this.hashNodeKey(node.key)) ? "+" : "-",
			});
			toggle.addEventListener("click", () => {
				this.toggleCollapsed(node);
			});
		} else {
			header.createSpan({ cls: "tree-hierarchy-node-toggle", text: "" });
		}

		const label = header.createEl("button", {
			cls: `tree-hierarchy-node-label ${node.type === "note" ? "is-note" : ""}`,
			text: node.title,
		});
		label.addEventListener("click", () => {
			fireAndForget(this.openNodeFile(node));
		});
		if (node.aliasCount > 1) {
			header.createSpan({
				cls: "tree-hierarchy-alias-badge",
				text: `\u00D7${node.aliasCount}`,
			});
		}
		header.addEventListener("contextmenu", (event) => {
			event.preventDefault();
			this.openNodeContextMenu(event, node);
		});

		if (node.dbId !== null || (node.type === "note" && node.notePath)) {
			header.addClass("is-drop-target");
			header.addEventListener("dragover", (event) => {
				if (!this.canDrop(node)) {
					return;
				}
				event.preventDefault();
				if (event.dataTransfer) {
					event.dataTransfer.dropEffect = "move";
				}
				header.addClass("is-drop-active");
			});
			header.addEventListener("dragleave", () => {
				header.removeClass("is-drop-active");
			});
			header.addEventListener("drop", (event) => {
				header.removeClass("is-drop-active");
				if (!this.canDrop(node)) {
					return;
				}
				event.preventDefault();
				event.stopPropagation();
				fireAndForget(this.dropOnNode(node), (error) => {
					console.error(error);
					new Notice(error instanceof Error ? error.message : "Failed to move node.");
				});
			});
		}

		const collapseKey = node.dbId ?? this.hashNodeKey(node.key);
		if (node.children.length > 0 && !this.collapsed.has(collapseKey)) {
			const childrenEl = nodeEl.createDiv({ cls: "tree-hierarchy-node-children" });
			for (const child of node.children) {
				this.renderNode(childrenEl, child);
			}
		}
		const afterDropZone = nodeEl.createDiv({ cls: "tree-hierarchy-insert-zone" });
		this.registerInsertDropZone(afterDropZone, node, "after");
	}

	private hashNodeKey(value: string): number {
		let hash = 0;
		for (let index = 0; index < value.length; index += 1) {
			hash = (hash * 31 + value.charCodeAt(index)) | 0;
		}
		return hash;
	}

	private registerRootDropZone(treeWrapper: HTMLElement): void {
		treeWrapper.addEventListener("dragover", (event) => {
			if (!this.draggedNodeKey) {
				return;
			}
			event.preventDefault();
			treeWrapper.addClass("is-root-drop-active");
			if (event.dataTransfer) {
				event.dataTransfer.dropEffect = "move";
			}
		});
		treeWrapper.addEventListener("dragleave", (event) => {
			if (event.currentTarget === event.target) {
				treeWrapper.removeClass("is-root-drop-active");
			}
		});
		treeWrapper.addEventListener("drop", (event) => {
			event.preventDefault();
			treeWrapper.removeClass("is-root-drop-active");
			fireAndForget(this.handleDrop(null), (error) => {
				console.error(error);
				new Notice(error instanceof Error ? error.message : "Failed to move node.");
			});
		});
	}

	private registerInsertDropZone(
		dropZone: HTMLElement,
		targetNode: DisplayTreeNode,
		position: "before" | "after",
	): void {
		dropZone.addEventListener("dragover", (event) => {
			if (!this.draggedNodeKey) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			dropZone.addClass("is-drop-active");
			if (event.dataTransfer) {
				event.dataTransfer.dropEffect = "move";
			}
		});
		dropZone.addEventListener("dragleave", () => {
			dropZone.removeClass("is-drop-active");
		});
		dropZone.addEventListener("drop", (event) => {
			event.preventDefault();
			event.stopPropagation();
			dropZone.removeClass("is-drop-active");
			fireAndForget(this.handleSiblingDrop(targetNode, position), (error) => {
				console.error(error);
				new Notice(error instanceof Error ? error.message : "Failed to reorder node.");
			});
		});
	}

	private canDrop(targetNode: DisplayTreeNode): boolean {
		return Boolean(this.draggedNodeKey && (targetNode.dbId !== null || (targetNode.type === "note" && targetNode.notePath)));
	}

	private async handleDrop(parentId: number | null): Promise<void> {
		const draggedNode = this.draggedNodeKey
			? this.plugin.findDisplayNodeByKey(this.draggedNodeKey)
			: null;
		this.draggedNodeKey = null;
		this.clearDropIndicators();
		if (!draggedNode) {
			return;
		}

		try {
			await this.plugin.moveDisplayNode(draggedNode, parentId);
			this.render();
		} catch (error) {
			console.error(error);
			new Notice(error instanceof Error ? error.message : "Failed to move node.");
		}
	}

	private async handleSiblingDrop(targetNode: DisplayTreeNode, position: "before" | "after"): Promise<void> {
		const draggedNode = this.draggedNodeKey
			? this.plugin.findDisplayNodeByKey(this.draggedNodeKey)
			: null;
		this.draggedNodeKey = null;
		this.clearDropIndicators();
		if (!draggedNode) {
			return;
		}

		try {
			const location = this.plugin.findNodeLocation(targetNode.key);
			if (!location) {
				return;
			}
			const targetIndex = position === "before" ? location.index : location.index + 1;
			await this.plugin.moveDisplayNodeToIndex(draggedNode, location.parentId, targetIndex);
			this.render();
		} catch (error) {
			console.error(error);
			new Notice(error instanceof Error ? error.message : "Failed to reorder node.");
		}
	}

	private clearDropIndicators(): void {
		this.contentEl.querySelectorAll(".is-drop-active").forEach((element) => {
			element.removeClass("is-drop-active");
		});
		this.contentEl.querySelectorAll(".is-root-drop-active").forEach((element) => {
			element.removeClass("is-root-drop-active");
		});
	}

	private async openView(): Promise<void> {
		await this.plugin.whenReady();
		await this.plugin.store.syncVaultNotes();
		this.render();
	}

	private toggleCollapsed(node: DisplayTreeNode): void {
		const collapseKey = node.dbId ?? this.hashNodeKey(node.key);
		if (this.collapsed.has(collapseKey)) {
			this.collapsed.delete(collapseKey);
		} else {
			this.collapsed.add(collapseKey);
		}
		this.render();
	}

	private async openNodeFile(node: DisplayTreeNode): Promise<void> {
		if (node.type !== "note" || !node.notePath) {
			return;
		}

		const file = this.app.vault.getAbstractFileByPath(node.notePath);
		if (file instanceof TFile) {
			await this.app.workspace.getLeaf(true).openFile(file);
			return;
		}

		new Notice(`Note file not found: ${node.notePath}`);
	}

	private async dropOnNode(node: DisplayTreeNode): Promise<void> {
		const parentId = await this.plugin.resolveParentIdForNode(node);
		await this.handleDrop(parentId);
	}

	private async moveNodeToRoot(nodeId: number): Promise<void> {
		await this.plugin.store.moveNode(nodeId, null);
		await this.plugin.refreshTreeView();
	}

	private openNodeContextMenu(event: MouseEvent, node: DisplayTreeNode): void {
		const menu = Menu.forEvent(event);

		if (node.dbId !== null || (node.type === "note" && node.notePath)) {
			menu.addItem((item) => {
				item.setTitle("Add child label").onClick(() => {
					fireAndForget(this.plugin.openCreateModalForNode("label", node), (error) => {
						console.error(error);
						new Notice("Failed to open create label dialog.");
					});
				});
			});
			menu.addItem((item) => {
				item.setTitle("Add child note").onClick(() => {
					fireAndForget(this.plugin.openCreateModalForNode("note", node), (error) => {
						console.error(error);
						new Notice("Failed to open create note dialog.");
					});
				});
			});
			menu.addItem((item) => {
				item.setTitle("Add existing note").onClick(() => {
					fireAndForget(this.plugin.openAssignExistingModalForNode(node), (error) => {
						console.error(error);
						new Notice("Failed to open add existing note dialog.");
					});
				});
			});
			menu.addSeparator();
		}

		if (node.dbId !== null) {
			menu.addItem((item) => {
				item.setTitle("Move").onClick(() => {
					new MoveHierarchyNodeModal(this.app, this.plugin, node).open();
				});
			});
		}

		const viewNodeId = node.dbId;
		if (node.type === "note" && node.notePath && viewNodeId !== null && node.parentId !== null) {
			menu.addItem((item) => {
				item.setTitle("Move to root").onClick(() => {
					fireAndForget(this.moveNodeToRoot(viewNodeId), (error) => {
						console.error(error);
						new Notice("Failed to move node.");
					});
				});
			});
		}

		if (node.type === "note" && node.notePath && node.dbId !== null) {
			menu.addSeparator();
			menu.addItem((item) => {
				item.setTitle("Add as alias elsewhere").onClick(() => {
					this.plugin.openAddAliasModal(node);
				});
			});
			menu.addItem((item) => {
				item.setTitle("Remove from hierarchy").onClick(() => {
					fireAndForget(this.plugin.removeNodeFromHierarchy(node.dbId as number), (error) => {
						console.error(error);
						new Notice(error instanceof Error ? error.message : "Failed to remove node.");
					});
				});
			});
		}

		menu.addSeparator();
		menu.addItem((item) => {
			item.setTitle("Create parent label").onClick(() => {
				new CreateParentHierarchyItemModal(this.app, this.plugin, "label", node).open();
			});
		});
		menu.addItem((item) => {
			item.setTitle("Create parent note").onClick(() => {
				new CreateParentHierarchyItemModal(this.app, this.plugin, "note", node).open();
			});
		});
		menu.showAtMouseEvent(event);
	}

	revealNode(nodeKey: string, ancestorDbIds: number[]): void {
		for (const id of ancestorDbIds) {
			this.collapsed.delete(id);
		}
		this.render();
		window.requestAnimationFrame(() => {
			const target = this.contentEl.querySelector(`[data-node-key="${nodeKey}"]`);
			if (target instanceof HTMLElement) {
				const header = target.querySelector(".tree-hierarchy-node-header");
				if (header instanceof HTMLElement) {
					header.scrollIntoView({ behavior: "smooth", block: "center" });
					header.addClass("is-search-highlight");
					window.setTimeout(() => {
						header.removeClass("is-search-highlight");
					}, 2000);
				}
			}
		});
	}
}

class SearchHierarchyModal extends SuggestModal<SearchableNode> {
	private allNodes: SearchableNode[] = [];

	constructor(
		app: App,
		private readonly plugin: SQLiteTreeHierarchyPlugin,
		private readonly source: "sidebar" | "popup",
	) {
		super(app);
		this.setPlaceholder("Search hierarchy...");
		this.allNodes = flattenTree(this.plugin.getDisplayTree());
	}

	getSuggestions(query: string): SearchableNode[] {
		if (!query.trim()) {
			return this.allNodes;
		}
		const lower = query.toLowerCase();
		return this.allNodes.filter((item) => item.breadcrumb.toLowerCase().includes(lower));
	}

	renderSuggestion(item: SearchableNode, el: HTMLElement): void {
		const wrapper = el.createDiv({ cls: "tree-hierarchy-search-suggestion" });
		const icon = item.node.type === "note" ? "\u{1F4C4}" : "\u{1F4C1}";
		wrapper.createSpan({ cls: "tree-hierarchy-search-icon", text: icon });
		const textWrapper = wrapper.createDiv({ cls: "tree-hierarchy-search-text" });
		textWrapper.createDiv({ cls: "tree-hierarchy-search-title", text: item.node.title });
		if (item.breadcrumb !== item.node.title) {
			textWrapper.createDiv({ cls: "tree-hierarchy-search-breadcrumb", text: item.breadcrumb });
		}
	}

	onChooseSuggestion(item: SearchableNode): void {
		this.plugin.revealNodeInView(item.node.key, item.ancestorDbIds, this.source);
	}
}

class SearchMoveModal extends SuggestModal<{ id: number | null; label: string }> {
	private allTargets: Array<{ id: number | null; label: string }>;
	private onSelect: (target: number | null) => void;

	constructor(
		app: App,
		targets: Array<{ id: number; label: string }>,
		onSelect: (target: number | null) => void,
	) {
		super(app);
		this.setPlaceholder("Search target parent...");
		this.allTargets = [{ id: null, label: "Root level" }, ...targets];
		this.onSelect = onSelect;
	}

	getSuggestions(query: string): Array<{ id: number | null; label: string }> {
		if (!query.trim()) {
			return this.allTargets;
		}
		const lower = query.toLowerCase();
		return this.allTargets.filter((item) => item.label.toLowerCase().includes(lower));
	}

	renderSuggestion(item: { id: number | null; label: string }, el: HTMLElement): void {
		el.createDiv({ cls: "tree-hierarchy-search-suggestion", text: item.label });
	}

	onChooseSuggestion(item: { id: number | null; label: string }): void {
		this.onSelect(item.id);
	}
}

class TreeHierarchySettingTab extends PluginSettingTab {
	constructor(app: App, private readonly plugin: SQLiteTreeHierarchyPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Database file name")
			.setDesc("SQLite file name stored in the plugin folder inside the vault config directory.")
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_DB_FILENAME)
					.setValue(this.plugin.settings.dbFileName)
					.onChange((value) => {
						fireAndForget(this.plugin.updateDatabaseFileName(value), (error) => {
							console.error(error);
							new Notice("Failed to update database file name.");
						});
					}),
			);

		new Setting(containerEl)
			.setName("Backup database")
			.setDesc(this.plugin.settings.backupDbPath || "No backup location selected.")
			.addButton((button) =>
				button.setButtonText("Set location").onClick(() => {
					fireAndForget(this.handleBackupBrowse(button.buttonEl));
				}),
			)
			.addButton((button) =>
				button.setButtonText("Back up").onClick(() => {
					fireAndForget(this.plugin.backupNow(), (error) => {
						console.error(error);
						new Notice(error instanceof Error ? error.message : "Failed to create backup.");
					});
				}),
			);

		new Setting(containerEl)
			.setName("Restore database")
			.setDesc("Pick the backup file to restore from.")
			.addButton((button) =>
				button.setButtonText("Restore").onClick(() => {
					fireAndForget(this.handleRestoreBrowse(button.buttonEl), (error) => {
						console.error(error);
						new Notice(error instanceof Error ? error.message : "Failed to restore backup.");
					});
				}),
			);

		new Setting(containerEl)
			.setName("Notes root folder")
			.setDesc("Vault folder used for notes created from the hierarchy.")
			.addText((text) =>
				text
					.setPlaceholder("Vault root")
					.setValue(this.plugin.settings.noteRootFolder)
					.onChange((value) => {
						fireAndForget(this.plugin.updateNoteRootFolder(value), (error) => {
							console.error(error);
							new Notice("Failed to save note root folder.");
						});
					}),
			);

		new Setting(containerEl)
			.setName("Note file format")
			.setDesc("File extension for notes created from the hierarchy.")
			.addDropdown((dropdown) =>
				dropdown
					.addOption(".md", "Markdown (.md)")
					.addOption(".html", "HTML (.html)")
					.addOption(".htm", "HTML (.htm)")
					.setValue(this.plugin.settings.noteExtension)
					.onChange((value) => {
						fireAndForget(this.plugin.updateNoteExtension(value), (error) => {
							console.error(error);
							new Notice("Failed to save note file format.");
						});
					}),
			);

		new Setting(containerEl)
			.setName("Documentation")
			.setDesc("Open the plugin README for a full feature overview.")
			.addButton((button) =>
				button.setButtonText("View readme").onClick(() => {
					window.open("https://github.com/dhiraj-ydv/hierarchy-view/blob/master/README.md", "_blank");
				}),
			);
	}

	private async handleBackupBrowse(buttonEl: HTMLButtonElement): Promise<void> {
		buttonEl.blur();
		const pickedPath = await this.plugin.pickBackupPath();
		if (!pickedPath) {
			return;
		}
		await this.plugin.updateBackupDbPath(pickedPath);
		this.display();
	}

	private async handleRestoreBrowse(buttonEl: HTMLButtonElement): Promise<void> {
		buttonEl.blur();
		await this.plugin.restoreFromBackupNow();
	}
}

export default class SQLiteTreeHierarchyPlugin extends Plugin {
	settings: TreeHierarchySettings = DEFAULT_SETTINGS;
	store = new TreeHierarchyStore(this);
	private popupModal: TreeHierarchyPopupModal | null = null;
	private startupPromise: Promise<void> | null = null;

	onload(): void {
		this.registerView(
			VIEW_TYPE_TREE_HIERARCHY,
			(leaf) => new TreeHierarchyView(leaf, this),
		);

		this.addRibbonIcon("workflow", "Open hierarchy view", () => {
			this.openPopup();
		});

		this.app.workspace.onLayoutReady(() => {
			fireAndForget(this.ensureSidebarTab(), (error) => {
				console.error(error);
			});
		});

		this.addCommand({
			id: "open-tree-hierarchy",
			name: "Open sidebar",
			callback: () => {
				fireAndForget(this.activateView(), (error) => {
					console.error(error);
					new Notice("Failed to open hierarchy view.");
				});
			},
		});

		this.addCommand({
			id: "create-root-hierarchy-note",
			name: "Create root note",
			callback: () => {
				new CreateHierarchyItemModal(this.app, this, "note", null).open();
			},
		});

		this.addCommand({
			id: "backup-database-now",
			name: "Back up database now",
			callback: () => {
				fireAndForget(this.backupNow(), (error) => {
					console.error(error);
					new Notice(error instanceof Error ? error.message : "Failed to create backup.");
				});
			},
		});

		this.addCommand({
			id: "restore-database-from-backup",
			name: "Restore database from backup",
			callback: () => {
				fireAndForget(this.restoreFromBackupNow(), (error) => {
					console.error(error);
					new Notice(error instanceof Error ? error.message : "Failed to restore backup.");
				});
			},
		});

		this.addCommand({
			id: "search-hierarchy",
			name: "Search hierarchy",
			callback: () => {
				this.openSearchModal("sidebar");
			},
		});

		this.addSettingTab(new TreeHierarchySettingTab(this.app, this));
		this.startupPromise = this.initializePlugin();
		fireAndForget(this.startupPromise, (error) => {
			console.error("Failed to initialize hierarchy view", error);
			new Notice("Hierarchy view failed to initialize. Check the developer console.");
		});
	}

	onunload(): void {
		this.popupModal?.close();
		this.popupModal = null;
	}

	async loadSettings(): Promise<void> {
		const savedSettings = (await this.loadData()) as Partial<TreeHierarchySettings> | null;
		const recoveryState = await this.readRecoveryState();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, savedSettings ?? {});
		if (!this.settings.backupDbPath && recoveryState.backupDbPath) {
			this.settings.backupDbPath = recoveryState.backupDbPath;
		}
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		await this.writeRecoveryState({
			backupDbPath: this.settings.backupDbPath,
		});
	}

	async reloadStore(): Promise<void> {
		this.store = new TreeHierarchyStore(this);
		await this.store.initialize();
		await this.store.syncVaultNotes();
		await this.refreshTreeView();
	}

	async activateView(): Promise<void> {
		const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_TREE_HIERARCHY)[0];
		if (existing) {
			await existing.setViewState({ type: VIEW_TYPE_TREE_HIERARCHY, active: true });
			this.app.workspace.revealLeaf(existing);
			return;
		}

		let leaf = this.app.workspace.getLeftLeaf(false);
		if (!leaf) {
			leaf = this.app.workspace.getLeftLeaf(true);
		}
		if (!leaf) {
			return;
		}

		await leaf.setViewState({ type: VIEW_TYPE_TREE_HIERARCHY, active: true });
		this.app.workspace.revealLeaf(leaf);
	}

	private async ensureSidebarTab(): Promise<void> {
		const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_TREE_HIERARCHY)[0];
		if (existing) {
			return;
		}

		let leaf = this.app.workspace.getLeftLeaf(false);
		if (!leaf) {
			leaf = this.app.workspace.getLeftLeaf(true);
		}
		if (!leaf) {
			return;
		}

		await leaf.setViewState({ type: VIEW_TYPE_TREE_HIERARCHY, active: false, pinned: true });
	}
	async refreshTreeView(skipReady = false): Promise<void> {
		if (!skipReady) {
			await this.whenReady();
		}
		await this.store.syncVaultNotes();
		if (this.popupModal) {
			await this.popupModal.render();
		}
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_TREE_HIERARCHY)) {
			const view = leaf.view;
			if (view instanceof TreeHierarchyView) {
				view.render();
			}
		}
	}

	async createNoteInHierarchy(title: string, parentId: number | null, folder: string): Promise<number> {
		const normalizedFolder = folder.replace(/^\/+|\/+$/g, "");
		if (normalizedFolder) {
			await this.ensureFolderExists(normalizedFolder);
		}

		const safeTitle = title.replace(/[\\/:*?"<>|#^\]]/g, "").trim() || "Untitled";
		const extension = this.settings.noteExtension || ".md";
		const notePath = normalizedFolder ? `${normalizedFolder}/${safeTitle}${extension}` : `${safeTitle}${extension}`;
		const uniquePath = this.getAvailableNotePath(notePath, extension);
		const fileContent = extension === ".html" || extension === ".htm"
			? `<!DOCTYPE html>\n<html>\n<head>\n<title>${title}</title>\n</head>\n<body>\n<h1>${title}</h1>\n</body>\n</html>`
			: `# ${title}\n`;
		const file = await this.app.vault.create(uniquePath, fileContent);
		const createdId = await this.store.createNoteNode(title, parentId, file.path);
		await this.app.workspace.getLeaf(true).openFile(file);
		return createdId;
	}

	async createParentForNode(
		targetNode: DisplayTreeNode,
		type: NodeType,
		title: string,
		folder: string,
	): Promise<void> {
		const location = this.findNodeLocation(targetNode.key);
		if (!location) {
			throw new Error("Could not determine the target node location.");
		}

		const targetNodeId = await this.resolveNodeIdForDisplayNode(targetNode);
		if (targetNodeId === null) {
			throw new Error("Could not resolve the target node.");
		}

		const newParentId =
			type === "label"
				? await this.store.createLabel(title, location.parentId)
				: await this.createNoteInHierarchy(title, location.parentId, folder);

		const refreshedLocation = this.findNodeLocation(targetNode.key);
		if (!refreshedLocation) {
			throw new Error("Could not refresh the target node location.");
		}

		await this.store.moveNodeToIndex(newParentId, refreshedLocation.parentId, refreshedLocation.index);
		await this.store.moveNodeToIndex(targetNodeId, newParentId, 0);
	}

	private async ensureFolderExists(path: string): Promise<void> {
		const parts = path.split("/").filter(Boolean);
		let current = "";
		for (const part of parts) {
			current = current ? `${current}/${part}` : part;
			if (!this.app.vault.getAbstractFileByPath(current)) {
				await this.app.vault.createFolder(current);
			}
		}
	}

	private getAvailableNotePath(notePath: string, extension: string): string {
		if (!this.app.vault.getAbstractFileByPath(notePath)) {
			return notePath;
		}

		const basePath = notePath.endsWith(extension) ? notePath.slice(0, -extension.length) : notePath;
		let suffix = 1;
		let candidate = `${basePath} ${suffix}${extension}`;
		while (this.app.vault.getAbstractFileByPath(candidate)) {
			suffix += 1;
			candidate = `${basePath} ${suffix}${extension}`;
		}
		return candidate;
	}

	getDisplayTree(): DisplayTreeNode[] {
		const storedTree = this.store.getTree();
		const notePathCounts = this.store.getNotePathCounts();
		return this.mapStoredNodes(storedTree, notePathCounts);
	}

	findDisplayNodeByKey(targetKey: string): DisplayTreeNode | null {
		const walk = (nodes: DisplayTreeNode[]): DisplayTreeNode | null => {
			for (const node of nodes) {
				if (node.key === targetKey) {
					return node;
				}
				const match = walk(node.children);
				if (match) {
					return match;
				}
			}
			return null;
		};

		return walk(this.getDisplayTree());
	}

	findNodeLocation(targetKey: string): { parentId: number | null; index: number } | null {
		const walk = (nodes: DisplayTreeNode[], parentId: number | null): { parentId: number | null; index: number } | null => {
			for (let index = 0; index < nodes.length; index += 1) {
				const node = nodes[index];
				if (node.key === targetKey) {
					return { parentId, index };
				}
				const childResult = walk(node.children, node.dbId);
				if (childResult) {
					return childResult;
				}
			}
			return null;
		};

		return walk(this.getDisplayTree(), null);
	}

	getDisplaySiblings(parentId: number | null): DisplayTreeNode[] {
		if (parentId === null) {
			return this.getDisplayTree();
		}

		const parentNode = this.findDisplayNodeByKey(`db:${parentId}`);
		return parentNode?.children ?? [];
	}

	getRootAttachableNotes(): TFile[] {
		const rootNotes = this.getDisplayTree().filter((node) => node.type === "note" && node.parentId === null && node.notePath);
		return rootNotes
			.map((node) => this.app.vault.getAbstractFileByPath(node.notePath as string))
			.filter((file): file is TFile => file instanceof TFile);
	}

	async moveDisplayNode(node: DisplayTreeNode, parentId: number | null): Promise<void> {
		await this.moveDisplayNodeToIndex(node, parentId, null);
	}

	async moveDisplayNodeToIndex(node: DisplayTreeNode, parentId: number | null, index: number | null): Promise<void> {
		const nodeId = node.dbId ?? (node.notePath ? await this.resolveParentIdForNode(node) : null);
		if (nodeId === null) {
			return;
		}

		await this.store.moveNodeToIndex(nodeId, parentId, index);
	}

	async resolveParentIdForNode(node: DisplayTreeNode): Promise<number | null> {
		if (node.dbId !== null) {
			return node.dbId;
		}

		if (node.type === "note" && node.notePath) {
			const file = this.app.vault.getAbstractFileByPath(node.notePath);
			if (!(file instanceof TFile)) {
				throw new Error("Note file no longer exists.");
			}
			return await this.store.ensureTrackedNote(file.basename, file.path);
		}

		return null;
	}

	async resolveNodeIdForDisplayNode(node: DisplayTreeNode): Promise<number | null> {
		if (node.dbId !== null) {
			return node.dbId;
		}
		if (node.type === "note" && node.notePath) {
			const file = this.app.vault.getAbstractFileByPath(node.notePath);
			if (!(file instanceof TFile)) {
				throw new Error("Note file no longer exists.");
			}
			return await this.store.ensureTrackedNote(file.path, file.path);
		}
		return null;
	}

	async openCreateModalForNode(type: NodeType, node: DisplayTreeNode): Promise<void> {
		const parentId = await this.resolveParentIdForNode(node);
		new CreateHierarchyItemModal(this.app, this, type, parentId).open();
		await this.refreshTreeView();
	}

	async openAssignExistingModalForNode(node: DisplayTreeNode): Promise<void> {
		const parentId = await this.resolveParentIdForNode(node);
		new AssignExistingNoteModal(this.app, this, parentId).open();
		await this.refreshTreeView();
	}

	openPopup(): void {
		if (this.popupModal) {
			this.popupModal.close();
		}
		this.popupModal = new TreeHierarchyPopupModal(this.app, this);
		this.popupModal.open();
	}

	openSearchModal(source: "sidebar" | "popup"): void {
		new SearchHierarchyModal(this.app, this, source).open();
	}

	openAddAliasModal(node: DisplayTreeNode): void {
		const targets = this.store.getParentTargets(node.dbId ?? undefined);
		new SearchMoveModal(this.app, targets, (selectedParent: number | null) => {
			if (!node.notePath) {
				return;
			}
			fireAndForget(this.createAliasAtTarget(node.notePath, node.title, selectedParent), (error) => {
				console.error(error);
				new Notice(error instanceof Error ? error.message : "Failed to create alias.");
			});
		}).open();
	}

	private async createAliasAtTarget(notePath: string, title: string, parentId: number | null): Promise<void> {
		await this.store.createNoteAlias(notePath, title, parentId);
		await this.refreshTreeView();
		new Notice("Alias created.");
	}

	async removeNodeFromHierarchy(nodeId: number): Promise<void> {
		await this.store.removeNode(nodeId);
		await this.refreshTreeView();
		new Notice("Removed from hierarchy.");
	}

	revealNodeInView(nodeKey: string, ancestorDbIds: number[], source: "sidebar" | "popup"): void {
		if (source === "popup" && this.popupModal) {
			fireAndForget(this.popupModal.revealNode(nodeKey, ancestorDbIds), (error) => {
				console.error("Failed to reveal node in popup", error);
			});
		} else {
			for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_TREE_HIERARCHY)) {
				const view = leaf.view;
				if (view instanceof TreeHierarchyView) {
					view.revealNode(nodeKey, ancestorDbIds);
				}
			}
		}
	}

	async whenReady(): Promise<void> {
		if (this.startupPromise) {
			await this.startupPromise;
		}
	}

	onPopupClosed(modal: TreeHierarchyPopupModal): void {
		if (this.popupModal === modal) {
			this.popupModal = null;
		}
	}

	private mapStoredNodes(nodes: TreeNodeRecord[], notePathCounts: Map<string, number>): DisplayTreeNode[] {
		return nodes.map((node) => ({
			key: `db:${node.id}`,
			dbId: node.id,
			parentId: node.parentId,
			type: node.type,
			title: node.title,
			notePath: node.notePath,
			children: this.mapStoredNodes(node.children, notePathCounts),
			isAssigned: true,
			aliasCount: node.notePath ? (notePathCounts.get(node.notePath) ?? 0) : 0,
		}));
	}

	getDatabaseDirectory(): string {
		return this.getPluginDirectory();
	}

	getDatabasePath(): string {
		return normalizePath(`${this.getDatabaseDirectory()}/${this.settings.dbFileName}`);
	}

	getPluginDirectory(): string {
		return normalizePath(`${this.app.vault.configDir}/plugins/${this.manifest.id}`);
	}

	private async initializePlugin(): Promise<void> {
		await this.loadSettings();
		await this.store.initialize();
		await this.store.syncVaultNotes();
		await this.refreshTreeView(true);
	}

	async updateDatabaseFileName(value: string): Promise<void> {
		this.settings.dbFileName = value.trim() || DEFAULT_DB_FILENAME;
		await this.saveSettings();
		await this.reloadStore();
	}

	async updateBackupDbPath(value: string): Promise<void> {
		this.settings.backupDbPath = value.trim();
		await this.saveSettings();
	}

	async pickBackupPath(): Promise<string | null> {
		const pickedPath = await this.showSystemPathPicker({
			type: "directory",
			title: "Choose backup directory",
		});
		return pickedPath;
	}

	async pickRestoreFilePath(): Promise<string | null> {
		const pickedPath = await this.showSystemPathPicker({
			type: "file",
			title: "Choose backup file to restore",
		});
		return pickedPath;
	}

	async updateNoteRootFolder(value: string): Promise<void> {
		this.settings.noteRootFolder = value.trim();
		await this.saveSettings();
	}

	async updateNoteExtension(value: string): Promise<void> {
		this.settings.noteExtension = value;
		await this.saveSettings();
	}

	async backupNow(): Promise<void> {
		await this.whenReady();
		await this.store.syncVaultNotes();
		if (!this.settings.backupDbPath.trim()) {
			throw new Error("Set a backup database path first.");
		}
		await this.writeBackupDatabase(this.store.exportDatabaseBytes());
		new Notice("Hierarchy view database backup updated.");
	}

	async restoreFromBackupNow(): Promise<void> {
		const pickedPath = await this.pickRestoreFilePath();
		if (!pickedPath) {
			throw new Error("Restore cancelled.");
		}
		const backupBytes = await this.readBackupFile(pickedPath);
		if (!backupBytes) {
			throw new Error("Backup database was not found.");
		}

		const adapter = this.app.vault.adapter as typeof this.app.vault.adapter & {
			exists(path: string, sensitive?: boolean): Promise<boolean>;
			mkdir(path: string): Promise<void>;
			writeBinary(path: string, data: ArrayBuffer): Promise<void>;
		};
		const primaryDir = this.getDatabaseDirectory();
		if (!(await adapter.exists(primaryDir))) {
			await adapter.mkdir(primaryDir);
		}
		// Restoring always replaces the current primary plugin database.
		await adapter.writeBinary(this.getDatabasePath(), toArrayBuffer(backupBytes));
		await this.reloadStore();
		new Notice("Hierarchy view database restored from backup.");
	}

	async writeBackupDatabase(data: Uint8Array): Promise<void> {
		const backupPath = this.settings.backupDbPath.trim();
		if (!backupPath) {
			return;
		}

		const target = await this.resolveBackupTarget(backupPath);
		if (target.type === "directory") {
			await fs.mkdir(target.path, { recursive: true });
			const backupFilePath = path.join(target.path, this.createBackupFileName());
			await fs.writeFile(backupFilePath, data);
			return;
		}

		await fs.mkdir(path.dirname(target.path), { recursive: true });
		await fs.writeFile(target.path, data);
	}

	async readBackupDatabase(): Promise<Uint8Array | null> {
		const backupPath = this.settings.backupDbPath.trim();
		if (!backupPath) {
			return null;
		}

		const target = await this.resolveBackupTarget(backupPath);
		const resolvedPath =
			target.type === "directory"
				? await this.findLatestBackupFile(target.path)
				: target.path;
		if (!resolvedPath) {
			return null;
		}
		try {
			const data = await fs.readFile(resolvedPath);
			return new Uint8Array(data);
		} catch {
			return null;
		}
	}

	async readBackupFile(targetPath: string): Promise<Uint8Array | null> {
		try {
			const data = await fs.readFile(targetPath);
			return new Uint8Array(data);
		} catch {
			return null;
		}
	}

	private async resolveBackupTarget(configuredPath: string): Promise<{ type: "directory" | "file"; path: string }> {
		const resolvedPath = this.resolveConfiguredBackupPath(configuredPath);
		const pathInfo = await this.getPathInfo(resolvedPath);
		if (pathInfo?.isDirectory) {
			return { type: "directory", path: resolvedPath };
		}
		if (pathInfo?.exists) {
			return { type: "file", path: resolvedPath };
		}
		if (this.looksLikeDirectoryPath(configuredPath)) {
			return { type: "directory", path: resolvedPath };
		}
		return { type: "file", path: resolvedPath };
	}

	private resolveConfiguredBackupPath(configuredPath: string): string {
		if (path.isAbsolute(configuredPath)) {
			return configuredPath;
		}
		const vaultBasePath = this.getVaultBasePath();
		return path.resolve(vaultBasePath, configuredPath);
	}

	private looksLikeDirectoryPath(configuredPath: string): boolean {
		const trimmed = configuredPath.trim();
		if (!trimmed) {
			return false;
		}
		if (trimmed.endsWith("/") || trimmed.endsWith("\\")) {
			return true;
		}
		return path.extname(trimmed) === "";
	}

	private async getPathInfo(targetPath: string): Promise<{ exists: boolean; isDirectory: boolean } | null> {
		try {
			const stat = await fs.stat(targetPath);
			return {
				exists: true,
				isDirectory: stat.isDirectory(),
			};
		} catch {
			return null;
		}
	}

	private createBackupFileName(): string {
		const now = new Date();
		const datePart = [
			String(now.getDate()).padStart(2, "0"),
			String(now.getMonth() + 1).padStart(2, "0"),
			String(now.getFullYear()),
		].join("");
		const timePart = [
			String(now.getHours()).padStart(2, "0"),
			String(now.getMinutes()).padStart(2, "0"),
			String(now.getSeconds()).padStart(2, "0"),
		].join("");
		const vaultName = this.getSanitizedVaultName();
		return `hv_${vaultName}_${datePart}_${timePart}.sqlite`;
	}

	private getSanitizedVaultName(): string {
		const vaultName = this.app.vault.getName().trim() || "vault";
		const safeName = vaultName
			.toLowerCase()
			.replace(/[^a-z0-9._-]+/g, "-")
			.replace(/-+/g, "-")
			.replace(/^-|-$/g, "");
		return safeName || "vault";
	}

	private async findLatestBackupFile(directoryPath: string): Promise<string | null> {
		try {
			const entries = await fs.readdir(directoryPath, { withFileTypes: true });
			const backupFiles = entries
				.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".sqlite"))
				.map((entry) => path.join(directoryPath, entry.name));
			if (backupFiles.length === 0) {
				return null;
			}

			const filesWithStats = await Promise.all(
				backupFiles.map(async (filePath) => ({
					filePath,
					stat: await fs.stat(filePath),
				})),
			);
			filesWithStats.sort((left, right) => right.stat.mtimeMs - left.stat.mtimeMs);
			return filesWithStats[0].filePath;
		} catch {
			return null;
		}
	}

	private getVaultBasePath(): string {
		const adapter = this.app.vault.adapter as typeof this.app.vault.adapter & {
			getBasePath?: () => string;
			basePath?: string;
		};

		if (typeof adapter.getBasePath === "function") {
			return adapter.getBasePath();
		}
		if (typeof adapter.basePath === "string" && adapter.basePath) {
			return adapter.basePath;
		}

		throw new Error("Could not resolve the vault base path for the backup database.");
	}

	private async readRecoveryState(): Promise<RecoveryState> {
		try {
			const raw = await fs.readFile(this.getRecoveryStatePath(), "utf8");
			const parsed = JSON.parse(raw) as Partial<RecoveryState>;
			return {
				backupDbPath: typeof parsed.backupDbPath === "string" ? parsed.backupDbPath : "",
			};
		} catch {
			return {
				backupDbPath: "",
			};
		}
	}

	private async writeRecoveryState(state: RecoveryState): Promise<void> {
		const recoveryPath = this.getRecoveryStatePath();
		await fs.mkdir(path.dirname(recoveryPath), { recursive: true });
		await fs.writeFile(recoveryPath, JSON.stringify(state, null, 2), "utf8");
	}

	private getRecoveryStatePath(): string {
		return path.join(this.getVaultBasePath(), this.app.vault.configDir, `${this.manifest.id}-recovery.json`);
	}

	private async showSystemPathPicker(options: {
		type: "directory" | "file";
		title: string;
	}): Promise<string | null> {
		const electronDialogPath = await this.pickPathWithElectron(options);
		if (electronDialogPath) {
			return electronDialogPath;
		}
		return this.pickPathWithHtmlInput(options);
	}

	private async pickPathWithElectron(options: {
		type: "directory" | "file";
		title: string;
	}): Promise<string | null> {
		try {
			const win = window as Window & {
				require?: (moduleName: string) => {
					dialog?: {
						showOpenDialog: (dialogOptions: {
							title: string;
							properties: string[];
							filters?: Array<{ name: string; extensions: string[] }>;
						}) => Promise<{ canceled: boolean; filePaths: string[] }>;
					};
					remote?: {
						dialog?: {
							showOpenDialog: (dialogOptions: {
								title: string;
								properties: string[];
								filters?: Array<{ name: string; extensions: string[] }>;
							}) => Promise<{ canceled: boolean; filePaths: string[] }>;
						};
					};
				};
			};
			const electron = win.require?.("electron");
			const dialog = electron?.remote?.dialog ?? electron?.dialog;
			if (!dialog?.showOpenDialog) {
				return null;
			}

			const result = await dialog.showOpenDialog({
				title: options.title,
				properties:
					options.type === "directory"
						? ["openDirectory", "createDirectory"]
						: ["openFile"],
				filters:
					options.type === "file"
						? [{ name: "SQLite", extensions: ["sqlite", "db"] }]
						: undefined,
			});
			if (result.canceled || result.filePaths.length === 0) {
				return null;
			}
			return result.filePaths[0];
		} catch {
			return null;
		}
	}

	private pickPathWithHtmlInput(options: {
		type: "directory" | "file";
		title: string;
	}): Promise<string | null> {
		return new Promise((resolve) => {
			const input = document.createElement("input");
			input.type = "file";
			input.setCssProps({
				display: "none",
			});
			if (options.type === "directory") {
				input.setAttribute("webkitdirectory", "");
			} else {
				input.accept = ".sqlite,.db";
			}

			const cleanup = (): void => {
				input.remove();
			};

			input.addEventListener(
				"change",
				() => {
					const files = input.files;
					if (!files || files.length === 0) {
						cleanup();
						resolve(null);
						return;
					}

					const file = files[0] as File & { path?: string; webkitRelativePath?: string };
					if (options.type === "directory") {
						const filePath = file.path;
						const relativePath = file.webkitRelativePath;
						if (filePath && relativePath) {
							const normalizedRelativePath = relativePath.replace(/\//g, path.sep);
							const directoryPath = filePath.slice(0, filePath.length - normalizedRelativePath.length);
							cleanup();
							resolve(directoryPath.replace(/[\\/]+$/, ""));
							return;
						}
					}

					cleanup();
					resolve(file.path ?? null);
				},
				{ once: true },
			);

			document.body.appendChild(input);
			input.click();
		});
	}
}
