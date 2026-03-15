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
exports.buildTree = buildTree;
exports.printTree = printTree;
exports.listNodes = listNodes;
exports.createNode = createNode;
exports.deleteNode = deleteNode;
exports.moveNode = moveNode;
exports.renameNode = renameNode;
exports.exportHierarchy = exportHierarchy;
exports.importHierarchy = importHierarchy;
exports.searchNodes = searchNodes;
exports.showSettings = showSettings;
exports.updateSetting = updateSetting;
exports.getNodeInfo = getNodeInfo;
exports.createBackup = createBackup;
exports.restoreBackup = restoreBackup;
exports.syncWithVault = syncWithVault;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
function buildTree(nodes, parentId = null, depth = 0) {
    return nodes
        .filter((node) => node.parentId === parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((node) => ({
        ...node,
        depth,
        children: buildTree(nodes, node.id, depth + 1),
    }));
}
function printTree(nodes, showPaths = false) {
    const tree = buildTree(nodes);
    const printNode = (node) => {
        const indent = "  ".repeat(node.depth);
        const icon = node.type === "group" ? "📁" : "📄";
        const pathInfo = showPaths && node.notePath ? ` → ${node.notePath}` : "";
        console.log(`${indent}${icon} ${node.title}${pathInfo}`);
        for (const child of node.children) {
            printNode(child);
        }
    };
    for (const node of tree) {
        printNode(node);
    }
}
async function listNodes(db, options = {}) {
    const nodes = db.getAllNodes();
    if (options.flat) {
        console.log(chalk_1.default.bold("\n📋 All Nodes:\n"));
        for (const node of nodes) {
            const prefix = node.type === "group" ? "📁" : "📄";
            const pathInfo = options.paths && node.notePath ? ` → ${node.notePath}` : "";
            console.log(`  ${prefix} [${node.id}] ${node.title}${pathInfo}`);
        }
        console.log();
    }
    else {
        printTree(nodes, options.paths);
    }
}
async function createNode(db, title, type, parentId, vaultPath, notePath) {
    let finalNotePath = null;
    if (type === "note") {
        const settings = db.getSettings();
        const extension = settings.noteExtension || ".md";
        const rootFolder = settings.noteRootFolder || "";
        const safeTitle = title.replace(/[\\/:*?"<>|#^\]]/g, "").trim() || "Untitled";
        const noteFolder = rootFolder ? path.join(vaultPath, rootFolder) : vaultPath;
        if (!fs.existsSync(noteFolder)) {
            fs.mkdirSync(noteFolder, { recursive: true });
        }
        finalNotePath = path.join(noteFolder, `${safeTitle}${extension}`);
        // Handle duplicates
        let counter = 1;
        while (fs.existsSync(finalNotePath)) {
            finalNotePath = path.join(noteFolder, `${safeTitle} ${counter}${extension}`);
            counter++;
        }
        // Create note file
        if (extension === ".html") {
            const content = `<!DOCTYPE html>
<html>
<head>
<title>${title}</title>
</head>
<body>
<h1>${title}</h1>
</body>
</html>`;
            fs.writeFileSync(finalNotePath, content);
        }
        else {
            fs.writeFileSync(finalNotePath, `# ${title}\n`);
        }
        console.log(chalk_1.default.green(`✓ Created note: ${finalNotePath}`));
    }
    const id = db.createNode(title, type, parentId, finalNotePath);
    await db.save();
    console.log(chalk_1.default.green(`✓ Created ${type}: "${title}" (ID: ${id})`));
    return id;
}
async function deleteNode(db, id, deleteFiles = false) {
    const node = db.getNodeById(id);
    if (!node) {
        console.log(chalk_1.default.red(`✗ Node with ID ${id} not found`));
        return;
    }
    // Delete associated files if requested
    if (deleteFiles && node.notePath && fs.existsSync(node.notePath)) {
        fs.unlinkSync(node.notePath);
        console.log(chalk_1.default.yellow(`  Deleted file: ${node.notePath}`));
    }
    db.deleteNode(id);
    await db.save();
    console.log(chalk_1.default.green(`✓ Deleted: "${node.title}" (ID: ${id})`));
}
async function moveNode(db, id, newParentId, index) {
    const node = db.getNodeById(id);
    if (!node) {
        console.log(chalk_1.default.red(`✗ Node with ID ${id} not found`));
        return;
    }
    if (newParentId !== null) {
        const parent = db.getNodeById(newParentId);
        if (!parent) {
            console.log(chalk_1.default.red(`✗ Parent node with ID ${newParentId} not found`));
            return;
        }
    }
    db.moveNode(id, newParentId, index ?? null);
    await db.save();
    console.log(chalk_1.default.green(`✓ Moved "${node.title}" to parent ID ${newParentId}`));
}
async function renameNode(db, id, newTitle) {
    const node = db.getNodeById(id);
    if (!node) {
        console.log(chalk_1.default.red(`✗ Node with ID ${id} not found`));
        return;
    }
    const oldTitle = node.title;
    db.updateNode(id, newTitle);
    await db.save();
    // Also rename the file if it's a note
    if (node.notePath && fs.existsSync(node.notePath)) {
        const dir = path.dirname(node.notePath);
        const ext = path.extname(node.notePath);
        const newPath = path.join(dir, `${newTitle}${ext}`);
        fs.renameSync(node.notePath, newPath);
        console.log(chalk_1.default.yellow(`  Renamed file: ${node.notePath} → ${newPath}`));
    }
    console.log(chalk_1.default.green(`✓ Renamed "${oldTitle}" → "${newTitle}"`));
}
async function exportHierarchy(db, outputPath) {
    const json = db.exportToJson();
    fs.writeFileSync(outputPath, json);
    console.log(chalk_1.default.green(`✓ Exported hierarchy to: ${outputPath}`));
}
async function importHierarchy(db, inputPath, merge = false) {
    if (!fs.existsSync(inputPath)) {
        console.log(chalk_1.default.red(`✗ File not found: ${inputPath}`));
        return;
    }
    const json = fs.readFileSync(inputPath, "utf-8");
    if (!merge) {
        // Clear existing data
        const nodes = db.getAllNodes();
        for (const node of nodes.reverse()) {
            db.deleteNode(node.id);
        }
    }
    db.importFromJson(json);
    await db.save();
    console.log(chalk_1.default.green(`✓ Imported hierarchy from: ${inputPath}`));
}
async function searchNodes(db, query) {
    const nodes = db.getAllNodes();
    const results = nodes.filter((node) => node.title.toLowerCase().includes(query.toLowerCase()) ||
        (node.notePath && node.notePath.toLowerCase().includes(query.toLowerCase())));
    if (results.length === 0) {
        console.log(chalk_1.default.yellow(`No results found for: "${query}"`));
        return;
    }
    console.log(chalk_1.default.bold(`\n🔍 Search results for "${query}":\n`));
    for (const node of results) {
        const prefix = node.type === "group" ? "📁" : "📄";
        const pathInfo = node.notePath ? ` → ${node.notePath}` : "";
        console.log(`  ${prefix} [${node.id}] ${node.title}${pathInfo}`);
    }
    console.log();
}
async function showSettings(db) {
    const settings = db.getSettings();
    console.log(chalk_1.default.bold("\n⚙️  Current Settings:\n"));
    console.log(`  Database file: ${settings.dbFileName}`);
    console.log(`  Backup path:   ${settings.backupDbPath || "(not set)"}`);
    console.log(`  Root folder:   ${settings.noteRootFolder || "(root)"}`);
    console.log(`  File format:   ${settings.noteExtension}`);
    console.log();
}
async function updateSetting(db, key, value) {
    const validKeys = ["dbFileName", "backupDbPath", "noteRootFolder", "noteExtension"];
    if (!validKeys.includes(key)) {
        console.log(chalk_1.default.red(`✗ Invalid setting key. Valid keys: ${validKeys.join(", ")}`));
        return;
    }
    if (key === "noteExtension" && !value.startsWith(".")) {
        value = "." + value;
    }
    db.updateSetting(key, value);
    await db.save();
    console.log(chalk_1.default.green(`✓ Updated ${key} = "${value}"`));
}
async function getNodeInfo(db, id) {
    const node = db.getNodeById(id);
    if (!node) {
        console.log(chalk_1.default.red(`✗ Node with ID ${id} not found`));
        return;
    }
    const children = db.getChildren(id);
    const parent = node.parentId ? db.getNodeById(node.parentId) : null;
    console.log(chalk_1.default.bold(`\n📄 Node Details [ID: ${id}]\n`));
    console.log(`  Title:     ${node.title}`);
    console.log(`  Type:      ${node.type === "group" ? "📁 Group" : "📄 Note"}`);
    console.log(`  Parent:   ${parent ? parent.title : "(root)"}`);
    console.log(`  Sort:     ${node.sortOrder}`);
    if (node.notePath) {
        console.log(`  Path:     ${node.notePath}`);
        console.log(`  Exists:   ${fs.existsSync(node.notePath) ? "Yes" : "No (file missing)"}`);
    }
    console.log(`  Children: ${children.length}`);
    if (children.length > 0) {
        console.log(`  → ${children.map(c => c.title).join(", ")}`);
    }
    console.log();
}
async function createBackup(db, backupPath) {
    const json = db.exportToJson();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `hierarchy-backup-${timestamp}.json`;
    const fullPath = path.join(backupPath, filename);
    fs.writeFileSync(fullPath, json);
    console.log(chalk_1.default.green(`✓ Backup created: ${fullPath}`));
}
async function restoreBackup(db, backupPath) {
    if (!fs.existsSync(backupPath)) {
        console.log(chalk_1.default.red(`✗ Backup file not found: ${backupPath}`));
        return;
    }
    const json = fs.readFileSync(backupPath, "utf-8");
    const data = JSON.parse(json);
    // Clear and import
    const nodes = db.getAllNodes();
    for (const node of nodes.reverse()) {
        db.deleteNode(node.id);
    }
    db.importFromJson(json);
    await db.save();
    console.log(chalk_1.default.green(`✓ Restored from: ${backupPath}`));
}
async function syncWithVault(db, vaultPath) {
    const settings = db.getSettings();
    const nodes = db.getAllNodes();
    let notesAdded = 0;
    for (const node of nodes) {
        if (node.type === "note" && node.notePath) {
            const fullPath = path.join(vaultPath, node.notePath);
            // Check if file exists but not tracked
            if (fs.existsSync(fullPath) && !node.notePath) {
                // This is an existing note that should be tracked
                notesAdded++;
            }
        }
    }
    // Check for new files in vault that should be added
    const rootFolder = settings.noteRootFolder ? path.join(vaultPath, settings.noteRootFolder) : vaultPath;
    const extension = settings.noteExtension || ".md";
    const scanFolder = (dir) => {
        const files = [];
        if (!fs.existsSync(dir))
            return files;
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                files.push(...scanFolder(fullPath));
            }
            else if (entry.name.endsWith(extension)) {
                files.push(fullPath);
            }
        }
        return files;
    };
    const vaultFiles = scanFolder(rootFolder);
    const trackedPaths = nodes.filter(n => n.notePath).map(n => n.notePath);
    for (const filePath of vaultFiles) {
        const relativePath = path.relative(vaultPath, filePath);
        if (!trackedPaths.includes(relativePath)) {
            const title = path.basename(filePath, path.extname(filePath));
            db.createNode(title, "note", null, relativePath);
            notesAdded++;
        }
    }
    await db.save();
    console.log(chalk_1.default.green(`✓ Synced with vault. Added ${notesAdded} new notes.`));
}
//# sourceMappingURL=commands.js.map