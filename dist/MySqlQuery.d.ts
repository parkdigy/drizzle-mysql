import { SQL, Subquery, max as drizzleMax, min as drizzleMin, type SQLWrapper } from 'drizzle-orm';
import { MySqlTable, MySqlColumn, type MySqlAsyncSelectBase, type MySqlJoin } from 'drizzle-orm/mysql-core';
import type { MySqlViewBase } from 'drizzle-orm/mysql-core/view-base';
import type { SelectedFields } from 'drizzle-orm/operations';
import type { GetSelectTableName } from 'drizzle-orm/query-builders/select.types';
import type { MySqlColumnSelectionName, MySqlSelectedNamedColumnUnion, MySqlSelectedNamedColumns, MySqlSelectedTableColumns, MySqlAliasTable } from './columns.js';
import { type TableMutationPolicy } from './mysqlTable.js';
import type { MySqlAddValues, MySqlEditValues, MySqlCompareValues, MySqlColumnName, MySqlArrayCompareValues, MySqlRangeCompareValues, MySqlPatternCompareValues, MySqlNullConditionInput, MySqlConditions } from './@types/index.js';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import type { TypedQueryBuilder } from 'drizzle-orm/query-builders/query-builder';
/********************************************************************************************************************
 * MySqlQuery
 * ******************************************************************************************************************/
export declare class MySqlQuery<TTable extends MySqlTable, AV extends MySqlAddValues<TTable> = MySqlAddValues<TTable>, EV extends MySqlEditValues<TTable> = MySqlEditValues<TTable>, AR = AddResult<TTable>> {
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
    columns<N extends MySqlColumnSelectionName<TTable>>(...names: N[]): MySqlSelectedNamedColumnUnion<TTable, N>;
    /********************************************************************************************************************
     * min / max
     * ******************************************************************************************************************/
    min<N extends keyof TTable['_']['columns'] & string>(name: N): ReturnType<typeof drizzleMin<TTable['_']['columns'][N]>>;
    min<C extends MySqlColumn>(column: C): ReturnType<typeof drizzleMin<C>>;
    max<N extends keyof TTable['_']['columns'] & string>(name: N): ReturnType<typeof drizzleMax<TTable['_']['columns'][N]>>;
    max<C extends MySqlColumn>(column: C): ReturnType<typeof drizzleMax<C>>;
    private resolveAggregateColumn;
    private resolveOrderColumn;
    private resolveConditionColumn;
    /********************************************************************************************************************
     * asc
     * ******************************************************************************************************************/
    asc(name: MySqlColumnName<TTable>): SQL;
    asc<TAlias extends string>(table: MySqlAliasTable<TTable, TAlias>, name: MySqlColumnName<MySqlAliasTable<TTable, TAlias>>): SQL;
    /********************************************************************************************************************
     * desc
     * ******************************************************************************************************************/
    desc(name: MySqlColumnName<TTable>): SQL;
    desc<TAlias extends string>(table: MySqlAliasTable<TTable, TAlias>, name: MySqlColumnName<MySqlAliasTable<TTable, TAlias>>): SQL;
    private resolveFields;
    /********************************************************************************************************************
     * select
     * ******************************************************************************************************************/
    select(): SelectFrom<TTable, undefined>;
    select(fields: readonly []): SelectFrom<TTable, {}>;
    select<N extends MySqlColumnSelectionName<TTable>>(fields: readonly N[]): SelectFrom<TTable, MySqlSelectedNamedColumns<TTable, readonly N[]>>;
    select<const T extends readonly FieldInput[]>(fields: (query: FieldsQuery<TTable>) => T): SelectFrom<TTable, MergeFields<T>>;
    select<const T extends readonly (FieldInput | MySqlColumnSelectionName<TTable>)[]>(fields: T): SelectFrom<TTable, MergeFields<NamedFields<TTable, T>>>;
    select<const TSelection extends StringColumnSelection<TTable>>(fields: TSelection): SelectFrom<TTable, StringColumnSelectionFields<TTable, TSelection>>;
    select<const TSelection extends MixedSelection<TTable>>(fields: TSelection): SelectFrom<TTable, ResolveMixedSelection<TTable, TSelection>>;
    select<TSelection extends SelectedFields<MySqlColumn, TTable>>(fields?: Fields<FieldsQuery<TTable>, TSelection>): SelectFrom<TTable, TSelection>;
    select<TAlias extends string>(alias: MySqlAliasTable<TTable, TAlias>): SelectFrom<MySqlAliasTable<TTable, TAlias>, undefined>;
    select<TAlias extends string>(alias: MySqlAliasTable<TTable, TAlias>, fields: readonly []): SelectFrom<MySqlAliasTable<TTable, TAlias>, {}>;
    select<TAlias extends string, N extends MySqlColumnSelectionName<MySqlAliasTable<TTable, TAlias>>>(alias: MySqlAliasTable<TTable, TAlias>, fields: readonly N[]): SelectFrom<MySqlAliasTable<TTable, TAlias>, MySqlSelectedNamedColumns<MySqlAliasTable<TTable, TAlias>, readonly N[]>>;
    select<TAlias extends string, const T extends readonly FieldInput[]>(alias: MySqlAliasTable<TTable, TAlias>, fields: (query: FieldsQuery<MySqlAliasTable<TTable, TAlias>>) => T): SelectFrom<MySqlAliasTable<TTable, TAlias>, MergeFields<T>>;
    select<TAlias extends string, const T extends readonly (FieldInput | MySqlColumnSelectionName<MySqlAliasTable<TTable, TAlias>>)[]>(alias: MySqlAliasTable<TTable, TAlias>, fields: T): SelectFrom<MySqlAliasTable<TTable, TAlias>, MergeFields<NamedFields<MySqlAliasTable<TTable, TAlias>, T>>>;
    select<TAlias extends string, const TSelection extends MixedSelection<MySqlAliasTable<TTable, TAlias>>>(alias: MySqlAliasTable<TTable, TAlias>, fields: TSelection): SelectFrom<MySqlAliasTable<TTable, TAlias>, ResolveMixedSelection<MySqlAliasTable<TTable, TAlias>, TSelection>>;
    select<TAlias extends string, TSelection extends SelectedFields<MySqlColumn, MySqlAliasTable<TTable, TAlias>>>(alias: MySqlAliasTable<TTable, TAlias>, fields: Fields<FieldsQuery<MySqlAliasTable<TTable, TAlias>>, TSelection>): SelectFrom<MySqlAliasTable<TTable, TAlias>, TSelection>;
    select<TSource extends Subquery, const TArgs extends readonly [fields?: SubquerySelectInput<TSource>]>(source: TSource, ...args: TArgs): SelectFrom<TSource, ResolveSubquerySelectInput<TSource, TArgs[0]>>;
    /********************************************************************************************************************
     * selectDistinct
     * ******************************************************************************************************************/
    selectDistinct(): SelectFrom<TTable, undefined>;
    selectDistinct(fields: readonly []): SelectFrom<TTable, {}>;
    selectDistinct<N extends MySqlColumnSelectionName<TTable>>(fields: readonly N[]): SelectFrom<TTable, MySqlSelectedNamedColumns<TTable, readonly N[]>>;
    selectDistinct<const T extends readonly FieldInput[]>(fields: (query: FieldsQuery<TTable>) => T): SelectFrom<TTable, MergeFields<T>>;
    selectDistinct<const T extends readonly (FieldInput | MySqlColumnSelectionName<TTable>)[]>(fields: T): SelectFrom<TTable, MergeFields<NamedFields<TTable, T>>>;
    selectDistinct<const TSelection extends StringColumnSelection<TTable>>(fields: TSelection): SelectFrom<TTable, StringColumnSelectionFields<TTable, TSelection>>;
    selectDistinct<const TSelection extends MixedSelection<TTable>>(fields: TSelection): SelectFrom<TTable, ResolveMixedSelection<TTable, TSelection>>;
    selectDistinct<TSelection extends SelectedFields<MySqlColumn, TTable>>(fields?: Fields<FieldsQuery<TTable>, TSelection>): SelectFrom<TTable, TSelection>;
    selectDistinct<TAlias extends string>(alias: MySqlAliasTable<TTable, TAlias>): SelectFrom<MySqlAliasTable<TTable, TAlias>, undefined>;
    selectDistinct<TAlias extends string>(alias: MySqlAliasTable<TTable, TAlias>, fields: readonly []): SelectFrom<MySqlAliasTable<TTable, TAlias>, {}>;
    selectDistinct<TAlias extends string, N extends MySqlColumnSelectionName<MySqlAliasTable<TTable, TAlias>>>(alias: MySqlAliasTable<TTable, TAlias>, fields: readonly N[]): SelectFrom<MySqlAliasTable<TTable, TAlias>, MySqlSelectedNamedColumns<MySqlAliasTable<TTable, TAlias>, readonly N[]>>;
    selectDistinct<TAlias extends string, const T extends readonly FieldInput[]>(alias: MySqlAliasTable<TTable, TAlias>, fields: (query: FieldsQuery<MySqlAliasTable<TTable, TAlias>>) => T): SelectFrom<MySqlAliasTable<TTable, TAlias>, MergeFields<T>>;
    selectDistinct<TAlias extends string, const T extends readonly (FieldInput | MySqlColumnSelectionName<MySqlAliasTable<TTable, TAlias>>)[]>(alias: MySqlAliasTable<TTable, TAlias>, fields: T): SelectFrom<MySqlAliasTable<TTable, TAlias>, MergeFields<NamedFields<MySqlAliasTable<TTable, TAlias>, T>>>;
    selectDistinct<TAlias extends string, const TSelection extends MixedSelection<MySqlAliasTable<TTable, TAlias>>>(alias: MySqlAliasTable<TTable, TAlias>, fields: TSelection): SelectFrom<MySqlAliasTable<TTable, TAlias>, ResolveMixedSelection<MySqlAliasTable<TTable, TAlias>, TSelection>>;
    selectDistinct<TAlias extends string, TSelection extends SelectedFields<MySqlColumn, MySqlAliasTable<TTable, TAlias>>>(alias: MySqlAliasTable<TTable, TAlias>, fields: Fields<FieldsQuery<MySqlAliasTable<TTable, TAlias>>, TSelection>): SelectFrom<MySqlAliasTable<TTable, TAlias>, TSelection>;
    selectDistinct<TSource extends Subquery, const TArgs extends readonly [fields?: SubquerySelectInput<TSource>]>(source: TSource, ...args: TArgs): SelectFrom<TSource, ResolveSubquerySelectInput<TSource, TArgs[0]>>;
    /********************************************************************************************************************
     * (PRIVATE) buildSelectQuery
     * ******************************************************************************************************************/
    private buildSelectQuery;
    /********************************************************************************************************************
     * find
     * ******************************************************************************************************************/
    find(where: BaseWhere<this>): Promise<FindResult<TTable, undefined>>;
    find(fields: readonly [], where?: BaseWhere<this>): Promise<FindResult<TTable, {}>>;
    find<N extends MySqlColumnSelectionName<TTable>>(fields: readonly N[], where?: BaseWhere<this>): Promise<FindResult<TTable, MySqlSelectedNamedColumns<TTable, readonly N[]>>>;
    find<const T extends readonly FieldInput[]>(fields: (query: FieldsQuery<TTable>) => T, where: BaseWhere<this>): Promise<FindResult<TTable, MergeFields<T>>>;
    find<const T extends readonly (FieldInput | MySqlColumnSelectionName<TTable>)[]>(fields: T, where: BaseWhere<this>): Promise<FindResult<TTable, MergeFields<NamedFields<TTable, T>>>>;
    find<const TSelection extends StringColumnSelection<TTable>>(fields: TSelection, where?: BaseWhere<this>): Promise<FindResult<TTable, StringColumnSelectionFields<TTable, TSelection>>>;
    find<TSelection extends SelectedFields<MySqlColumn, TTable>>(fields: Fields<FieldsQuery<TTable>, TSelection>, where?: BaseWhere<this>): Promise<FindResult<TTable, TSelection>>;
    find<TAlias extends string>(alias: MySqlAliasTable<TTable, TAlias>, where: BaseWhere<this>): Promise<FindResult<MySqlAliasTable<TTable, TAlias>, undefined>>;
    find<TAlias extends string>(alias: MySqlAliasTable<TTable, TAlias>, fields: readonly [], where?: BaseWhere<this>): Promise<FindResult<MySqlAliasTable<TTable, TAlias>, {}>>;
    find<TAlias extends string, N extends MySqlColumnSelectionName<MySqlAliasTable<TTable, TAlias>>>(alias: MySqlAliasTable<TTable, TAlias>, fields: readonly N[], where?: BaseWhere<this>): Promise<FindResult<MySqlAliasTable<TTable, TAlias>, MySqlSelectedNamedColumns<MySqlAliasTable<TTable, TAlias>, readonly N[]>>>;
    find<TAlias extends string, const T extends readonly FieldInput[]>(alias: MySqlAliasTable<TTable, TAlias>, fields: (query: FieldsQuery<MySqlAliasTable<TTable, TAlias>>) => T, where: BaseWhere<this>): Promise<FindResult<MySqlAliasTable<TTable, TAlias>, MergeFields<T>>>;
    find<TAlias extends string, const T extends readonly (FieldInput | MySqlColumnSelectionName<MySqlAliasTable<TTable, TAlias>>)[]>(alias: MySqlAliasTable<TTable, TAlias>, fields: T, where: BaseWhere<this>): Promise<FindResult<MySqlAliasTable<TTable, TAlias>, MergeFields<NamedFields<MySqlAliasTable<TTable, TAlias>, T>>>>;
    find<TAlias extends string, TSelection extends SelectedFields<MySqlColumn, MySqlAliasTable<TTable, TAlias>>>(alias: MySqlAliasTable<TTable, TAlias>, fields: Fields<FieldsQuery<MySqlAliasTable<TTable, TAlias>>, TSelection>, where: BaseWhere<this>): Promise<FindResult<MySqlAliasTable<TTable, TAlias>, TSelection>>;
    /********************************************************************************************************************
     * findByPrimaryKey
     * ******************************************************************************************************************/
    findByPrimaryKey<N extends MySqlColumnSelectionName<TTable>>(fields: readonly N[], key: PrimaryKeyInput<TTable>): Promise<FindResult<TTable, MySqlSelectedNamedColumns<TTable, readonly N[]>>>;
    findByPrimaryKey(key: PrimaryKeyInput<TTable>): Promise<FindResult<TTable, undefined>>;
    findByPrimaryKey(fields: readonly [], key: PrimaryKeyInput<TTable>): Promise<FindResult<TTable, {}>>;
    findByPrimaryKey<const T extends readonly FieldInput[]>(fields: (query: FieldsQuery<TTable>) => T, key: PrimaryKeyInput<TTable>): Promise<FindResult<TTable, MergeFields<T>>>;
    findByPrimaryKey<const T extends readonly (FieldInput | MySqlColumnSelectionName<TTable>)[]>(fields: T, key: PrimaryKeyInput<TTable>): Promise<FindResult<TTable, MergeFields<NamedFields<TTable, T>>>>;
    findByPrimaryKey<const TSelection extends StringColumnSelection<TTable>>(fields: TSelection, key: PrimaryKeyInput<TTable>): Promise<FindResult<TTable, StringColumnSelectionFields<TTable, TSelection>>>;
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
    private executeInsertSelect;
    /********************************************************************************************************************
     * addValues
     * ******************************************************************************************************************/
    addValues(values: AV[]): AV[];
    addValues(values: AV): AV;
    /********************************************************************************************************************
     * editValues
     * ******************************************************************************************************************/
    editValues(values: EV): EV;
    /********************************************************************************************************************
     * add
     * ******************************************************************************************************************/
    add(value: AV[]): Promise<AR[]>;
    add<TSelection extends Record<string, unknown>>(value: TypedQueryBuilder<TSelection>): Promise<AR[]>;
    add(value: AV): Promise<AR>;
    /********************************************************************************************************************
     * edit
     * ******************************************************************************************************************/
    edit(this: this & (TableMutationPolicy<TTable> extends {
        updateBlocked: true;
    } ? never : unknown), set: EV, where: BaseWhere<this>): Omit<import("drizzle-orm/mysql-core").MySqlAsyncUpdateBase<import("drizzle-orm").Assume<import("drizzle-orm").Assume<TTable, MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>, MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>, import("drizzle-orm/mysql2").MySql2QueryResultHKT, false, "where">, "where">;
    /********************************************************************************************************************
     * editByPrimaryKey
     * ******************************************************************************************************************/
    editByPrimaryKey(this: this & (TableMutationPolicy<TTable> extends {
        updateBlocked: true;
    } ? never : unknown), set: EV, key: PrimaryKeyInput<TTable>): Omit<import("drizzle-orm/mysql-core").MySqlAsyncUpdateBase<import("drizzle-orm").Assume<import("drizzle-orm").Assume<TTable, MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>, MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>, import("drizzle-orm/mysql2").MySql2QueryResultHKT, false, "where">, "where">;
    /********************************************************************************************************************
     * remove
     * ******************************************************************************************************************/
    remove(this: this & (TableMutationPolicy<TTable> extends {
        deleteBlocked: true;
    } ? never : unknown), where: BaseWhere<this>): Omit<import("drizzle-orm/mysql-core").MySqlAsyncDeleteBase<import("drizzle-orm").Assume<TTable, MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>, import("drizzle-orm/mysql2").MySql2QueryResultHKT, false, "where">, "where">;
    /********************************************************************************************************************
     * removeByPrimaryKey
     * ******************************************************************************************************************/
    removeByPrimaryKey(this: this & (TableMutationPolicy<TTable> extends {
        deleteBlocked: true;
    } ? never : unknown), key: PrimaryKeyInput<TTable>): Omit<import("drizzle-orm/mysql-core").MySqlAsyncDeleteBase<import("drizzle-orm").Assume<TTable, MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>, import("drizzle-orm/mysql2").MySql2QueryResultHKT, false, "where">, "where">;
    private assertMutationAllowed;
    /********************************************************************************************************************
     * eq
     * ******************************************************************************************************************/
    eq<N extends MySqlColumnName<TTable>>(name: N, value: Required<MySqlCompareValues<TTable>>[N]): SQL;
    eq<TAlias extends string, N extends MySqlColumnName<MySqlAliasTable<TTable, TAlias>>>(table: MySqlAliasTable<TTable, TAlias>, name: N, value: Required<MySqlCompareValues<MySqlAliasTable<TTable, TAlias>>>[N]): SQL;
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
type SelectQueryBase<TTable extends MySqlTable | Subquery, TSelection extends FieldSet | undefined> = MySqlAsyncSelectBase<GetSelectTableName<TTable>, TSelection extends undefined ? SourceSelection<TTable> : AliasedSelection<NonNullable<TSelection>>, 'partial'>;
type TableWhere<TTable extends MySqlTable | Subquery> = SQL | undefined | ((query: SelectConditionQuery<TTable>) => SQL | undefined);
type OrderByValue = MySqlColumn | SQL | SQL.Aliased;
type SelectOrderByQuery<TTable extends MySqlTable | Subquery> = {
    readonly t: TTable;
    asc(name: SourceColumnName<TTable>): SQL;
    desc(name: SourceColumnName<TTable>): SQL;
};
type OrderByCallback<TTable extends MySqlTable | Subquery> = (query: SelectOrderByQuery<TTable>) => OrderByValue | OrderByValue[];
type Joinable = MySqlTable | Subquery | MySqlViewBase | SQL;
type JoinConditionValues<TJoinedTable extends Joinable> = TJoinedTable extends MySqlTable ? MySqlCompareValues<TJoinedTable> : TJoinedTable extends Subquery<string, infer TFields> ? {
    [K in keyof TFields]?: unknown;
} : never;
type JoinConditionQuery<TTable extends MySqlTable | Subquery, TJoinedTable extends Joinable> = TJoinedTable extends MySqlTable ? Omit<SelectConditionQuery<TJoinedTable>, 't'> & {
    readonly t: TTable;
} : {
    readonly t: TTable;
    eq(values: JoinConditionValues<TJoinedTable>): SQL | undefined;
};
type JoinCondition<TTable extends MySqlTable | Subquery, TSelection extends FieldSet | undefined, TJoinedTable extends Joinable> = TJoinedTable extends MySqlTable | Subquery ? SQL | undefined | ((query: JoinConditionQuery<TTable, TJoinedTable>) => SQL | undefined) : SQL | undefined | ((aliases: SelectQueryBase<TTable, TSelection>['_']['selection']) => SQL | undefined);
type JoinedSelect<TTable extends MySqlTable | Subquery, TSelection extends FieldSet | undefined, TJoinedTable extends Joinable, TKind extends 'inner' | 'left' | 'right'> = Omit<MySqlJoin<SelectQueryBase<TTable, TSelection>, false, TKind, TJoinedTable>, 'where' | 'orderBy' | keyof SelectJoinMethods<TTable, TSelection>> & SelectJoinMethods<TTable, TSelection> & {
    where(condition: TableWhere<TTable>): Omit<JoinedSelect<TTable, TSelection, TJoinedTable, TKind>, 'where'>;
    orderBy(builder: OrderByCallback<TTable>): Omit<JoinedSelect<TTable, TSelection, TJoinedTable, TKind>, 'orderBy'>;
    orderBy(...columns: OrderByValue[]): Omit<JoinedSelect<TTable, TSelection, TJoinedTable, TKind>, 'orderBy'>;
};
type SelectJoinMethods<TTable extends MySqlTable | Subquery, TSelection extends FieldSet | undefined> = {
    innerJoin<TJoinedTable extends Joinable>(table: TJoinedTable, on: JoinCondition<TTable, TSelection, TJoinedTable>): JoinedSelect<TTable, TSelection, TJoinedTable, 'inner'>;
    leftJoin<TJoinedTable extends Joinable>(table: TJoinedTable, on: JoinCondition<TTable, TSelection, TJoinedTable>): JoinedSelect<TTable, TSelection, TJoinedTable, 'left'>;
    rightJoin<TJoinedTable extends Joinable>(table: TJoinedTable, on: JoinCondition<TTable, TSelection, TJoinedTable>): JoinedSelect<TTable, TSelection, TJoinedTable, 'right'>;
};
export type SelectFrom<TTable extends MySqlTable | Subquery, TSelection extends FieldSet | undefined> = Omit<SelectQueryBase<TTable, TSelection>, 'where' | 'orderBy' | keyof SelectJoinMethods<TTable, TSelection>> & SelectJoinMethods<TTable, TSelection> & {
    where(condition: TableWhere<TTable>): Omit<SelectFrom<TTable, TSelection>, 'where'>;
    orderBy(builder: OrderByCallback<TTable>): Omit<SelectFrom<TTable, TSelection>, 'orderBy'>;
    orderBy(...columns: OrderByValue[]): Omit<SelectFrom<TTable, TSelection>, 'orderBy'>;
};
type FindResult<TTable extends MySqlTable, TSelection extends FieldSet | undefined> = Awaited<SelectFrom<TTable, TSelection>>[number] | undefined;
type WhereQuery<TQuery> = Pick<TQuery, Extract<keyof TQuery, 't' | 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'inArray' | 'notInArray' | 'between' | 'notBetween' | 'like' | 'notLike' | 'ilike' | 'notIlike' | 'isNull' | 'isNotNull' | 'and' | 'or'>>;
type SelectConditionQuery<TSource extends MySqlTable | Subquery> = TSource extends MySqlTable ? TableConditionQuery<TSource> : TSource extends Subquery ? SubqueryConditionQuery<TSource> : never;
type TableConditionQuery<TTable extends MySqlTable> = {
    readonly t: TTable;
    eq(values: MySqlCompareValues<TTable>): SQL | undefined;
    ne(values: MySqlCompareValues<TTable>): SQL | undefined;
    gt(values: MySqlCompareValues<TTable>): SQL | undefined;
    gte(values: MySqlCompareValues<TTable>): SQL | undefined;
    lt(values: MySqlCompareValues<TTable>): SQL | undefined;
    lte(values: MySqlCompareValues<TTable>): SQL | undefined;
    inArray(values: MySqlArrayCompareValues<TTable>): SQL | undefined;
    notInArray(values: MySqlArrayCompareValues<TTable>): SQL | undefined;
    between(values: MySqlRangeCompareValues<TTable>): SQL | undefined;
    notBetween(values: MySqlRangeCompareValues<TTable>): SQL | undefined;
    like(values: MySqlPatternCompareValues<TTable>): SQL | undefined;
    notLike(values: MySqlPatternCompareValues<TTable>): SQL | undefined;
    ilike(values: MySqlPatternCompareValues<TTable>): SQL | undefined;
    notIlike(values: MySqlPatternCompareValues<TTable>): SQL | undefined;
    isNull(names: MySqlNullConditionInput<TTable>): SQL | undefined;
    isNotNull(names: MySqlNullConditionInput<TTable>): SQL | undefined;
    and(options: MySqlConditions<TTable>): SQL | undefined;
    or(options: MySqlConditions<TTable>): SQL | undefined;
};
type BaseWhere<TQuery> = SQL | undefined | ((query: WhereQuery<TQuery>) => SQL | undefined);
type FieldSet = SelectedFields<MySqlColumn, MySqlTable>;
type AliasedSelection<T extends FieldSet> = {
    [K in keyof T]: T[K] extends SQL<infer D> ? SQL.Aliased<D> : T[K];
};
type MixedSelection<TTable extends MySqlTable> = Record<string, FieldSet[string] | MySqlColumnName<TTable> | SQLWrapper>;
type ResolveMixedSelection<TTable extends MySqlTable, TSelection> = {
    [K in keyof TSelection]: TSelection[K] extends MySqlColumnName<TTable> ? TTable['_']['columns'][TSelection[K]] : TSelection[K] extends MySqlColumn ? TSelection[K] : TSelection[K] extends SQLWrapper<infer TData> ? SQL.Aliased<TData> : Extract<TSelection[K], FieldSet[string]>;
};
type StringColumnSelection<TTable extends MySqlTable> = Record<string, keyof TTable['_']['columns'] & string>;
type StringColumnSelectionFields<TTable extends MySqlTable, TSelection extends StringColumnSelection<TTable>> = {
    [K in keyof TSelection]: TTable['_']['columns'][TSelection[K]] extends MySqlColumn<infer TConfig> ? SQL.Aliased<TConfig['data']> : never;
};
type FieldInput = FieldSet | false | undefined;
type FieldsQuery<TTable extends MySqlTable> = {
    readonly t: TTable;
    columns(): MySqlSelectedTableColumns<TTable>;
    columns<N extends MySqlColumnSelectionName<TTable>>(...names: N[]): MySqlSelectedNamedColumnUnion<TTable, N>;
    min: MySqlQuery<TTable>['min'];
    max: MySqlQuery<TTable>['max'];
};
type Fields<TQuery, TSelection> = TSelection | ((query: TQuery) => TSelection);
export type SelectInput<TTable extends MySqlTable> = readonly (FieldInput | MySqlColumnSelectionName<TTable>)[] | MixedSelection<TTable> | ((query: FieldsQuery<TTable>) => FieldSet | readonly FieldInput[]);
export type ResolveSelectInput<TTable extends MySqlTable, T> = T extends undefined ? undefined : T extends (...args: never[]) => infer R ? R extends readonly FieldInput[] ? MergeFields<R> : Extract<R, FieldSet> : T extends readonly (FieldInput | MySqlColumnSelectionName<TTable>)[] ? MergeFields<NamedFields<TTable, T>> : T extends StringColumnSelection<TTable> ? StringColumnSelectionFields<TTable, T> : ResolveMixedSelection<TTable, T>;
type SourceSelection<T extends MySqlTable | Subquery> = T extends MySqlTable ? MySqlSelectedTableColumns<T> : T extends Subquery ? T['_']['selectedFields'] : never;
type SourceColumnName<T extends MySqlTable | Subquery> = T extends MySqlTable ? MySqlColumnName<T> : keyof SourceSelection<T> & string;
type SubqueryFieldsQuery<T extends Subquery> = {
    readonly t: T;
    columns(): T['_']['selectedFields'];
    columns<N extends keyof T['_']['selectedFields'] & string>(...names: N[]): Pick<T['_']['selectedFields'], N>;
    min<N extends keyof T['_']['selectedFields'] & string>(name: N): SQL<SubqueryFieldData<T['_']['selectedFields'][N]> | null>;
    max<N extends keyof T['_']['selectedFields'] & string>(name: N): SQL<SubqueryFieldData<T['_']['selectedFields'][N]> | null>;
};
export type SubquerySelectInput<T extends Subquery> = readonly (FieldInput | (keyof T['_']['selectedFields'] & string))[] | Record<string, FieldSet[string] | (keyof T['_']['selectedFields'] & string) | SQLWrapper> | ((query: SubqueryFieldsQuery<T>) => FieldSet | readonly FieldInput[]);
export type ResolveSubquerySelectInput<T extends Subquery, V> = Extract<ResolvedSubqueryInput<T, V>, FieldSet | undefined>;
type ResolvedSubqueryInput<T extends Subquery, V> = V extends undefined ? undefined : V extends (...args: never[]) => infer R ? R extends readonly FieldInput[] ? MergeFields<R> : Extract<R, FieldSet> : V extends readonly unknown[] ? MergeFields<{
    [I in keyof V]: V[I] extends keyof T['_']['selectedFields'] ? Extract<Pick<T['_']['selectedFields'], V[I]>, FieldSet> : Extract<V[I], FieldInput>;
}> : {
    [K in keyof V]: V[K] extends keyof T['_']['selectedFields'] ? T['_']['selectedFields'][V[K]] : V[K] extends MySqlColumn | SQL | SQL.Aliased ? V[K] : V[K] extends SQLWrapper<infer D> ? SQL.Aliased<D> : Extract<V[K], FieldSet[string]>;
};
type SubqueryFieldData<F> = F extends MySqlColumn ? F['_']['data'] | (F['_']['notNull'] extends true ? never : null) : F extends SQL<infer D> | SQL.Aliased<infer D> ? D : unknown;
type SubqueryValues<T extends Subquery> = {
    [K in keyof T['_']['selectedFields']]?: SubqueryFieldData<T['_']['selectedFields'][K]> | SQLWrapper;
};
type SubqueryArrayValues<T extends Subquery> = {
    [K in keyof T['_']['selectedFields']]?: (NonNullable<SubqueryFieldData<T['_']['selectedFields'][K]>> | SQLWrapper)[] | SQLWrapper;
};
type SubqueryRangeValues<T extends Subquery> = {
    [K in keyof T['_']['selectedFields']]?: [
        NonNullable<SubqueryFieldData<T['_']['selectedFields'][K]>> | SQLWrapper,
        NonNullable<SubqueryFieldData<T['_']['selectedFields'][K]>> | SQLWrapper
    ];
};
type SubqueryPatternValues<T extends Subquery> = {
    [K in keyof T['_']['selectedFields'] as NonNullable<SubqueryFieldData<T['_']['selectedFields'][K]>> extends string ? K : never]?: string;
};
type SubqueryConditionQuery<T extends Subquery> = {
    readonly t: T;
} & {
    [K in 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte']: (values: SubqueryValues<T>) => SQL | undefined;
} & {
    [K in 'inArray' | 'notInArray']: (values: SubqueryArrayValues<T>) => SQL | undefined;
} & {
    [K in 'between' | 'notBetween']: (values: SubqueryRangeValues<T>) => SQL | undefined;
} & {
    [K in 'like' | 'notLike' | 'ilike' | 'notIlike']: (values: SubqueryPatternValues<T>) => SQL | undefined;
} & {
    isNull(names: SourceColumnName<T> | undefined | readonly (SourceColumnName<T> | undefined)[]): SQL | undefined;
    isNotNull(names: SourceColumnName<T> | undefined | readonly (SourceColumnName<T> | undefined)[]): SQL | undefined;
    and(values: SubqueryConditions<T>): SQL | undefined;
    or(values: SubqueryConditions<T>): SQL | undefined;
};
type SubqueryConditions<T extends Subquery> = {
    [K in keyof Omit<SubqueryConditionQuery<T>, 't'>]?: SubqueryConditionQuery<T>[K] extends (values: infer V) => unknown ? V : never;
};
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
