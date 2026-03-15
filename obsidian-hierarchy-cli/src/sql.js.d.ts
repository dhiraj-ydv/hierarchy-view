declare module "sql.js" {
  interface SqlValue {
    [key: string]: any;
  }
  
  interface QueryExecResult {
    columns: string[];
    values: any[][];
  }
  
  interface Statement {
    bind(params?: any[]): boolean;
    step(): boolean;
    getAsObject(params?: object): object;
    get(params?: any[]): any[];
    run(params?: any[]): void;
    free(): boolean;
    reset(): void;
  }
  
  interface Database {
    run(sql: string, params?: any[]): void;
    exec(sql: string, params?: any[]): QueryExecResult[];
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
  }
  
  interface SqlJsStatic {
    Database: new (data?: ArrayLike<number>) => Database;
  }
  
  export default function initSqlJs(config?: any): Promise<SqlJsStatic>;
  export { Database, Statement, QueryExecResult, SqlJsStatic as SqlJsModule };
}
