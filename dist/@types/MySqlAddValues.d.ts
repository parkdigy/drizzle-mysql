import type { MySqlTable } from 'drizzle-orm/mysql-core/table';
import type { MySqlInsertValue as InsertValue } from 'drizzle-orm/mysql-core/query-builders/insert';
import type { TablePolicies } from '../mysqlTable.js';
type Blocked<T extends MySqlTable> = {
    [K in keyof InsertValue<T>]: K extends keyof TablePolicies<T> ? TablePolicies<T>[K] extends {
        insert: 'blocked';
    } ? K : TablePolicies<T>[K] extends {
        insert: 'allowed';
    } ? never : K extends keyof T['_']['columns'] ? T['_']['columns'][K]['_']['isAutoincrement'] extends true ? K : never : never : K extends keyof T['_']['columns'] ? T['_']['columns'][K]['_']['isAutoincrement'] extends true ? K : never : never;
}[keyof InsertValue<T>];
type TimestampKeys<T extends MySqlTable> = {
    [K in keyof InsertValue<T>]-?: K extends keyof TablePolicies<T> ? TablePolicies<T>[K] extends {
        timestamp: string;
    } ? K : never : never;
}[keyof InsertValue<T>] & keyof InsertValue<T>;
export type MySqlAddValues<T extends MySqlTable, B extends keyof InsertValue<T> = never> = Omit<InsertValue<T>, B | Blocked<T> | TimestampKeys<T>> & Partial<Pick<InsertValue<T>, Exclude<TimestampKeys<T>, B | Blocked<T>>>>;
export {};
