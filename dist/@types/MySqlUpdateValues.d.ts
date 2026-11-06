import type { MySqlTable } from 'drizzle-orm/mysql-core/table';
import type { MySqlUpdateSetSource } from 'drizzle-orm/mysql-core/query-builders/update';
import type { TablePolicies } from '../mysqlTable.js';
type DefaultBlocked<T extends MySqlTable, K> = K extends keyof T['_']['columns'] ? T['_']['columns'][K]['_']['isPrimaryKey'] extends true ? K : T['_']['columns'][K]['_']['isAutoincrement'] extends true ? K : never : never;
type Blocked<T extends MySqlTable> = {
    [K in keyof MySqlUpdateSetSource<T>]-?: K extends keyof TablePolicies<T> ? TablePolicies<T>[K] extends {
        timestamp: 'created';
    } | {
        update: 'blocked';
    } ? K : TablePolicies<T>[K] extends {
        update: 'allowed';
    } ? never : K extends keyof T['_']['columns'] ? T['_']['columns'][K]['_']['isPrimaryKey'] extends true ? K : TablePolicies<T>[K] extends {
        update: 'required';
    } ? never : DefaultBlocked<T, K> : never : DefaultBlocked<T, K>;
}[keyof MySqlUpdateSetSource<T>] & keyof MySqlUpdateSetSource<T>;
type RequiredKeys<T extends MySqlTable> = {
    [K in keyof MySqlUpdateSetSource<T>]-?: K extends keyof TablePolicies<T> ? TablePolicies<T>[K] extends {
        update: 'required';
    } ? TablePolicies<T>[K] extends {
        timestamp: 'updated';
    } ? never : K : never : never;
}[keyof MySqlUpdateSetSource<T>] & keyof MySqlUpdateSetSource<T>;
export type MySqlUpdateValues<T extends MySqlTable, B extends keyof MySqlUpdateSetSource<T> = never, R extends Exclude<keyof MySqlUpdateSetSource<T>, B | Blocked<T>> = never> = Omit<MySqlUpdateSetSource<T>, B | Blocked<T> | R | RequiredKeys<T>> & {
    [K in Exclude<R | RequiredKeys<T>, B | Blocked<T>>]-?: Exclude<MySqlUpdateSetSource<T>[K], undefined>;
};
export {};
