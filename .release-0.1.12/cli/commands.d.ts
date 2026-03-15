import { HierarchyDatabase, HierarchyNode } from "./database";
export interface TreeNode extends HierarchyNode {
    children: TreeNode[];
    depth: number;
}
export declare function buildTree(nodes: HierarchyNode[], parentId?: number | null, depth?: number): TreeNode[];
export declare function printTree(nodes: HierarchyNode[], showPaths?: boolean): void;
export declare function listNodes(db: HierarchyDatabase, options?: {
    flat?: boolean;
    paths?: boolean;
}): Promise<void>;
export declare function createNode(db: HierarchyDatabase, title: string, type: "group" | "note", parentId: number | null, vaultPath: string, notePath?: string): Promise<number>;
export declare function deleteNode(db: HierarchyDatabase, id: number, deleteFiles?: boolean): Promise<void>;
export declare function moveNode(db: HierarchyDatabase, id: number, newParentId: number | null, index?: number): Promise<void>;
export declare function renameNode(db: HierarchyDatabase, id: number, newTitle: string): Promise<void>;
export declare function exportHierarchy(db: HierarchyDatabase, outputPath: string): Promise<void>;
export declare function importHierarchy(db: HierarchyDatabase, inputPath: string, merge?: boolean): Promise<void>;
export declare function searchNodes(db: HierarchyDatabase, query: string): Promise<void>;
export declare function showSettings(db: HierarchyDatabase): Promise<void>;
export declare function updateSetting(db: HierarchyDatabase, key: string, value: string): Promise<void>;
export declare function getNodeInfo(db: HierarchyDatabase, id: number): Promise<void>;
export declare function createBackup(db: HierarchyDatabase, backupPath: string): Promise<void>;
export declare function restoreBackup(db: HierarchyDatabase, backupPath: string): Promise<void>;
export declare function syncWithVault(db: HierarchyDatabase, vaultPath: string): Promise<void>;
//# sourceMappingURL=commands.d.ts.map