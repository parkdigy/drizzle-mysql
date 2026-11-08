import type { MySqlTable } from 'drizzle-orm/mysql-core';
import type { MySqlAliasTable } from './columns.cjs';
type Abbreviation<S extends string, First extends boolean = true> = S extends `${infer Char}${infer Rest}` ? First extends true ? `${Lowercase<Char>}${Abbreviation<Rest, false>}` : Char extends Uppercase<Char> ? `${Lowercase<Char>}${Abbreviation<Rest, false>}` : Abbreviation<Rest, false> : '';
export type MySqlAliases<TSchema extends Record<string, MySqlTable>> = {
    [K in keyof TSchema & string]: {
        (alias?: Abbreviation<K>): MySqlAliasTable<TSchema[K], Abbreviation<K>>;
        <TAlias extends string>(alias: TAlias): MySqlAliasTable<TSchema[K], TAlias>;
    };
};
export declare function createAlias<TSchema extends Record<string, MySqlTable>>(schema: TSchema): MySqlAliases<TSchema>;
export {};
