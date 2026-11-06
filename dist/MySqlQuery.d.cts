import { SQL } from 'drizzle-orm';
import { MySqlTable, MySqlColumn, type MySqlAsyncSelectBase } from 'drizzle-orm/mysql-core';
import type { SelectedFields } from 'drizzle-orm/operations';
import type { GetSelectTableName } from 'drizzle-orm/query-builders/select.types';
import type { MySqlColumnSelectionName, MySqlSelectedNamedColumnUnion, MySqlSelectedNamedColumns, MySqlSelectedTableColumns, MySqlAliasTable } from './columns.cjs';
import type { MySqlInsertValues, MySqlUpdateValues, MySqlCompareValues, MySqlColumnName, MySqlArrayCompareValues, MySqlRangeCompareValues, MySqlPatternCompareValues, MySqlNullConditionInput, MySqlConditions } from './@types/index.cjs';
import type { MySql2Database } from 'drizzle-orm/mysql2';
/********************************************************************************************************************
 * MySqlQuery
 * ******************************************************************************************************************/
export declare class MySqlQuery<TTable extends MySqlTable, IV extends MySqlInsertValues<TTable> = MySqlInsertValues<TTable>, UV extends MySqlUpdateValues<TTable> = MySqlUpdateValues<TTable>, AR = AddResult<TTable>> {
    private readonly current;
    private readonly getTimestamp?;
    readonly t: TTable;
    /********************************************************************************************************************
     * constructor
     * ******************************************************************************************************************/
    constructor(table: TTable, current: (() => MySql2Database) & {
        getTimestamp?: () => unknown;
    }, getTimestamp?: (() => unknown) | undefined);
    private readonly drizzle;
    /********************************************************************************************************************
     * (PROTECTED) getTx
     * ******************************************************************************************************************/
    protected getTx(): MySql2Database<import("drizzle-orm").EmptyRelations>;
    /********************************************************************************************************************
     * columns
     * ******************************************************************************************************************/
    columns(): MySqlSelectedTableColumns<TTable>;
    columns<N extends MySqlColumnSelectionName<TTable>>(...names: N[] & MySqlColumnSelectionName<TTable>[]): MySqlSelectedNamedColumnUnion<TTable, N>;
    private resolveFields;
    /********************************************************************************************************************
     * select
     * ******************************************************************************************************************/
    select(): SelectFrom<TTable, undefined>;
    select(fields: readonly []): SelectFrom<TTable, {}>;
    select<N extends MySqlColumnSelectionName<TTable>>(fields: readonly N[] & readonly MySqlColumnSelectionName<TTable>[]): SelectFrom<TTable, MySqlSelectedNamedColumns<TTable, readonly N[]>>;
    select<const T extends readonly FieldInput[]>(fields: (query: FieldsQuery<TTable>) => T): SelectFrom<TTable, MergeFields<T>>;
    select<const T extends readonly FieldInput[] | readonly MySqlColumnSelectionName<TTable>[]>(fields: T & readonly (FieldInput | MySqlColumnSelectionName<TTable>)[]): SelectFrom<TTable, MergeFields<NamedFields<TTable, T>>>;
    select<TSelection extends SelectedFields<MySqlColumn, TTable>>(fields?: Fields<FieldsQuery<TTable>, TSelection>): SelectFrom<TTable, TSelection>;
    select<TAlias extends string>(alias: MySqlAliasTable<TTable, TAlias>): SelectFrom<MySqlAliasTable<TTable, TAlias>, undefined>;
    select<TAlias extends string>(alias: MySqlAliasTable<TTable, TAlias>, fields: readonly []): SelectFrom<MySqlAliasTable<TTable, TAlias>, {}>;
    select<TAlias extends string, N extends MySqlColumnSelectionName<MySqlAliasTable<TTable, TAlias>>>(alias: MySqlAliasTable<TTable, TAlias>, fields: readonly N[] & readonly MySqlColumnSelectionName<MySqlAliasTable<TTable, TAlias>>[]): SelectFrom<MySqlAliasTable<TTable, TAlias>, MySqlSelectedNamedColumns<MySqlAliasTable<TTable, TAlias>, readonly N[]>>;
    select<TAlias extends string, const T extends readonly FieldInput[]>(alias: MySqlAliasTable<TTable, TAlias>, fields: (query: FieldsQuery<MySqlAliasTable<TTable, TAlias>>) => T): SelectFrom<MySqlAliasTable<TTable, TAlias>, MergeFields<T>>;
    select<TAlias extends string, const T extends readonly FieldInput[] | readonly MySqlColumnSelectionName<MySqlAliasTable<TTable, TAlias>>[]>(alias: MySqlAliasTable<TTable, TAlias>, fields: T & readonly (FieldInput | MySqlColumnSelectionName<MySqlAliasTable<TTable, TAlias>>)[]): SelectFrom<MySqlAliasTable<TTable, TAlias>, MergeFields<NamedFields<MySqlAliasTable<TTable, TAlias>, T>>>;
    select<TAlias extends string, TSelection extends SelectedFields<MySqlColumn, MySqlAliasTable<TTable, TAlias>>>(alias: MySqlAliasTable<TTable, TAlias>, fields: Fields<FieldsQuery<MySqlAliasTable<TTable, TAlias>>, TSelection>): SelectFrom<MySqlAliasTable<TTable, TAlias>, TSelection>;
    /********************************************************************************************************************
     * find
     * ******************************************************************************************************************/
    find(where: BaseWhere<this>): Promise<FindResult<TTable, undefined>>;
    find(fields: readonly [], where?: BaseWhere<this>): Promise<FindResult<TTable, {}>>;
    find<N extends MySqlColumnSelectionName<TTable>>(fields: readonly N[] & readonly MySqlColumnSelectionName<TTable>[], where?: BaseWhere<this>): Promise<FindResult<TTable, MySqlSelectedNamedColumns<TTable, readonly N[]>>>;
    find<const T extends readonly FieldInput[]>(fields: (query: FieldsQuery<TTable>) => T, where: BaseWhere<this>): Promise<FindResult<TTable, MergeFields<T>>>;
    find<const T extends readonly FieldInput[] | readonly MySqlColumnSelectionName<TTable>[]>(fields: T & readonly (FieldInput | MySqlColumnSelectionName<TTable>)[], where: BaseWhere<this>): Promise<FindResult<TTable, MergeFields<NamedFields<TTable, T>>>>;
    find<TSelection extends SelectedFields<MySqlColumn, TTable>>(fields: Fields<FieldsQuery<TTable>, TSelection>, where: BaseWhere<this>): Promise<FindResult<TTable, TSelection>>;
    find<TAlias extends string>(alias: MySqlAliasTable<TTable, TAlias>, where: BaseWhere<this>): Promise<FindResult<MySqlAliasTable<TTable, TAlias>, undefined>>;
    find<TAlias extends string>(alias: MySqlAliasTable<TTable, TAlias>, fields: readonly [], where?: BaseWhere<this>): Promise<FindResult<MySqlAliasTable<TTable, TAlias>, {}>>;
    find<TAlias extends string, N extends MySqlColumnSelectionName<MySqlAliasTable<TTable, TAlias>>>(alias: MySqlAliasTable<TTable, TAlias>, fields: readonly N[] & readonly MySqlColumnSelectionName<MySqlAliasTable<TTable, TAlias>>[], where?: BaseWhere<this>): Promise<FindResult<MySqlAliasTable<TTable, TAlias>, MySqlSelectedNamedColumns<MySqlAliasTable<TTable, TAlias>, readonly N[]>>>;
    find<TAlias extends string, const T extends readonly FieldInput[]>(alias: MySqlAliasTable<TTable, TAlias>, fields: (query: FieldsQuery<MySqlAliasTable<TTable, TAlias>>) => T, where: BaseWhere<this>): Promise<FindResult<MySqlAliasTable<TTable, TAlias>, MergeFields<T>>>;
    find<TAlias extends string, const T extends readonly FieldInput[] | readonly MySqlColumnSelectionName<MySqlAliasTable<TTable, TAlias>>[]>(alias: MySqlAliasTable<TTable, TAlias>, fields: T & readonly (FieldInput | MySqlColumnSelectionName<MySqlAliasTable<TTable, TAlias>>)[], where: BaseWhere<this>): Promise<FindResult<MySqlAliasTable<TTable, TAlias>, MergeFields<NamedFields<MySqlAliasTable<TTable, TAlias>, T>>>>;
    find<TAlias extends string, TSelection extends SelectedFields<MySqlColumn, MySqlAliasTable<TTable, TAlias>>>(alias: MySqlAliasTable<TTable, TAlias>, fields: Fields<FieldsQuery<MySqlAliasTable<TTable, TAlias>>, TSelection>, where: BaseWhere<this>): Promise<FindResult<MySqlAliasTable<TTable, TAlias>, TSelection>>;
    /********************************************************************************************************************
     * findByPrimaryKey
     * ******************************************************************************************************************/
    findByPrimaryKey<N extends MySqlColumnSelectionName<TTable>>(fields: readonly N[] & readonly MySqlColumnSelectionName<TTable>[], key: PrimaryKeyInput<TTable>): Promise<FindResult<TTable, MySqlSelectedNamedColumns<TTable, readonly N[]>>>;
    findByPrimaryKey(key: PrimaryKeyInput<TTable>): Promise<FindResult<TTable, undefined>>;
    findByPrimaryKey(fields: readonly [], key: PrimaryKeyInput<TTable>): Promise<FindResult<TTable, {}>>;
    findByPrimaryKey<const T extends readonly FieldInput[]>(fields: (query: FieldsQuery<TTable>) => T, key: PrimaryKeyInput<TTable>): Promise<FindResult<TTable, MergeFields<T>>>;
    findByPrimaryKey<const T extends readonly FieldInput[] | readonly MySqlColumnSelectionName<TTable>[]>(fields: T & readonly (FieldInput | MySqlColumnSelectionName<TTable>)[], key: PrimaryKeyInput<TTable>): Promise<FindResult<TTable, MergeFields<NamedFields<TTable, T>>>>;
    findByPrimaryKey<TSelection extends SelectedFields<MySqlColumn, TTable>>(fields: Fields<FieldsQuery<TTable>, TSelection>, key: PrimaryKeyInput<TTable>): Promise<FindResult<TTable, TSelection>>;
    /********************************************************************************************************************
     * primaryKeyCondition
     * ******************************************************************************************************************/
    private primaryKeyCondition;
    /********************************************************************************************************************
     * exists
     * ******************************************************************************************************************/
    exists(where?: BaseWhere<this>): Promise<boolean>;
    /********************************************************************************************************************
     * existsByPrimarykey
     * ******************************************************************************************************************/
    existsByPrimaryKey(key: PrimaryKeyInput<TTable>): Promise<boolean>;
    /********************************************************************************************************************
     * notExists
     * ******************************************************************************************************************/
    notExists(where?: BaseWhere<this>): Promise<boolean>;
    /********************************************************************************************************************
     * notExistsByPrimaryKey
     * ******************************************************************************************************************/
    notExistsByPrimaryKey(key: PrimaryKeyInput<TTable>): Promise<boolean>;
    /********************************************************************************************************************
     * count
     * ******************************************************************************************************************/
    count(where?: BaseWhere<this>): Promise<number>;
    private prepareValues;
    /********************************************************************************************************************
     * (PRIVATE) executeInsert
     * ******************************************************************************************************************/
    private executeInsert;
    /********************************************************************************************************************
     * insertValues
     * ******************************************************************************************************************/
    insertValues(values: IV[]): IV[];
    insertValues(values: IV): IV;
    /********************************************************************************************************************
     * updateValues
     * ******************************************************************************************************************/
    updateValues(values: UV): UV;
    /********************************************************************************************************************
     * add
     * ******************************************************************************************************************/
    add(value: IV[]): Promise<AR[]>;
    add(value: IV): Promise<AR>;
    /********************************************************************************************************************
     * edit
     * ******************************************************************************************************************/
    edit(set: UV, where: BaseWhere<this>): Omit<import("drizzle-orm/mysql-core").MySqlAsyncUpdateBase<import("drizzle-orm").Assume<import("drizzle-orm").Assume<TTable, MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>, MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>, import("drizzle-orm/mysql2").MySql2QueryResultHKT, false, "where">, "where">;
    /********************************************************************************************************************
     * editByPrimaryKey
     * ******************************************************************************************************************/
    editByPrimaryKey(set: UV, key: PrimaryKeyInput<TTable>): Omit<import("drizzle-orm/mysql-core").MySqlAsyncUpdateBase<import("drizzle-orm").Assume<import("drizzle-orm").Assume<TTable, MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>, MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>, import("drizzle-orm/mysql2").MySql2QueryResultHKT, false, "where">, "where">;
    /********************************************************************************************************************
     * remove
     * ******************************************************************************************************************/
    remove(where: BaseWhere<this>): Omit<import("drizzle-orm/mysql-core").MySqlAsyncDeleteBase<import("drizzle-orm").Assume<TTable, MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>, import("drizzle-orm/mysql2").MySql2QueryResultHKT, false, "where">, "where">;
    /********************************************************************************************************************
     * removeByPrimaryKey
     * ******************************************************************************************************************/
    removeByPrimaryKey(key: PrimaryKeyInput<TTable>): Omit<import("drizzle-orm/mysql-core").MySqlAsyncDeleteBase<import("drizzle-orm").Assume<TTable, MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>, import("drizzle-orm/mysql2").MySql2QueryResultHKT, false, "where">, "where">;
    /********************************************************************************************************************
     * eq
     * ******************************************************************************************************************/
    eq(values: MySqlCompareValues<TTable>): SQL | undefined;
    /********************************************************************************************************************
     * ne
     * ******************************************************************************************************************/
    ne(values: MySqlCompareValues<TTable>): SQL | undefined;
    /********************************************************************************************************************
     * gt
     * ******************************************************************************************************************/
    gt(values: MySqlCompareValues<TTable>): SQL | undefined;
    /********************************************************************************************************************
     * gte
     * ******************************************************************************************************************/
    gte(values: MySqlCompareValues<TTable>): SQL | undefined;
    /********************************************************************************************************************
     * lt
     * ******************************************************************************************************************/
    lt(values: MySqlCompareValues<TTable>): SQL | undefined;
    /********************************************************************************************************************
     * lte
     * ******************************************************************************************************************/
    lte(values: MySqlCompareValues<TTable>): SQL | undefined;
    /********************************************************************************************************************
     * lte
     * ******************************************************************************************************************/
    inArray(values: MySqlArrayCompareValues<TTable>): SQL | undefined;
    /********************************************************************************************************************
     * notInArray
     * ******************************************************************************************************************/
    notInArray(values: MySqlArrayCompareValues<TTable>): SQL | undefined;
    /********************************************************************************************************************
     * between
     * ******************************************************************************************************************/
    between(values: MySqlRangeCompareValues<TTable>): SQL | undefined;
    /********************************************************************************************************************
     * notBetween
     * ******************************************************************************************************************/
    notBetween(values: MySqlRangeCompareValues<TTable>): SQL | undefined;
    /********************************************************************************************************************
     * like
     * ******************************************************************************************************************/
    like(values: MySqlPatternCompareValues<TTable>): SQL | undefined;
    /********************************************************************************************************************
     * notLike
     * ******************************************************************************************************************/
    notLike(values: MySqlPatternCompareValues<TTable>): SQL | undefined;
    /********************************************************************************************************************
     * ilike
     * ******************************************************************************************************************/
    ilike(values: MySqlPatternCompareValues<TTable>): SQL | undefined;
    /********************************************************************************************************************
     * notIlike
     * ******************************************************************************************************************/
    notIlike(values: MySqlPatternCompareValues<TTable>): SQL | undefined;
    /********************************************************************************************************************
     * isNull
     * ******************************************************************************************************************/
    isNull(name: MySqlColumnName<TTable>): SQL;
    isNull(names: MySqlNullConditionInput<TTable>): SQL | undefined;
    /********************************************************************************************************************
     * isNotNull
     * ******************************************************************************************************************/
    isNotNull(name: MySqlColumnName<TTable>): SQL;
    isNotNull(names: MySqlNullConditionInput<TTable>): SQL | undefined;
    /********************************************************************************************************************
     * and
     * ******************************************************************************************************************/
    and(options: MySqlConditions<TTable>): SQL | undefined;
    /********************************************************************************************************************
     * or
     * ******************************************************************************************************************/
    or(options: MySqlConditions<TTable>): SQL | undefined;
}
/********************************************************************************************************************
 * types
 * ******************************************************************************************************************/
type SelectFrom<TTable extends MySqlTable, TSelection extends FieldSet | undefined> = MySqlAsyncSelectBase<GetSelectTableName<TTable>, TSelection extends undefined ? MySqlSelectedTableColumns<TTable> : TSelection, 'partial'>;
type FindResult<TTable extends MySqlTable, TSelection extends FieldSet | undefined> = Awaited<SelectFrom<TTable, TSelection>>[number] | undefined;
type WhereQuery<TQuery> = Pick<TQuery, Extract<keyof TQuery, 't' | 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'inArray' | 'notInArray' | 'between' | 'notBetween' | 'like' | 'notLike' | 'ilike' | 'notIlike' | 'isNull' | 'isNotNull' | 'and' | 'or'>>;
type BaseWhere<TQuery> = SQL | undefined | ((query: WhereQuery<TQuery>) => SQL | undefined);
type FieldSet = SelectedFields<MySqlColumn, MySqlTable>;
type FieldInput = FieldSet | false | undefined;
type FieldsQuery<TTable extends MySqlTable> = {
    readonly t: TTable;
    columns(): MySqlSelectedTableColumns<TTable>;
    columns<N extends MySqlColumnSelectionName<TTable>>(...names: N[] & MySqlColumnSelectionName<TTable>[]): MySqlSelectedNamedColumnUnion<TTable, N>;
};
type Fields<TQuery, TSelection> = TSelection | ((query: TQuery) => TSelection);
type NamedFields<TTable extends MySqlTable, T extends readonly (FieldInput | MySqlColumnSelectionName<TTable>)[]> = {
    [I in keyof T]: T[I] extends MySqlColumnSelectionName<TTable> ? MySqlSelectedNamedColumns<TTable, readonly [T[I]]> : Extract<T[I], FieldInput>;
};
type MergeField<First, Result> = First extends FieldSet ? Result extends unknown ? Omit<Result, keyof First> & First : never : Result;
type MergeFields<T extends readonly FieldInput[], Result = {}> = T extends readonly [
    infer First extends FieldInput,
    ...infer Rest extends readonly FieldInput[]
] ? MergeFields<Rest, MergeField<First, Result>> : number extends T['length'] ? Exclude<T[number], false | undefined> : Result extends unknown ? {
    [P in keyof Result]: Result[P];
} : never;
type PrimaryKeyNames<T extends MySqlTable> = {
    [P in keyof T['_']['columns']]: T['_']['columns'][P]['_'] extends {
        isPrimaryKey: true;
    } ? P : never;
}[keyof T['_']['columns']];
type PrimaryKeyObject<T extends MySqlTable> = {
    [P in PrimaryKeyNames<T>]: T['_']['columns'][P]['_']['data'];
};
type IsUnion<T, U = T> = T extends U ? ([U] extends [T] ? false : true) : never;
type PrimaryKeyInput<T extends MySqlTable> = [PrimaryKeyNames<T>] extends [never] ? never : IsUnion<PrimaryKeyNames<T>> extends true ? PrimaryKeyObject<T> : PrimaryKeyObject<T> | PrimaryKeyObject<T>[PrimaryKeyNames<T>];
type AutoIncrementKeys<TTable extends MySqlTable> = {
    [P in keyof TTable['_']['columns']]: TTable['_']['columns'][P]['_'] extends {
        isAutoincrement: true;
    } ? P : never;
}[keyof TTable['_']['columns']];
type HasAutoIncrement<TTable extends MySqlTable> = [AutoIncrementKeys<TTable>] extends [never] ? false : true;
type AddResult<TTable extends MySqlTable> = HasAutoIncrement<TTable> extends true ? number : undefined;
export {};
