import mysql from 'mysql2/promise';
import { SQL, sql, type Subquery } from 'drizzle-orm';
import { alias, type MySqlTable } from 'drizzle-orm/mysql-core';
import * as native from 'drizzle-orm';
import { type MySqlAliases } from './alias.cjs';
import { type MySqlSchemaConditions } from './conditions.cjs';
import { TableColumns } from './columns.cjs';
import { MySqlQuery } from './MySqlQuery.cjs';
export interface DrizzleMySqlOptions<TSchema extends Record<string, MySqlTable>> {
    url: string;
    schema: TSchema;
    getTimestamp: () => unknown;
}
type MySqlConnection<TSchema extends Record<string, MySqlTable>> = ReturnType<typeof createConnection<TSchema>>;
interface MySqlDatabaseHelpers<TSchema extends Record<string, MySqlTable>> extends MySqlNativeHelpers {
    s: TSchema;
    a: MySqlAliases<TSchema>;
    columns: typeof TableColumns;
    alias: typeof alias;
    sql: typeof sql;
    sqlNumber(value: SQL | number): SQL<number>;
    sqlString(value: SQL | string): SQL<string>;
    sqlBoolean(value: SQL | boolean): SQL<boolean>;
    current: MySqlConnection<TSchema>['current'];
    trans: MySqlConnection<TSchema>['trans'];
    paginate: MySqlConnection<TSchema>['paginate'];
    close: MySqlConnection<TSchema>['close'];
    query<TTable extends MySqlTable>(table: TTable): MySqlQuery<TTable>;
}
type MySqlNativeHelpers = Pick<typeof native, 'asc' | 'desc' | 'count' | 'countDistinct' | 'avg' | 'avgDistinct' | 'sum' | 'sumDistinct' | 'max' | 'min' | 'not' | 'exists' | 'notExists' | 'arrayContains' | 'arrayContained' | 'arrayOverlaps'>;
export type DrizzleMySql<TSchema extends Record<string, MySqlTable>> = MySqlDatabaseHelpers<TSchema> & MySqlSchemaConditions<TSchema>;
declare function createConnection<TSchema extends Record<string, MySqlTable>>(options: DrizzleMySqlOptions<TSchema>): {
    current: (() => (import("drizzle-orm/mysql2").MySql2Database<native.ExtractTablesWithRelations<{}, native.ExtractTablesFromSchema<TSchema>>> & {
        $client: mysql.Pool;
    }) | import("drizzle-orm/mysql-core").MySqlAsyncTransaction<import("drizzle-orm/mysql2").MySql2QueryResultHKT, native.ExtractTablesWithRelations<{}, native.ExtractTablesFromSchema<TSchema>>>) & {
        getTimestamp: () => unknown;
    };
    trans: <T>(callback: () => Promise<T>) => Promise<T>;
    paginate: <TResult extends unknown[]>(builder: {
        limit(limit: number): {
            offset(offset: number): PromiseLike<TResult>;
        };
        as(alias: string): Subquery;
    }, page: number, limit: number) => Promise<{
        data: Awaited<TResult>;
        paging: {
            current_page: number;
            per_page: number;
            last_page: number;
            total: number;
            from: number;
            to: number;
        };
    }>;
    close: () => Promise<void>;
};
export declare function drizzleMySql<TSchema extends Record<string, MySqlTable>>(options: DrizzleMySqlOptions<TSchema>): DrizzleMySql<TSchema>;
export {};
