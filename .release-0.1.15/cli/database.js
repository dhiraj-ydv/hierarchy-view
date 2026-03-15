"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HierarchyDatabase = void 0;
exports.findVaultPath = findVaultPath;
const sql_js_1 = __importDefault(require("sql.js"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class HierarchyDatabase {
    constructor(vaultPath, dbFileName = "tree-hierarchy.sqlite") {
        this.db = null;
        this.sqlPromise = null;
        const pluginPath = path.join(vaultPath, ".obsidian/plugins", "obsidian-tree-hierarchy");
        this.dbPath = path.join(pluginPath, dbFileName);
    }
    async initialize() {
        if (!this.sqlPromise) {
            this.sqlPromise = (0, sql_js_1.default)();
        }
        const SQL = await this.sqlPromise;
        if (fs.existsSync(this.dbPath)) {
            const buffer = fs.readFileSync(this.dbPath);
            this.db = new SQL.Database(buffer);
        }
        else {
            this.db = new SQL.Database();
            this.createTables();
        }
    }
    createTables() {
        if (!this.db)
            return;
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
    async save() {
        if (!this.db)
            return;
        const data = this.db.export();
        const buffer = Buffer.from(data);
        const dir = path.dirname(this.dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(this.dbPath, buffer);
    }
    getAllNodes() {
        if (!this.db)
            return [];
        const results = this.db.exec("SELECT id, parent_id, type, title, note_path, sort_order FROM nodes ORDER BY sort_order");
        if (results.length === 0)
            return [];
        return results[0].values.map((row) => ({
            id: row[0],
            parentId: row[1],
            type: row[2],
            title: row[3],
            notePath: row[4],
            sortOrder: row[5],
        }));
    }
    getNodeById(id) {
        if (!this.db)
            return null;
        const results = this.db.exec("SELECT id, parent_id, type, title, note_path, sort_order FROM nodes WHERE id = ?", [id]);
        if (results.length === 0 || results[0].values.length === 0)
            return null;
        const row = results[0].values[0];
        return {
            id: row[0],
            parentId: row[1],
            type: row[2],
            title: row[3],
            notePath: row[4],
            sortOrder: row[5],
        };
    }
    createNode(title, type, parentId, notePath = null) {
        if (!this.db)
            return -1;
        const maxOrder = this.db.exec("SELECT COALESCE(MAX(sort_order), -1) + 1 FROM nodes WHERE parent_id IS ?", [parentId]);
        const sortOrder = maxOrder[0]?.values[0]?.[0] || 0;
        this.db.run("INSERT INTO nodes (title, type, parent_id, note_path, sort_order) VALUES (?, ?, ?, ?, ?)", [title, type, parentId, notePath, sortOrder]);
        const result = this.db.exec("SELECT last_insert_rowid()");
        return result[0]?.values[0]?.[0] || -1;
    }
    updateNode(id, title) {
        if (!this.db)
            return;
        this.db.run("UPDATE nodes SET title = ? WHERE id = ?", [title, id]);
    }
    deleteNode(id) {
        if (!this.db)
            return;
        // First, recursively delete children
        const children = this.getChildren(id);
        for (const child of children) {
            this.deleteNode(child.id);
        }
        this.db.run("DELETE FROM nodes WHERE id = ?", [id]);
    }
    moveNode(id, newParentId, newIndex) {
        if (!this.db)
            return;
        const node = this.getNodeById(id);
        if (!node)
            return;
        // Get siblings in new parent
        const siblings = this.getChildren(newParentId);
        // Update sort orders
        let order = newIndex !== null ? newIndex : siblings.length;
        for (const sibling of siblings) {
            if (sibling.id === id)
                continue;
            if (order <= sibling.sortOrder && newIndex !== null) {
                this.db.run("UPDATE nodes SET sort_order = ? WHERE id = ?", [sibling.sortOrder + 1, sibling.id]);
            }
            order++;
        }
        this.db.run("UPDATE nodes SET parent_id = ?, sort_order = ? WHERE id = ?", [newParentId, newIndex ?? siblings.length, id]);
    }
    getChildren(parentId) {
        if (!this.db)
            return [];
        const results = this.db.exec("SELECT id, parent_id, type, title, note_path, sort_order FROM nodes WHERE parent_id IS ? ORDER BY sort_order", [parentId]);
        if (results.length === 0)
            return [];
        return results[0].values.map((row) => ({
            id: row[0],
            parentId: row[1],
            type: row[2],
            title: row[3],
            notePath: row[4],
            sortOrder: row[5],
        }));
    }
    getSettings() {
        if (!this.db) {
            return {
                dbFileName: "tree-hierarchy.sqlite",
                backupDbPath: "",
                noteRootFolder: "",
                noteExtension: ".md",
            };
        }
        const results = this.db.exec("SELECT key, value FROM settings");
        const settings = {
            dbFileName: "tree-hierarchy.sqlite",
            backupDbPath: "",
            noteRootFolder: "",
            noteExtension: ".md",
        };
        if (results.length > 0) {
            for (const row of results[0].values) {
                const key = row[0];
                const value = row[1];
                if (key in settings) {
                    settings[key] = value;
                }
            }
        }
        return settings;
    }
    updateSetting(key, value) {
        if (!this.db)
            return;
        this.db.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [key, value]);
    }
    exportToJson() {
        const nodes = this.getAllNodes();
        const settings = this.getSettings();
        return JSON.stringify({ nodes, settings }, null, 2);
    }
    importFromJson(jsonString) {
        if (!this.db)
            return;
        const data = JSON.parse(jsonString);
        // Clear existing data
        this.db.run("DELETE FROM nodes");
        // Import nodes
        for (const node of data.nodes) {
            this.db.run("INSERT INTO nodes (id, parent_id, type, title, note_path, sort_order) VALUES (?, ?, ?, ?, ?, ?)", [node.id, node.parentId, node.type, node.title, node.notePath, node.sortOrder]);
        }
        // Import settings
        if (data.settings) {
            for (const [key, value] of Object.entries(data.settings)) {
                this.updateSetting(key, value);
            }
        }
    }
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}
exports.HierarchyDatabase = HierarchyDatabase;
function findVaultPath() {
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
//# sourceMappingURL=database.js.map