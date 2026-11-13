import type { MySqlTable } from 'drizzle-orm/mysql-core';
import { alias as _alias } from 'drizzle-orm/mysql-core/alias';
import type { MySqlAliasTable } from './columns';

type Abbreviation<S extends string, First extends boolean = true> = S extends `${infer Char}${infer Rest}`
  ? First extends true
    ? `${Lowercase<Char>}${Abbreviation<Rest, false>}`
    : Char extends Uppercase<Char>
      ? `${Lowercase<Char>}${Abbreviation<Rest, false>}`
      : Abbreviation<Rest, false>
  : '';

export type MySqlAliases<TSchema extends Record<string, MySqlTable>> = {
  [K in keyof TSchema & string]: {
    (alias?: Abbreviation<K>): MySqlAliasTable<TSchema[K], Abbreviation<K>>;
    <TAlias extends string>(alias: TAlias): MySqlAliasTable<TSchema[K], TAlias>;
  };
};

export function createAlias<TSchema extends Record<string, MySqlTable>>(schema: TSchema): MySqlAliases<TSchema> {
  type SchemaKey = keyof TSchema & string;

  /********************************************************************************************************************
   * getDefaultAlias
   * ******************************************************************************************************************/
  const getDefaultAlias = (tableName: SchemaKey) =>
    `${tableName[0]}${(tableName.slice(1).match(/[A-Z]/g) ?? []).join('')}`.toLowerCase();

  /********************************************************************************************************************
   * createAlias
   * ******************************************************************************************************************/
  const createAlias =
    <K extends SchemaKey>(tableName: K) =>
    (alias: string = getDefaultAlias(tableName)) =>
      _alias(schema[tableName]!, alias);

  /********************************************************************************************************************
   * alias
   * ******************************************************************************************************************/
  const alias = Object.fromEntries(
    (Object.keys(schema) as SchemaKey[]).map((tableName) => [tableName, createAlias(tableName)])
  ) as unknown as MySqlAliases<TSchema>;

  return alias;
}
