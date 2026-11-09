import { Subquery, type SQL } from 'drizzle-orm';
import type { MySqlColumn, MySqlTable, MySqlTableWithColumns } from 'drizzle-orm/mysql-core';
import type { BuildAliasTable } from 'drizzle-orm/mysql-core/query-builders/select.types';
/********************************************************************************************************************
 * MySqlAliasTable
 * ******************************************************************************************************************/
export type MySqlAliasTable<T extends MySqlTable, Alias extends string> = MySqlTableWithColumns<Omit<BuildAliasTable<T, Alias>['_'], 'columns'> & {
    columns: {
        [K in keyof T['_']['columns']]: MySqlColumn<BuildAliasTable<T, Alias>['_']['columns'][K]['_'] & {
            name: T['_']['columns'][K]['_']['name'];
        }>;
    };
}>;
/********************************************************************************************************************
 * MySqlSelectedColumns
 * ******************************************************************************************************************/
export type MySqlSelectedColumns<T extends readonly MySqlColumn[]> = {
    [C in T[number] as C['_']['name']]: C;
};
/********************************************************************************************************************
 * MySqlTableColumns
 * ******************************************************************************************************************/
export type MySqlSelectedTableColumns<T extends MySqlTable> = {
    [K in keyof T['_']['columns'] as string extends T['_']['columns'][K]['_']['name'] ? K : T['_']['columns'][K]['_']['name']]: T['_']['columns'][K];
};
/********************************************************************************************************************
 * MySqlColumnSelectionName
 * ******************************************************************************************************************/
type AsKeyword = 'as' | 'AS' | 'As' | 'aS';
export type MySqlColumnSelectionName<T extends MySqlTable> = (keyof T['_']['columns'] & string) | `${keyof T['_']['columns'] & string} ${AsKeyword} ${string}`;
/********************************************************************************************************************
 * MySqlSelectedNamedColumn
 * ******************************************************************************************************************/
type MySqlColumnForName<T extends MySqlTable, N extends string> = Extract<T['_']['columns'][Extract<N, keyof T['_']['columns']>], MySqlColumn>;
/********************************************************************************************************************
 * MySqlSelectedNamedColumn
 * ******************************************************************************************************************/
type MySqlSelectionKey<T extends MySqlTable, N extends string> = N extends `${string} ${AsKeyword} ${infer Alias}` ? Alias : string extends MySqlColumnForName<T, N>['_']['name'] ? N : MySqlColumnForName<T, N>['_']['name'];
/********************************************************************************************************************
 * MySqlSelectedNamedColumn
 * ******************************************************************************************************************/
type MySqlSelectionValue<T extends MySqlTable, N extends string> = N extends `${infer Name} ${AsKeyword} ${string}` ? SQL.Aliased<MySqlColumnForName<T, Name>['_']['data']> : MySqlColumnForName<T, N>;
/********************************************************************************************************************
 * MySqlSelectedNamedColumn
 * ******************************************************************************************************************/
type MySqlSelectedNamedColumn<T extends MySqlTable, N extends string> = {
    [K in MySqlSelectionKey<T, N>]: MySqlSelectionValue<T, N>;
};
/********************************************************************************************************************
 * MySqlSelectedNamedColumnUnion
 * ******************************************************************************************************************/
export type MySqlSelectedNamedColumnUnion<T extends MySqlTable, N extends string> = {
    [Name in N as MySqlSelectionKey<T, Name>]: MySqlSelectionValue<T, Name>;
};
/********************************************************************************************************************
 * MySqlSelectedNamedColumns
 * ******************************************************************************************************************/
export type MySqlSelectedNamedColumns<T extends MySqlTable, N extends readonly string[], Result = {}> = number extends N['length'] ? {
    [Name in N[number] as MySqlSelectionKey<T, Name>]: MySqlSelectionValue<T, Name>;
} : N extends readonly [infer First extends string, ...infer Rest extends readonly string[]] ? MySqlSelectedNamedColumns<T, Rest, Omit<Result, MySqlSelectionKey<T, First>> & MySqlSelectedNamedColumn<T, First>> : Result;
/********************************************************************************************************************
 * MySqlColumnGroup
 * ******************************************************************************************************************/
type MySqlColumnGroup = readonly [MySqlTable, ...string[]];
type MySqlSubqueryFields<T extends Subquery> = T['_']['selectedFields'];
/********************************************************************************************************************
 * MySqlGroupColumns
 * ******************************************************************************************************************/
type MySqlGroupColumns<G extends MySqlColumnGroup> = G extends readonly [infer T extends MySqlTable, ...infer N] ? N extends readonly [] ? MySqlSelectedTableColumns<T> : MySqlSelectedNamedColumns<T, Extract<N, readonly string[]>> : never;
/********************************************************************************************************************
 * MySqlMergedGroupColumns
 * ******************************************************************************************************************/
type MySqlMergedGroupColumns<G extends readonly MySqlColumnGroup[], Result = {}> = G extends readonly [
    infer First extends MySqlColumnGroup,
    ...infer Rest extends readonly MySqlColumnGroup[]
] ? MySqlMergedGroupColumns<Rest, Omit<Result, keyof MySqlGroupColumns<First>> & MySqlGroupColumns<First>> : {
    [P in keyof Result]: Result[P];
};
/********************************************************************************************************************
 * MySqlTableColumns
 * ******************************************************************************************************************/
export declare function TableColumns<A extends MySqlTable, const AN extends readonly MySqlColumnSelectionName<A>[], B extends MySqlTable, const BN extends readonly MySqlColumnSelectionName<B>[]>(a: readonly [A, ...AN], b: readonly [B, ...BN]): MySqlMergedGroupColumns<readonly [readonly [A, ...AN], readonly [B, ...BN]]>;
export declare function TableColumns<T extends MySqlTable>(table: T): MySqlSelectedTableColumns<T>;
export declare function TableColumns<T extends MySqlTable, N extends MySqlColumnSelectionName<T>>(table: T, ...names: N[]): MySqlSelectedNamedColumnUnion<T, N>;
export declare function TableColumns<T extends MySqlTable, N extends string>(table: T, ...names: N[] & MySqlColumnSelectionName<T>[]): Record<string, MySqlColumn | SQL.Aliased>;
export declare function TableColumns<const T extends readonly MySqlColumn[]>(columns: T): MySqlSelectedColumns<T>;
export declare function TableColumns<const T extends readonly [MySqlColumn, ...MySqlColumn[]]>(...columns: T): MySqlSelectedColumns<T>;
export declare function TableColumns<const G extends readonly [MySqlColumnGroup, ...MySqlColumnGroup[]]>(...groups: G & {
    [I in keyof G]: readonly [G[I][0], ...MySqlColumnSelectionName<G[I][0]>[]];
}): MySqlMergedGroupColumns<G>;
export declare function TableColumns<T extends Subquery>(subquery: T): MySqlSubqueryFields<T>;
export declare function TableColumns<T extends Subquery, N extends keyof MySqlSubqueryFields<T> & string>(subquery: T, ...names: N[]): Pick<MySqlSubqueryFields<T>, N>;
export {};
