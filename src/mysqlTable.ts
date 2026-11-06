import { ColumnBuilder, type ColumnBuilderBase } from 'drizzle-orm/column-builder';
import { mysqlTable as nativeTable, type MySqlTable, type MySqlTableWithColumns } from 'drizzle-orm/mysql-core';
import type { BuildColumns } from 'drizzle-orm/column-builder';
import type { MySqlColumnBuilders } from 'drizzle-orm/mysql-core/columns/all';
import type { MySqlTableExtraConfig, MySqlTableExtraConfigValue } from 'drizzle-orm/mysql-core/table';

export type ColumnPolicy = {
  insert?: 'blocked' | 'allowed';
  update?: 'blocked' | 'allowed' | 'required';
  timestamp?: 'created' | 'updated';
};
declare const policyType: unique symbol;
declare const tablePolicyType: unique symbol;
type Mark<T, P extends ColumnPolicy> = T & { readonly [policyType]: P };

declare module 'drizzle-orm/column-builder' {
  // Drizzle의 제네릭 선언과 동일하게 병합한다.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnBuilder<T, TRuntimeConfig, TExtraConfig> {
    insertBlocked(): Mark<this, { insert: 'blocked' }>;
    insertAllowed(): Mark<this, { insert: 'allowed' }>;
    updateBlocked(): Mark<this, { update: 'blocked' }>;
    updateAllowed(): Mark<this, { update: 'allowed' }>;
    updateRequired(): Mark<this, { update: 'required' }>;
    createdAt(): Mark<this, { timestamp: 'created' }>;
    updatedAt(): Mark<this, { timestamp: 'updated' }>;
  }
}

const policies = new WeakMap<object, ColumnPolicy>();
for (const [method, policy] of Object.entries({
  insertBlocked: { insert: 'blocked' },
  insertAllowed: { insert: 'allowed' },
  updateBlocked: { update: 'blocked' },
  updateAllowed: { update: 'allowed' },
  updateRequired: { update: 'required' },
  createdAt: { timestamp: 'created' },
  updatedAt: { timestamp: 'updated' },
} as Record<string, ColumnPolicy>)) {
  Object.defineProperty(ColumnBuilder.prototype, method, {
    configurable: true,
    value: function (this: object) {
      policies.set(this, { ...policies.get(this), ...policy });
      return this;
    },
  });
}

type Policies<C> = { [K in keyof C]: C[K] extends { readonly [policyType]: infer P } ? P : {} };
export type TablePolicies<T> = T extends { readonly [tablePolicyType]: infer P } ? P : {};
type TableResult<N extends string, C extends Record<string, ColumnBuilderBase>> = MySqlTableWithColumns<{
  name: N;
  schema: undefined;
  columns: BuildColumns<N, C, 'mysql'>;
  dialect: 'mysql';
  isAlias: false;
}> & { readonly [tablePolicyType]: Policies<C> };
const tablePolicies = new WeakMap<MySqlTable, Record<string, ColumnPolicy>>();
export function getColumnPolicies(table: MySqlTable): Record<string, ColumnPolicy> {
  return tablePolicies.get(table) ?? {};
}

export function mysqlTable<N extends string, C extends Record<string, ColumnBuilderBase>>(
  name: N,
  columns: C | ((types: MySqlColumnBuilders) => C),
  extraConfig?: (
    self: BuildColumns<N, C, 'mysql'>
  ) => MySqlTableExtraConfig | (MySqlTableExtraConfigValue | MySqlTableExtraConfigValue[])[]
): TableResult<N, C>;
export function mysqlTable(
  name: string,
  columns: Record<string, ColumnBuilderBase> | ((types: MySqlColumnBuilders) => Record<string, ColumnBuilderBase>),
  extraConfig?: any
): any {
  let builders: Record<string, ColumnBuilderBase> = {};
  const table =
    typeof columns === 'function'
      ? nativeTable(name, (types) => (builders = columns(types)), extraConfig)
      : nativeTable(name, (builders = columns), extraConfig);
  tablePolicies.set(
    table,
    Object.fromEntries(Object.entries(builders).map(([key, builder]) => [key, policies.get(builder) ?? {}]))
  );
  return table;
}
