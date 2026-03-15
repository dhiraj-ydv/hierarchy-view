import { HierarchyDatabase, HierarchyNode } from "./database";
import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";

export interface TreeNode extends HierarchyNode {
  children: TreeNode[];
  depth: number;
}

export function buildTree(nodes: HierarchyNode[], parentId: number | null = null, depth: number = 0): TreeNode[] {
  return nodes
    .filter((node) => node.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((node) => ({
      ...node,
      depth,
      children: buildTree(nodes, node.id, depth + 1),
    }));
}

export function printTree(nodes: HierarchyNode[], showPaths: boolean = false): void {
  const tree = buildTree(nodes);
  
  const printNode = (node: TreeNode): void => {
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

export async function listNodes(db: HierarchyDatabase, options: { flat?: boolean; paths?: boolean } = {}): Promise<void> {
  const nodes = db.getAllNodes();
  
  if (options.flat) {
    console.log(chalk.bold("\n📋 All Nodes:\n"));
    for (const node of nodes) {
      const prefix = node.type === "group" ? "📁" : "📄";
      const pathInfo = options.paths && node.notePath ? ` → ${node.notePath}` : "";
      console.log(`  ${prefix} [${node.id}] ${node.title}${pathInfo}`);
    }
    console.log();
  } else {
    printTree(nodes, options.paths);
  }
}

export async function createNode(
  db: HierarchyDatabase,
  title: string,
  type: "group" | "note",
  parentId: number | null,
  vaultPath: string,
  notePath?: string
): Promise<number> {
  let finalNotePath: string | null = null;
  
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
    } else {
      fs.writeFileSync(finalNotePath, `# ${title}\n`);
    }
    
    console.log(chalk.green(`✓ Created note: ${finalNotePath}`));
  }
  
  const id = db.createNode(title, type, parentId, finalNotePath);
  await db.save();
  
  console.log(chalk.green(`✓ Created ${type}: "${title}" (ID: ${id})`));
  return id;
}

export async function deleteNode(db: HierarchyDatabase, id: number, deleteFiles: boolean = false): Promise<void> {
  const node = db.getNodeById(id);
  if (!node) {
    console.log(chalk.red(`✗ Node with ID ${id} not found`));
    return;
  }
  
  // Delete associated files if requested
  if (deleteFiles && node.notePath && fs.existsSync(node.notePath)) {
    fs.unlinkSync(node.notePath);
    console.log(chalk.yellow(`  Deleted file: ${node.notePath}`));
  }
  
  db.deleteNode(id);
  await db.save();
  
  console.log(chalk.green(`✓ Deleted: "${node.title}" (ID: ${id})`));
}

export async function moveNode(db: HierarchyDatabase, id: number, newParentId: number | null, index?: number): Promise<void> {
  const node = db.getNodeById(id);
  if (!node) {
    console.log(chalk.red(`✗ Node with ID ${id} not found`));
    return;
  }
  
  if (newParentId !== null) {
    const parent = db.getNodeById(newParentId);
    if (!parent) {
      console.log(chalk.red(`✗ Parent node with ID ${newParentId} not found`));
      return;
    }
  }
  
  db.moveNode(id, newParentId, index ?? null);
  await db.save();
  
  console.log(chalk.green(`✓ Moved "${node.title}" to parent ID ${newParentId}`));
}

export async function renameNode(db: HierarchyDatabase, id: number, newTitle: string): Promise<void> {
  const node = db.getNodeById(id);
  if (!node) {
    console.log(chalk.red(`✗ Node with ID ${id} not found`));
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
    console.log(chalk.yellow(`  Renamed file: ${node.notePath} → ${newPath}`));
  }
  
  console.log(chalk.green(`✓ Renamed "${oldTitle}" → "${newTitle}"`));
}

export async function exportHierarchy(db: HierarchyDatabase, outputPath: string): Promise<void> {
  const json = db.exportToJson();
  fs.writeFileSync(outputPath, json);
  console.log(chalk.green(`✓ Exported hierarchy to: ${outputPath}`));
}

export async function importHierarchy(db: HierarchyDatabase, inputPath: string, merge: boolean = false): Promise<void> {
  if (!fs.existsSync(inputPath)) {
    console.log(chalk.red(`✗ File not found: ${inputPath}`));
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
  
  console.log(chalk.green(`✓ Imported hierarchy from: ${inputPath}`));
}

export async function searchNodes(db: HierarchyDatabase, query: string): Promise<void> {
  const nodes = db.getAllNodes();
  const results = nodes.filter(
    (node) =>
      node.title.toLowerCase().includes(query.toLowerCase()) ||
      (node.notePath && node.notePath.toLowerCase().includes(query.toLowerCase()))
  );
  
  if (results.length === 0) {
    console.log(chalk.yellow(`No results found for: "${query}"`));
    return;
  }
  
  console.log(chalk.bold(`\n🔍 Search results for "${query}":\n`));
  for (const node of results) {
    const prefix = node.type === "group" ? "📁" : "📄";
    const pathInfo = node.notePath ? ` → ${node.notePath}` : "";
    console.log(`  ${prefix} [${node.id}] ${node.title}${pathInfo}`);
  }
  console.log();
}

export async function showSettings(db: HierarchyDatabase): Promise<void> {
  const settings = db.getSettings();
  
  console.log(chalk.bold("\n⚙️  Current Settings:\n"));
  console.log(`  Database file: ${settings.dbFileName}`);
  console.log(`  Backup path:   ${settings.backupDbPath || "(not set)"}`);
  console.log(`  Root folder:   ${settings.noteRootFolder || "(root)"}`);
  console.log(`  File format:   ${settings.noteExtension}`);
  console.log();
}

export async function updateSetting(db: HierarchyDatabase, key: string, value: string): Promise<void> {
  const validKeys = ["dbFileName", "backupDbPath", "noteRootFolder", "noteExtension"];
  
  if (!validKeys.includes(key)) {
    console.log(chalk.red(`✗ Invalid setting key. Valid keys: ${validKeys.join(", ")}`));
    return;
  }
  
  if (key === "noteExtension" && !value.startsWith(".")) {
    value = "." + value;
  }
  
  db.updateSetting(key, value);
  await db.save();
  
  console.log(chalk.green(`✓ Updated ${key} = "${value}"`));
}

export async function getNodeInfo(db: HierarchyDatabase, id: number): Promise<void> {
  const node = db.getNodeById(id);
  
  if (!node) {
    console.log(chalk.red(`✗ Node with ID ${id} not found`));
    return;
  }
  
  const children = db.getChildren(id);
  const parent = node.parentId ? db.getNodeById(node.parentId) : null;
  
  console.log(chalk.bold(`\n📄 Node Details [ID: ${id}]\n`));
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

export async function createBackup(db: HierarchyDatabase, backupPath: string): Promise<void> {
  const json = db.exportToJson();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `hierarchy-backup-${timestamp}.json`;
  const fullPath = path.join(backupPath, filename);
  
  fs.writeFileSync(fullPath, json);
  console.log(chalk.green(`✓ Backup created: ${fullPath}`));
}

export async function restoreBackup(db: HierarchyDatabase, backupPath: string): Promise<void> {
  if (!fs.existsSync(backupPath)) {
    console.log(chalk.red(`✗ Backup file not found: ${backupPath}`));
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
  
  console.log(chalk.green(`✓ Restored from: ${backupPath}`));
}

export async function syncWithVault(db: HierarchyDatabase, vaultPath: string): Promise<void> {
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
  
  const scanFolder = (dir: string): string[] => {
    const files: string[] = [];
    if (!fs.existsSync(dir)) return files;
    
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...scanFolder(fullPath));
      } else if (entry.name.endsWith(extension)) {
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
  
  console.log(chalk.green(`✓ Synced with vault. Added ${notesAdded} new notes.`));
}
