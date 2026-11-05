import type { MySqlTable } from 'drizzle-orm/mysql-core';
import { alias as _alias } from 'drizzle-orm/mysql-core/alias';
import type { MySqlAliasTable } from './columns';

export function createAlias<TSchema extends Record<string, MySqlTable>>(schema: TSchema) {
  /********************************************************************************************************************
   * SchemaKey
   * ******************************************************************************************************************/
  type SchemaKey = keyof TSchema & string;

  /********************************************************************************************************************
   * SchemaTable
   * ******************************************************************************************************************/
  type SchemaTable<K extends SchemaKey> = (typeof schema)[K];

  /********************************************************************************************************************
   * Abbreviation
   * ******************************************************************************************************************/
  type Abbreviation<S extends string, First extends boolean = true> = S extends `${infer Char}${infer Rest}`
    ? First extends true
      ? `${Lowercase<Char>}${Abbreviation<Rest, false>}`
      : Char extends Uppercase<Char>
        ? `${Lowercase<Char>}${Abbreviation<Rest, false>}`
        : Abbreviation<Rest, false>
    : '';

  /********************************************************************************************************************
   * DefaultAlias
   * ******************************************************************************************************************/
  type DefaultAlias<K extends SchemaKey> = Abbreviation<K>;

  /********************************************************************************************************************
   * getDefaultAlias
   * ******************************************************************************************************************/
  const getDefaultAlias = (tableName: SchemaKey) =>
    `${tableName[0]}${(tableName.slice(1).match(/[A-Z]/g) ?? []).join('')}`.toLowerCase();

  /********************************************************************************************************************
   * TableAliases
   * ******************************************************************************************************************/
  type TableAliases = {
    [K in SchemaKey]: {
      (alias?: DefaultAlias<K>): MySqlAliasTable<SchemaTable<K>, DefaultAlias<K>>;
      <TAlias extends string>(alias: TAlias): MySqlAliasTable<SchemaTable<K>, TAlias>;
    };
  };

  /********************************************************************************************************************
   * createAlias
   * ******************************************************************************************************************/
  const createAlias =
    <K extends SchemaKey>(tableName: K) =>
    (alias: string = getDefaultAlias(tableName)) =>
      _alias(schema[tableName], alias);

  /********************************************************************************************************************
   * alias
   * ******************************************************************************************************************/
  const alias = Object.fromEntries(
    (Object.keys(schema) as SchemaKey[]).map((tableName) => [tableName, createAlias(tableName)])
  ) as unknown as TableAliases;

  return alias;
}
