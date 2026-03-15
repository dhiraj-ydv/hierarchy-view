import initSqlJs, { Database } from "sql.js";
import * as fs from "fs";
import * as path from "path";

export interface HierarchyNode {
  id: number;
  parentId: number | null;
  type: "group" | "note";
  title: string;
  notePath: string | null;
  sortOrder: number;
}

export interface HierarchySettings {
  dbFileName: string;
  backupDbPath: string;
  noteRootFolder: string;
  noteExtension: string;
}

export class HierarchyDatabase {
  private db: Database | null = null;
  private dbPath: string;
  private sqlPromise: Promise<any> | null = null;

  constructor(vaultPath: string, dbFileName: string = "tree-hierarchy.sqlite") {
    const pluginPath = path.join(vaultPath, ".obsidian/plugins", "obsidian-tree-hierarchy");
    this.dbPath = path.join(pluginPath, dbFileName);
  }

  async initialize(): Promise<void> {
    if (!this.sqlPromise) {
      this.sqlPromise = initSqlJs();
    }
    const SQL = await this.sqlPromise;

    if (fs.existsSync(this.dbPath)) {
      const buffer = fs.readFileSync(this.dbPath);
      this.db = new SQL.Database(buffer);
    } else {
      this.db = new SQL.Database();
      this.createTables();
    }
  }

  private createTables(): void {
    if (!this.db) return;

    this.db.run(`
      CREATE TABLE IF NOT EXISTS nodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        parent_id INTEGER,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        note_path TEXT,
        sort_order INTEGER DEFAULT 0,
        FOREIGN KEY (parent_id) REFERENCES nodes(id) ON DELETE CASCADE
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_parent_id ON nodes(parent_id)
    `);
  }

  async save(): Promise<void> {
    if (!this.db) return;
    const data = this.db.export();
    const buffer = Buffer.from(data);
    
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(this.dbPath, buffer);
  }

  getAllNodes(): HierarchyNode[] {
    if (!this.db) return [];

    const results = this.db.exec("SELECT id, parent_id, type, title, note_path, sort_order FROM nodes ORDER BY sort_order");
    if (results.length === 0) return [];

    return results[0].values.map((row: any[]) => ({
      id: row[0] as number,
      parentId: row[1] as number | null,
      type: row[2] as "group" | "note",
      title: row[3] as string,
      notePath: row[4] as string | null,
      sortOrder: row[5] as number,
    }));
  }

  getNodeById(id: number): HierarchyNode | null {
    if (!this.db) return null;

    const results = this.db.exec(
      "SELECT id, parent_id, type, title, note_path, sort_order FROM nodes WHERE id = ?",
      [id]
    );
    if (results.length === 0 || results[0].values.length === 0) return null;

    const row = results[0].values[0];
    return {
      id: row[0] as number,
      parentId: row[1] as number | null,
      type: row[2] as "group" | "note",
      title: row[3] as string,
      notePath: row[4] as string | null,
      sortOrder: row[5] as number,
    };
  }

  createNode(title: string, type: "group" | "note", parentId: number | null, notePath: string | null = null): number {
    if (!this.db) return -1;

    const maxOrder = this.db.exec(
      "SELECT COALESCE(MAX(sort_order), -1) + 1 FROM nodes WHERE parent_id IS ?",
      [parentId]
    );
    const sortOrder = maxOrder[0]?.values[0]?.[0] as number || 0;

    this.db.run(
      "INSERT INTO nodes (title, type, parent_id, note_path, sort_order) VALUES (?, ?, ?, ?, ?)",
      [title, type, parentId, notePath, sortOrder]
    );

    const result = this.db.exec("SELECT last_insert_rowid()");
    return result[0]?.values[0]?.[0] as number || -1;
  }

  updateNode(id: number, title: string): void {
    if (!this.db) return;
    this.db.run("UPDATE nodes SET title = ? WHERE id = ?", [title, id]);
  }

  deleteNode(id: number): void {
    if (!this.db) return;
    
    // First, recursively delete children
    const children = this.getChildren(id);
    for (const child of children) {
      this.deleteNode(child.id);
    }
    
    this.db.run("DELETE FROM nodes WHERE id = ?", [id]);
  }

  moveNode(id: number, newParentId: number | null, newIndex: number | null): void {
    if (!this.db) return;

    const node = this.getNodeById(id);
    if (!node) return;

    // Get siblings in new parent
    const siblings = this.getChildren(newParentId);
    
    // Update sort orders
    let order = newIndex !== null ? newIndex : siblings.length;
    for (const sibling of siblings) {
      if (sibling.id === id) continue;
      if (order <= sibling.sortOrder && newIndex !== null) {
        this.db.run("UPDATE nodes SET sort_order = ? WHERE id = ?", [sibling.sortOrder + 1, sibling.id]);
      }
      order++;
    }

    this.db.run("UPDATE nodes SET parent_id = ?, sort_order = ? WHERE id = ?", [newParentId, newIndex ?? siblings.length, id]);
  }

  getChildren(parentId: number | null): HierarchyNode[] {
    if (!this.db) return [];

    const results = this.db.exec(
      "SELECT id, parent_id, type, title, note_path, sort_order FROM nodes WHERE parent_id IS ? ORDER BY sort_order",
      [parentId]
    );
    if (results.length === 0) return [];

    return results[0].values.map((row: any[]) => ({
      id: row[0] as number,
      parentId: row[1] as number | null,
      type: row[2] as "group" | "note",
      title: row[3] as string,
      notePath: row[4] as string | null,
      sortOrder: row[5] as number,
    }));
  }

  getSettings(): HierarchySettings {
    if (!this.db) {
      return {
        dbFileName: "tree-hierarchy.sqlite",
        backupDbPath: "",
        noteRootFolder: "",
        noteExtension: ".md",
      };
    }

    const results = this.db.exec("SELECT key, value FROM settings");
    const settings: any = {
      dbFileName: "tree-hierarchy.sqlite",
      backupDbPath: "",
      noteRootFolder: "",
      noteExtension: ".md",
    };

    if (results.length > 0) {
      for (const row of results[0].values) {
        const key = row[0] as string;
        const value = row[1] as string;
        if (key in settings) {
          settings[key] = value;
        }
      }
    }

    return settings as HierarchySettings;
  }

  updateSetting(key: string, value: string): void {
    if (!this.db) return;
    this.db.run(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
      [key, value]
    );
  }

  exportToJson(): string {
    const nodes = this.getAllNodes();
    const settings = this.getSettings();
    return JSON.stringify({ nodes, settings }, null, 2);
  }

  importFromJson(jsonString: string): void {
    if (!this.db) return;

    const data = JSON.parse(jsonString);
    
    // Clear existing data
    this.db.run("DELETE FROM nodes");
    
    // Import nodes
    for (const node of data.nodes) {
      this.db.run(
        "INSERT INTO nodes (id, parent_id, type, title, note_path, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
        [node.id, node.parentId, node.type, node.title, node.notePath, node.sortOrder]
      );
    }
    
    // Import settings
    if (data.settings) {
      for (const [key, value] of Object.entries(data.settings)) {
        this.updateSetting(key, value as string);
      }
    }
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export function findVaultPath(): string | null {
  const cwd = process.cwd();
  
  // Check if .obsidian folder exists
  const obsidianPath = path.join(cwd, ".obsidian");
  if (fs.existsSync(obsidianPath)) {
    return cwd;
  }
  
  // Check parent directory
  const parentPath = path.join(cwd, "..");
  if (fs.existsSync(path.join(parentPath, ".obsidian"))) {
    return parentPath;
  }
  
  return null;
}
