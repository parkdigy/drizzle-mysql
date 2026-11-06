import { type ColumnBuilderBase } from 'drizzle-orm/column-builder';
import { type MySqlTable, type MySqlTableWithColumns } from 'drizzle-orm/mysql-core';
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
type Mark<T, P extends ColumnPolicy> = T & {
    readonly [policyType]: P;
};
declare module 'drizzle-orm/column-builder' {
    interface ColumnBuilder<T, TRuntimeConfig, TExtraConfig> {
        insertBlocked(): Mark<this, {
            insert: 'blocked';
        }>;
        insertAllowed(): Mark<this, {
            insert: 'allowed';
        }>;
        updateBlocked(): Mark<this, {
            update: 'blocked';
        }>;
        updateAllowed(): Mark<this, {
            update: 'allowed';
        }>;
        updateRequired(): Mark<this, {
            update: 'required';
        }>;
        createdAt(): Mark<this, {
            timestamp: 'created';
        }>;
        updatedAt(): Mark<this, {
            timestamp: 'updated';
        }>;
    }
}
type Policies<C> = {
    [K in keyof C]: C[K] extends {
        readonly [policyType]: infer P;
    } ? P : {};
};
export type TablePolicies<T> = T extends {
    readonly [tablePolicyType]: infer P;
} ? P : {};
type TableResult<N extends string, C extends Record<string, ColumnBuilderBase>> = MySqlTableWithColumns<{
    name: N;
    schema: undefined;
    columns: BuildColumns<N, C, 'mysql'>;
    dialect: 'mysql';
    isAlias: false;
}> & {
    readonly [tablePolicyType]: Policies<C>;
};
export declare function getColumnPolicies(table: MySqlTable): Record<string, ColumnPolicy>;
export declare function mysqlTable<N extends string, C extends Record<string, ColumnBuilderBase>>(name: N, columns: C | ((types: MySqlColumnBuilders) => C), extraConfig?: (self: BuildColumns<N, C, 'mysql'>) => MySqlTableExtraConfig | (MySqlTableExtraConfigValue | MySqlTableExtraConfigValue[])[]): TableResult<N, C>;
export {};
