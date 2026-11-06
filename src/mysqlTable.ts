import type { ColumnBuilderBase, ColumnBuilderBaseConfig, ColumnBuilderExtraConfig, ColumnType } from 'drizzle-orm/column-builder';
import { MySqlColumnBuilder } from 'drizzle-orm/mysql-core/columns/common';
import { mysqlTable as nativeTable, type MySqlTable, type MySqlTableWithColumns } from 'drizzle-orm/mysql-core';
import type { BuildColumns } from 'drizzle-orm/column-builder';
import type { MySqlColumnBuilders } from 'drizzle-orm/mysql-core/columns/all';
import type { MySqlTableExtraConfig, MySqlTableExtraConfigValue } from 'drizzle-orm/mysql-core/table';

export type ColumnPolicy = {
  insert?: 'blocked' | 'allowed';
  update?: 'blocked' | 'allowed' | 'required';
  timestamp?: 'created' | 'updated';
};
export type TablePolicy = {
  updateBlocked?: boolean;
  deleteBlocked?: boolean;
};
declare const policyType: unique symbol;
declare const tablePolicyType: unique symbol;
declare const tableMutationPolicyType: unique symbol;
type Mark<T, P extends ColumnPolicy> = T & { readonly [policyType]: P };

declare module 'drizzle-orm/mysql-core/columns/common' {
  // Drizzle의 제네릭 선언과 동일하게 병합한다.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface MySqlColumnBuilder<T extends ColumnBuilderBaseConfig<ColumnType>, TRuntimeConfig extends object, TExtraConfig extends ColumnBuilderExtraConfig> {
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
  Object.defineProperty(MySqlColumnBuilder.prototype, method, {
    configurable: true,
    value: function (this: object) {
      policies.set(this, { ...policies.get(this), ...policy });
      return this;
    },
  });
}

type Policies<C> = { [K in keyof C]: C[K] extends { readonly [policyType]: infer P } ? P : {} };
export type TablePolicies<T> = T extends { readonly [tablePolicyType]: infer P } ? P : {};
export type TableMutationPolicy<T> = T extends { readonly [tableMutationPolicyType]: infer P } ? P : {};
type TableResult<
  N extends string,
  C extends Record<string, ColumnBuilderBase>,
  P extends TablePolicy,
> = MySqlTableWithColumns<{
  name: N;
  schema: undefined;
  columns: BuildColumns<N, C, 'mysql'>;
  dialect: 'mysql';
  isAlias: false;
}> & { readonly [tablePolicyType]: Policies<C>; readonly [tableMutationPolicyType]: P };
const tablePolicies = new WeakMap<MySqlTable, Record<string, ColumnPolicy>>();
const tableMutationPolicies = new WeakMap<MySqlTable, TablePolicy>();
export function getColumnPolicies(table: MySqlTable): Record<string, ColumnPolicy> {
  return tablePolicies.get(table) ?? {};
}

export function getTablePolicy(table: MySqlTable): TablePolicy {
  return tableMutationPolicies.get(table) ?? {};
}

type ExtraConfig<N extends string, C extends Record<string, ColumnBuilderBase>> = (
  self: BuildColumns<N, C, 'mysql'>
) => MySqlTableExtraConfig | (MySqlTableExtraConfigValue | MySqlTableExtraConfigValue[])[];

export function mysqlTable<
  N extends string,
  C extends Record<string, ColumnBuilderBase>,
  const P extends TablePolicy = {},
  const Q extends TablePolicy = {},
>(
  name: N,
  columns: C | ((types: MySqlColumnBuilders) => C),
  extraConfigOrPolicy?: ExtraConfig<N, C> | (P & TablePolicy),
  policy?: Q & TablePolicy
): TableResult<N, C, P & Q>;
export function mysqlTable(
  name: string,
  columns: Record<string, ColumnBuilderBase> | ((types: MySqlColumnBuilders) => Record<string, ColumnBuilderBase>),
  extraConfigOrPolicy?: ExtraConfig<string, Record<string, ColumnBuilderBase>> | TablePolicy,
  policy?: TablePolicy
): any {
  const extraConfig = typeof extraConfigOrPolicy === 'function' ? extraConfigOrPolicy : undefined;
  const mutationPolicy = typeof extraConfigOrPolicy === 'object' ? extraConfigOrPolicy : policy;
  const nativeExtraConfig = extraConfig
    ? (self: BuildColumns<string, Record<string, ColumnBuilderBase>, 'mysql'>) => {
        const config = extraConfig(self);
        return Array.isArray(config) ? config : Object.values(config);
      }
    : undefined;
  let builders: Record<string, ColumnBuilderBase> = {};
  const table =
    typeof columns === 'function'
      ? nativeTable(name, (types) => (builders = columns(types)), nativeExtraConfig)
      : nativeTable(name, (builders = columns), nativeExtraConfig);
  tablePolicies.set(
    table,
    Object.fromEntries(Object.entries(builders).map(([key, builder]) => [key, policies.get(builder) ?? {}]))
  );
  tableMutationPolicies.set(table, { ...mutationPolicy });
  return table;
}
