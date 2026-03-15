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
export declare class HierarchyDatabase {
    private db;
    private dbPath;
    private sqlPromise;
    constructor(vaultPath: string, dbFileName?: string);
    initialize(): Promise<void>;
    private createTables;
    save(): Promise<void>;
    getAllNodes(): HierarchyNode[];
    getNodeById(id: number): HierarchyNode | null;
    createNode(title: string, type: "group" | "note", parentId: number | null, notePath?: string | null): number;
    updateNode(id: number, title: string): void;
    deleteNode(id: number): void;
    moveNode(id: number, newParentId: number | null, newIndex: number | null): void;
    getChildren(parentId: number | null): HierarchyNode[];
    getSettings(): HierarchySettings;
    updateSetting(key: string, value: string): void;
    exportToJson(): string;
    importFromJson(jsonString: string): void;
    close(): void;
}
export declare function findVaultPath(): string | null;
//# sourceMappingURL=database.d.ts.map