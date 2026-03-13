import {
	App,
	ItemView,
	Modal,
	Notice,
	normalizePath,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
	WorkspaceLeaf,
} from "obsidian";
import initSqlJs from "sql.js";

const VIEW_TYPE_TREE_HIERARCHY = "sqlite-tree-hierarchy-view";
const DEFAULT_DB_FILENAME = "tree-hierarchy.sqlite";

type NodeType = "group" | "note";
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
	noteRootFolder: string;
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
}

const DEFAULT_SETTINGS: TreeHierarchySettings = {
	dbFileName: DEFAULT_DB_FILENAME,
	noteRootFolder: "",
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
				type TEXT NOT NULL CHECK(type IN ('group', 'note')),
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
	}

	async save(): Promise<void> {
		if (!this.db) {
			return;
		}

		const exported = this.db.export();
		const fileData = new Uint8Array(exported);
		const adapter = this.plugin.app.vault.adapter as typeof this.plugin.app.vault.adapter & {
			writeBinary(path: string, data: ArrayBuffer): Promise<void>;
		};
		await adapter.writeBinary(this.plugin.getDatabasePath(), fileData.buffer);
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

	async createGroup(title: string, parentId: number | null): Promise<void> {
		this.runInsert("group", title, parentId, null);
		await this.save();
	}

	async createNoteNode(title: string, parentId: number | null, notePath: string): Promise<void> {
		this.runInsert("note", title, parentId, notePath);
		await this.save();
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
		for (const file of this.plugin.app.vault.getMarkdownFiles()) {
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
			if (!target || target.type !== "group") {
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

	private runInsert(type: NodeType, title: string, parentId: number | null, notePath: string | null): void {
		const sortOrder = this.getNextSortOrder(parentId);
		this.db?.run(
			`INSERT INTO nodes(parent_id, type, title, note_path, sort_order, updated_at)
			 VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
			[parentId, type, title, notePath, sortOrder],
		);
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

		this.titleEl.setText(this.type === "group" ? "Create hierarchy group" : "Create note");

		let title = "";
		const titleLabel = contentEl.createEl("label", { text: this.type === "group" ? "Group name" : "Note title" });
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
			text: this.type === "group" ? "Create group" : "Create note",
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

		if (this.type === "group") {
			await this.plugin.store.createGroup(title, this.parentId);
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

class MoveHierarchyNodeModal extends Modal {
	constructor(
		app: App,
		private readonly plugin: SQLiteTreeHierarchyPlugin,
		private readonly node: DisplayTreeNode,
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("tree-hierarchy-modal");
		this.titleEl.setText(`Move ${this.node.type}`);

		const targets = this.plugin.store.getParentTargets(this.node.dbId ?? undefined);
		let selectedParent: number | null = targets[0]?.id ?? null;

		const label = contentEl.createEl("label", { text: "Target parent" });
		const select = label.createEl("select");
		select.createEl("option", {
			value: "",
			text: "Root level",
		});
		for (const target of targets) {
			select.createEl("option", {
				value: String(target.id),
				text: target.label,
			});
		}
		select.addEventListener("change", () => {
			selectedParent = select.value ? Number(select.value) : null;
		});

		const moveButton = contentEl.createEl("button", { text: "Apply" });
		moveButton.addEventListener("click", () => {
			fireAndForget(this.handleMove(selectedParent), (error) => {
				console.error(error);
				new Notice(error instanceof Error ? error.message : "Failed to move node.");
			});
		});
	}

	onClose(): void {
		this.contentEl.empty();
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
			await this.plugin.store.syncVaultNotes();
			const container = this.contentEl;
			const previousTree = container.querySelector(".tree-hierarchy-tree");
			if (previousTree instanceof HTMLElement) {
				this.treeScrollTop = previousTree.scrollTop;
			}
			container.empty();
			container.addClass("tree-hierarchy-view");

			const toolbar = container.createDiv({ cls: "tree-hierarchy-toolbar" });
			const addRootGroupButton = toolbar.createEl("button", { text: "New root group" });
			addRootGroupButton.addEventListener("click", () => {
				new CreateHierarchyItemModal(this.app, this.plugin, "group", null).open();
			});

			const addRootNoteButton = toolbar.createEl("button", { text: "New root note" });
			addRootNoteButton.addEventListener("click", () => {
				new CreateHierarchyItemModal(this.app, this.plugin, "note", null).open();
			});

			const treeWrapper = container.createDiv({ cls: "tree-hierarchy-tree" });
			treeWrapper.scrollTop = this.treeScrollTop;
			this.registerRootDropZone(treeWrapper);
			treeWrapper.createDiv({
				cls: "tree-hierarchy-dropzone",
				text: "Drop here to move to root",
			});

			const tree = this.plugin.getDisplayTree();
			if (tree.length === 0) {
				treeWrapper.createDiv({
					cls: "tree-hierarchy-empty",
					text: "No hierarchy yet. Create a group, create a note, or assign an existing vault note.",
				});
				return;
			}

			for (const node of tree) {
				this.renderNode(treeWrapper, node);
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
			const addGroup = actions.createEl("button", { text: "+G" });
			addGroup.addEventListener("click", () => {
				void this.plugin.openCreateModalForNode("group", node);
			});

			const addNote = actions.createEl("button", { text: "+N" });
			addNote.addEventListener("click", () => {
				void this.plugin.openCreateModalForNode("note", node);
			});

			const addExisting = actions.createEl("button", { text: "+E" });
			addExisting.addEventListener("click", () => {
				void this.plugin.openAssignExistingModalForNode(node);
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
			const rootButton = actions.createEl("button", { text: "To root" });
			rootButton.addEventListener("click", () => {
				fireAndForget(this.moveNodeToRoot(popupNodeId), (error) => {
					console.error(error);
					new Notice("Failed to move node.");
				});
			});
		}

		const collapseKey = node.dbId ?? this.hashNodeKey(node.key);
		if (node.children.length > 0 && !this.collapsed.has(collapseKey)) {
			for (const child of node.children) {
				this.renderNode(nodeEl, child);
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
		const addRootGroupButton = toolbar.createEl("button", { text: "New root group" });
		addRootGroupButton.addEventListener("click", () => {
			new CreateHierarchyItemModal(this.app, this.plugin, "group", null).open();
		});

		const addRootNoteButton = toolbar.createEl("button", { text: "New root note" });
		addRootNoteButton.addEventListener("click", () => {
			new CreateHierarchyItemModal(this.app, this.plugin, "note", null).open();
		});

		const treeWrapper = container.createDiv({ cls: "tree-hierarchy-tree" });
		treeWrapper.scrollTop = this.treeScrollTop;
		this.registerRootDropZone(treeWrapper);
		treeWrapper.createDiv({
			cls: "tree-hierarchy-dropzone",
			text: "Drop here to move to root",
		});

		const tree = this.plugin.getDisplayTree();
		if (tree.length === 0) {
			treeWrapper.createDiv({
				cls: "tree-hierarchy-empty",
				text: "No hierarchy yet. Create a group, create a note, or assign an existing vault note.",
			});
			return;
		}

		for (const node of tree) {
			this.renderNode(treeWrapper, node);
		}

		window.requestAnimationFrame(() => {
			treeWrapper.scrollTop = this.treeScrollTop;
		});
	}

	private renderNode(parentEl: HTMLElement, node: DisplayTreeNode): void {
		const nodeEl = parentEl.createDiv({ cls: "tree-hierarchy-node" });
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
			const addGroup = actions.createEl("button", { text: "+G" });
			addGroup.addEventListener("click", () => {
				void this.plugin.openCreateModalForNode("group", node);
			});

			const addNote = actions.createEl("button", { text: "+N" });
			addNote.addEventListener("click", () => {
				void this.plugin.openCreateModalForNode("note", node);
			});

			const addExisting = actions.createEl("button", { text: "+E" });
			addExisting.addEventListener("click", () => {
				void this.plugin.openAssignExistingModalForNode(node);
			});

			if (node.dbId !== null) {
				const moveNode = actions.createEl("button", { text: "Move" });
				moveNode.addEventListener("click", () => {
					new MoveHierarchyNodeModal(this.app, this.plugin, node).open();
				});
			}
		}

		const viewNodeId = node.dbId;
		if (node.type === "note" && node.notePath) {
			if (viewNodeId !== null && node.parentId !== null) {
				const rootButton = actions.createEl("button", { text: "To root" });
				rootButton.addEventListener("click", () => {
					fireAndForget(this.moveNodeToRoot(viewNodeId), (error) => {
						console.error(error);
						new Notice("Failed to move node.");
					});
				});
			}
		}

		const collapseKey = node.dbId ?? this.hashNodeKey(node.key);
		if (node.children.length > 0 && !this.collapsed.has(collapseKey)) {
			for (const child of node.children) {
				this.renderNode(nodeEl, child);
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

	private async openView(): Promise<void> {
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
	}
}

export default class SQLiteTreeHierarchyPlugin extends Plugin {
	settings: TreeHierarchySettings = DEFAULT_SETTINGS;
	store = new TreeHierarchyStore(this);
	private popupModal: TreeHierarchyPopupModal | null = null;

	onload(): void {
		this.registerView(
			VIEW_TYPE_TREE_HIERARCHY,
			(leaf) => new TreeHierarchyView(leaf, this),
		);

		this.addRibbonIcon("workflow", "Open hierarchy view", () => {
			this.openPopup();
		});

		this.app.workspace.onLayoutReady(() => {
			void this.ensureSidebarTab();
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

		this.addSettingTab(new TreeHierarchySettingTab(this.app, this));
		fireAndForget(this.initializePlugin(), (error) => {
			console.error("Failed to initialize hierarchy view", error);
			new Notice("Hierarchy view failed to initialize. Check the developer console.");
		});
	}

	onunload(): void {
		this.popupModal?.close();
		this.popupModal = null;
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_TREE_HIERARCHY);
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
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
	async refreshTreeView(): Promise<void> {
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

	async createNoteInHierarchy(title: string, parentId: number | null, folder: string): Promise<void> {
		const normalizedFolder = folder.replace(/^\/+|\/+$/g, "");
		if (normalizedFolder) {
			await this.ensureFolderExists(normalizedFolder);
		}

		const safeTitle = title.replace(/[\\/:*?"<>|#^\]]/g, "").trim() || "Untitled";
		const notePath = normalizedFolder ? `${normalizedFolder}/${safeTitle}.md` : `${safeTitle}.md`;
		const uniquePath = this.getAvailableNotePath(notePath);
		const file = await this.app.vault.create(uniquePath, `# ${title}\n`);
		await this.store.createNoteNode(title, parentId, file.path);
		await this.app.workspace.getLeaf(true).openFile(file);
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

	private getAvailableNotePath(notePath: string): string {
		if (!this.app.vault.getAbstractFileByPath(notePath)) {
			return notePath;
		}

		const extension = ".md";
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
		return this.mapStoredNodes(storedTree);
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
			return this.store.ensureTrackedNote(file.basename, file.path);
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

	onPopupClosed(modal: TreeHierarchyPopupModal): void {
		if (this.popupModal === modal) {
			this.popupModal = null;
		}
	}

	private mapStoredNodes(nodes: TreeNodeRecord[]): DisplayTreeNode[] {
		return nodes.map((node) => ({
			key: `db:${node.id}`,
			dbId: node.id,
			parentId: node.parentId,
			type: node.type,
			title: node.title,
			notePath: node.notePath,
			children: this.mapStoredNodes(node.children),
			isAssigned: true,
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
	}

	async updateDatabaseFileName(value: string): Promise<void> {
		this.settings.dbFileName = value.trim() || DEFAULT_DB_FILENAME;
		await this.saveSettings();
		await this.reloadStore();
	}

	async updateNoteRootFolder(value: string): Promise<void> {
		this.settings.noteRootFolder = value.trim();
		await this.saveSettings();
	}
}
