#!/usr/bin/env node
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
const commander_1 = require("commander");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const database_1 = require("./database");
const commands = __importStar(require("./commands"));
let globalDb = null;
let globalVaultPath = null;
const program = new commander_1.Command();
program
    .name("hierarchy")
    .description("CLI tool for Obsidian Tree Hierarchy plugin - for CLI users and AI agents")
    .version("0.1.8");
program
    .option("-v, --vault <path>", "Path to Obsidian vault")
    .option("-d, --db <name>", "Database file name", "tree-hierarchy.sqlite")
    .hook("preAction", async (thisCommand) => {
    const opts = thisCommand.opts();
    let vaultPath = opts.vault;
    if (!vaultPath) {
        vaultPath = (0, database_1.findVaultPath)();
        if (!vaultPath) {
            console.log(chalk_1.default.red("✗ No vault path specified and could not detect one."));
            console.log(chalk_1.default.yellow("  Use -v <path> to specify vault path"));
            process.exit(1);
        }
        console.log(chalk_1.default.gray(`  Detected vault: ${vaultPath}`));
    }
    const db = new database_1.HierarchyDatabase(vaultPath, opts.db);
    await db.initialize();
    globalDb = db;
    globalVaultPath = vaultPath;
});
// List command
program
    .command("list")
    .description("List all nodes in hierarchy")
    .option("-f, --flat", "Show as flat list")
    .option("-p, --paths", "Show file paths")
    .action(async (options) => {
    if (!globalDb)
        return;
    await commands.listNodes(globalDb, options);
});
// Tree command
program
    .command("tree")
    .description("Show hierarchy as tree")
    .option("-p, --paths", "Show file paths")
    .action(async (options) => {
    if (!globalDb)
        return;
    await commands.listNodes(globalDb, { flat: false, paths: options.paths });
});
// Create command
program
    .command("create <title>")
    .description("Create a new group or note")
    .option("-t, --type <type>", "Type: group or note", "note")
    .option("-p, --parent <id>", "Parent node ID")
    .action(async (title, options) => {
    if (!globalDb || !globalVaultPath)
        return;
    const parentId = options.parent ? parseInt(options.parent) : null;
    const type = options.type;
    await commands.createNode(globalDb, title, type, parentId, globalVaultPath);
});
// Delete command
program
    .command("delete <id>")
    .description("Delete a node by ID")
    .option("-f, --force", "Also delete the associated file")
    .action(async (id, options) => {
    if (!globalDb)
        return;
    await commands.deleteNode(globalDb, parseInt(id), options.force);
});
// Move command
program
    .command("move <id> <parentId>")
    .description("Move a node to a new parent")
    .option("-i, --index <n>", "Position index in new parent")
    .action(async (id, parentId, options) => {
    if (!globalDb)
        return;
    const newParentId = parentId === "null" ? null : parseInt(parentId);
    const index = options.index ? parseInt(options.index) : undefined;
    await commands.moveNode(globalDb, parseInt(id), newParentId, index);
});
// Rename command
program
    .command("rename <id> <newTitle>")
    .description("Rename a node")
    .action(async (id, newTitle) => {
    if (!globalDb)
        return;
    await commands.renameNode(globalDb, parseInt(id), newTitle);
});
// Search command
program
    .command("search <query>")
    .description("Search for nodes")
    .action(async (query) => {
    if (!globalDb)
        return;
    await commands.searchNodes(globalDb, query);
});
// Info command
program
    .command("info <id>")
    .description("Show detailed info about a node")
    .action(async (id) => {
    if (!globalDb)
        return;
    await commands.getNodeInfo(globalDb, parseInt(id));
});
// Export command
program
    .command("export [output]")
    .description("Export hierarchy to JSON file")
    .option("-s, --stdout", "Output to stdout instead of file")
    .action(async (output, options) => {
    if (!globalDb)
        return;
    if (options.stdout) {
        console.log(globalDb.exportToJson());
    }
    else {
        const outputPath = output || "hierarchy-export.json";
        await commands.exportHierarchy(globalDb, outputPath);
    }
});
// Import command
program
    .command("import <input>")
    .description("Import hierarchy from JSON file")
    .option("-m, --merge", "Merge with existing hierarchy (don't clear first)")
    .action(async (input, options) => {
    if (!globalDb)
        return;
    await commands.importHierarchy(globalDb, input, options.merge);
});
// Settings commands
const settingsCmd = program
    .command("settings")
    .description("Manage settings");
settingsCmd
    .command("show")
    .description("Show current settings")
    .action(async () => {
    if (!globalDb)
        return;
    await commands.showSettings(globalDb);
});
settingsCmd
    .command("set <key> <value>")
    .description("Update a setting (key: dbFileName, backupDbPath, noteRootFolder, noteExtension)")
    .action(async (key, value) => {
    if (!globalDb)
        return;
    await commands.updateSetting(globalDb, key, value);
});
// Backup commands
const backupCmd = program
    .command("backup")
    .description("Backup and restore");
backupCmd
    .command("create [backupDir]")
    .description("Create a backup")
    .action(async (backupDir) => {
    if (!globalDb || !globalVaultPath)
        return;
    const dirPath = backupDir || path.join(globalVaultPath, ".obsidian", "plugins", "obsidian-tree-hierarchy", "backups");
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
    await commands.createBackup(globalDb, dirPath);
});
backupCmd
    .command("restore <backupFile>")
    .description("Restore from a backup file")
    .action(async (backupFile) => {
    if (!globalDb)
        return;
    await commands.restoreBackup(globalDb, backupFile);
});
// Sync command
program
    .command("sync")
    .description("Sync hierarchy with vault files")
    .action(async () => {
    if (!globalDb || !globalVaultPath)
        return;
    await commands.syncWithVault(globalDb, globalVaultPath);
});
// Init command
program
    .command("init")
    .description("Initialize CLI in current vault")
    .action(() => {
    const vaultPath = (0, database_1.findVaultPath)() || process.cwd();
    const cliPath = path.join(vaultPath, ".obsidian", "plugins", "obsidian-hierarchy-cli");
    if (!fs.existsSync(cliPath)) {
        fs.mkdirSync(cliPath, { recursive: true });
    }
    const config = {
        vaultPath: vaultPath,
        dbFile: "tree-hierarchy.sqlite"
    };
    fs.writeFileSync(path.join(cliPath, "config.json"), JSON.stringify(config, null, 2));
    console.log(chalk_1.default.green(`✓ Initialized CLI in: ${cliPath}`));
});
// Close database on exit
process.on("exit", () => {
    if (globalDb) {
        globalDb.close();
    }
});
process.on("SIGINT", () => {
    if (globalDb) {
        globalDb.close();
    }
    process.exit();
});
program.parse();
//# sourceMappingURL=index.js.map