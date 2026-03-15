#!/usr/bin/env node

import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";
import { HierarchyDatabase, findVaultPath } from "./database";
import * as commands from "./commands";

let globalDb: HierarchyDatabase | null = null;
let globalVaultPath: string | null = null;

const program = new Command();

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
      vaultPath = findVaultPath();
      if (!vaultPath) {
        console.log(chalk.red("✗ No vault path specified and could not detect one."));
        console.log(chalk.yellow("  Use -v <path> to specify vault path"));
        process.exit(1);
      }
      console.log(chalk.gray(`  Detected vault: ${vaultPath}`));
    }
    
    const db = new HierarchyDatabase(vaultPath, opts.db);
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
    if (!globalDb) return;
    await commands.listNodes(globalDb, options);
  });

// Tree command
program
  .command("tree")
  .description("Show hierarchy as tree")
  .option("-p, --paths", "Show file paths")
  .action(async (options) => {
    if (!globalDb) return;
    await commands.listNodes(globalDb, { flat: false, paths: options.paths });
  });

// Create command
program
  .command("create <title>")
  .description("Create a new group or note")
  .option("-t, --type <type>", "Type: group or note", "note")
  .option("-p, --parent <id>", "Parent node ID")
  .action(async (title: string, options) => {
    if (!globalDb || !globalVaultPath) return;
    const parentId = options.parent ? parseInt(options.parent) : null;
    const type = options.type as "group" | "note";
    await commands.createNode(globalDb, title, type, parentId, globalVaultPath);
  });

// Delete command
program
  .command("delete <id>")
  .description("Delete a node by ID")
  .option("-f, --force", "Also delete the associated file")
  .action(async (id: string, options) => {
    if (!globalDb) return;
    await commands.deleteNode(globalDb, parseInt(id), options.force);
  });

// Move command
program
  .command("move <id> <parentId>")
  .description("Move a node to a new parent")
  .option("-i, --index <n>", "Position index in new parent")
  .action(async (id: string, parentId: string, options) => {
    if (!globalDb) return;
    const newParentId = parentId === "null" ? null : parseInt(parentId);
    const index = options.index ? parseInt(options.index) : undefined;
    await commands.moveNode(globalDb, parseInt(id), newParentId, index);
  });

// Rename command
program
  .command("rename <id> <newTitle>")
  .description("Rename a node")
  .action(async (id: string, newTitle: string) => {
    if (!globalDb) return;
    await commands.renameNode(globalDb, parseInt(id), newTitle);
  });

// Search command
program
  .command("search <query>")
  .description("Search for nodes")
  .action(async (query: string) => {
    if (!globalDb) return;
    await commands.searchNodes(globalDb, query);
  });

// Info command
program
  .command("info <id>")
  .description("Show detailed info about a node")
  .action(async (id: string) => {
    if (!globalDb) return;
    await commands.getNodeInfo(globalDb, parseInt(id));
  });

// Export command
program
  .command("export [output]")
  .description("Export hierarchy to JSON file")
  .option("-s, --stdout", "Output to stdout instead of file")
  .action(async (output: string | undefined, options) => {
    if (!globalDb) return;
    
    if (options.stdout) {
      console.log(globalDb.exportToJson());
    } else {
      const outputPath = output || "hierarchy-export.json";
      await commands.exportHierarchy(globalDb, outputPath);
    }
  });

// Import command
program
  .command("import <input>")
  .description("Import hierarchy from JSON file")
  .option("-m, --merge", "Merge with existing hierarchy (don't clear first)")
  .action(async (input: string, options) => {
    if (!globalDb) return;
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
    if (!globalDb) return;
    await commands.showSettings(globalDb);
  });

settingsCmd
  .command("set <key> <value>")
  .description("Update a setting (key: dbFileName, backupDbPath, noteRootFolder, noteExtension)")
  .action(async (key: string, value: string) => {
    if (!globalDb) return;
    await commands.updateSetting(globalDb, key, value);
  });

// Backup commands
const backupCmd = program
  .command("backup")
  .description("Backup and restore");

backupCmd
  .command("create [backupDir]")
  .description("Create a backup")
  .action(async (backupDir: string | undefined) => {
    if (!globalDb || !globalVaultPath) return;
    
    const dirPath = backupDir || path.join(globalVaultPath, ".obsidian", "plugins", "obsidian-tree-hierarchy", "backups");
    
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    await commands.createBackup(globalDb, dirPath);
  });

backupCmd
  .command("restore <backupFile>")
  .description("Restore from a backup file")
  .action(async (backupFile: string) => {
    if (!globalDb) return;
    await commands.restoreBackup(globalDb, backupFile);
  });

// Sync command
program
  .command("sync")
  .description("Sync hierarchy with vault files")
  .action(async () => {
    if (!globalDb || !globalVaultPath) return;
    await commands.syncWithVault(globalDb, globalVaultPath);
  });

// Init command
program
  .command("init")
  .description("Initialize CLI in current vault")
  .action(() => {
    const vaultPath = findVaultPath() || process.cwd();
    const cliPath = path.join(vaultPath, ".obsidian", "plugins", "obsidian-hierarchy-cli");
    
    if (!fs.existsSync(cliPath)) {
      fs.mkdirSync(cliPath, { recursive: true });
    }
    
    const config = {
      vaultPath: vaultPath,
      dbFile: "tree-hierarchy.sqlite"
    };
    
    fs.writeFileSync(path.join(cliPath, "config.json"), JSON.stringify(config, null, 2));
    console.log(chalk.green(`✓ Initialized CLI in: ${cliPath}`));
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
