import mysql from 'mysql2/promise';
import type { PoolOptions } from 'mysql2/promise';
import { SQL, sql, Subquery } from 'drizzle-orm';
import { alias, type MySqlTable } from 'drizzle-orm/mysql-core';
import * as native from 'drizzle-orm';
import { type MySqlAliases } from './alias.cjs';
import { type MySqlSchemaConditions } from './conditions.cjs';
import { TableColumns } from './columns.cjs';
import type { MySqlColumnName } from './@types/index.cjs';
import { MySqlQuery, type SelectFrom, type SelectInput, type ResolveSelectInput, type SubquerySelectInput, type ResolveSubquerySelectInput } from './MySqlQuery.cjs';
export type DrizzleMySqlOptions<TSchema extends Record<string, MySqlTable>> = {
    schema: TSchema;
    getTimestamp?: () => unknown;
} & (({
    url: string;
} & Omit<PoolOptions, 'uri'>) | (PoolOptions & {
    uri?: never;
    url?: never;
}));
type MySqlConnection<TSchema extends Record<string, MySqlTable>> = ReturnType<typeof createConnection<TSchema>>;
type SelectTable<TSchema, TSource> = TSource extends MySqlTable ? TSource : TSource extends keyof TSchema ? Extract<TSchema[TSource], MySqlTable> : never;
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
    select<TSource extends (keyof TSchema & string) | MySqlTable, const TArgs extends readonly [fields?: SelectInput<SelectTable<TSchema, TSource>>]>(table: TSource, ...args: TArgs): SelectFrom<SelectTable<TSchema, TSource>, ResolveSelectInput<SelectTable<TSchema, TSource>, TArgs[0]>>;
    select<TSource extends Subquery, const TArgs extends readonly [fields?: SubquerySelectInput<TSource>]>(source: TSource, ...args: TArgs): SelectFrom<TSource, ResolveSubquerySelectInput<TSource, TArgs[0]>>;
    query<TTable extends MySqlTable>(table: TTable): MySqlQuery<TTable>;
}
type OrderByColumn = Parameters<typeof native.asc>[0];
type AliasOrderByHelper = {
    <TTable extends MySqlTable>(table: TTable, name: MySqlColumnName<TTable>): SQL;
    <TTable extends MySqlTable>(table: TTable, first: MySqlColumnName<TTable>, second: MySqlColumnName<TTable>, ...rest: MySqlColumnName<TTable>[]): SQL[];
};
type MultiColumnOrderHelper = {
    (column: OrderByColumn): SQL;
    (first: OrderByColumn, second: OrderByColumn, ...rest: OrderByColumn[]): SQL[];
} & AliasOrderByHelper;
type MySqlNativeHelpers = Omit<Pick<typeof native, 'count' | 'countDistinct' | 'avg' | 'avgDistinct' | 'sum' | 'sumDistinct' | 'max' | 'min' | 'not' | 'exists' | 'notExists' | 'arrayContains' | 'arrayContained' | 'arrayOverlaps'>, 'asc' | 'desc'> & {
    asc: MultiColumnOrderHelper;
    desc: MultiColumnOrderHelper;
};
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
