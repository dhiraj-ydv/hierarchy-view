declare module "sql.js" {
	export type SqlValue = number | string | Uint8Array | null;

	export interface QueryExecResult {
		values: SqlValue[][];
	}

	export interface Statement {
		bind(values: SqlValue[]): void;
		step(): boolean;
		getAsObject(): Record<string, SqlValue>;
		free(): void;
	}

	export interface Database {
		exec(sql: string): QueryExecResult[];
		run(sql: string, params?: SqlValue[]): void;
		prepare(sql: string): Statement;
		export(): Uint8Array;
	}

	export interface SqlJsStatic {
		Database: new (data?: Uint8Array) => Database;
	}

	interface InitSqlJsConfig {
		wasmBinary?: Uint8Array;
	}

	export default function initSqlJs(config?: InitSqlJsConfig): Promise<SqlJsStatic>;
}
