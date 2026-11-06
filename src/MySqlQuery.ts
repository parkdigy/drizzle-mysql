import { SQL, isTable, is, sql, count, eq, getTableColumns, and as drizzleAnd } from 'drizzle-orm';
import {
  MySqlTable,
  MySqlColumn,
  getTableConfig,
  type MySqlAsyncSelectBase,
  type MySqlUpdateSetSource,
} from 'drizzle-orm/mysql-core';
import type { SelectedFields } from 'drizzle-orm/operations';
import type { GetSelectTableName } from 'drizzle-orm/query-builders/select.types';
import type {
  MySqlColumnSelectionName,
  MySqlSelectedNamedColumnUnion,
  MySqlSelectedNamedColumns,
  MySqlSelectedTableColumns,
  MySqlAliasTable,
} from './columns';
import { TableColumns } from './columns';
import { getColumnPolicies, getTablePolicy, type TableMutationPolicy } from './mysqlTable';
import type {
  MySqlInsertValues,
  MySqlUpdateValues,
  MySqlCompareValues,
  MySqlColumnName,
  MySqlArrayCompareValues,
  MySqlRangeCompareValues,
  MySqlPatternCompareValues,
  MySqlNullConditionInput,
  MySqlConditions,
} from './@types/index';
import { createConditions } from './conditions';
import type { MySqlInsertValue } from 'drizzle-orm/mysql-core/query-builders/insert';
import type { MySql2Database } from 'drizzle-orm/mysql2';

/********************************************************************************************************************
 * MySqlQuery
 * ******************************************************************************************************************/
export class MySqlQuery<
  TTable extends MySqlTable,
  IV extends MySqlInsertValues<TTable> = MySqlInsertValues<TTable>,
  UV extends MySqlUpdateValues<TTable> = MySqlUpdateValues<TTable>,
  AR = AddResult<TTable>,
> {
  // Table
  readonly t: TTable;

  /********************************************************************************************************************
   * constructor
   * ******************************************************************************************************************/
  constructor(
    table: TTable,
    private readonly current: (() => MySql2Database) & { getTimestamp?: () => unknown },
    private readonly getTimestamp?: () => unknown
  ) {
    this.t = table;
  }

  private readonly drizzle = { ...createConditions({}), sqlNumber: (value: number) => sql`${value}`.mapWith(Number) };

  /********************************************************************************************************************
   * (PROTECTED) getTx
   * ******************************************************************************************************************/
  protected getTx() {
    return this.current();
  }

  /********************************************************************************************************************
   * columns
   * ******************************************************************************************************************/
  columns(): MySqlSelectedTableColumns<TTable>;
  columns<N extends MySqlColumnSelectionName<TTable>>(
    ...names: N[] & MySqlColumnSelectionName<TTable>[]
  ): MySqlSelectedNamedColumnUnion<TTable, N>;

  columns(...names: string[]): unknown {
    const table: MySqlTable = this.t;
    return TableColumns(table, ...(names as MySqlColumnSelectionName<MySqlTable>[]));
  }

  private resolveFields(fields: unknown, table: MySqlTable = this.t): FieldSet | undefined {
    if (Array.isArray(fields) && fields.length > 0 && fields.every((field) => typeof field === 'string')) {
      return TableColumns(table, ...(fields as MySqlColumnSelectionName<MySqlTable>[]));
    }
    if (typeof fields !== 'function') return normalizeFields(fields);
    const query = {
      t: table,
      columns: (...names: MySqlColumnSelectionName<MySqlTable>[]) => TableColumns(table, ...names),
    };
    return normalizeFields(fields(query));
  }

  /********************************************************************************************************************
   * select
   * ******************************************************************************************************************/

  select(): SelectFrom<TTable, undefined>;

  select(fields: readonly []): SelectFrom<TTable, {}>;

  select<N extends MySqlColumnSelectionName<TTable>>(
    fields: readonly N[] & readonly MySqlColumnSelectionName<TTable>[]
  ): SelectFrom<TTable, MySqlSelectedNamedColumns<TTable, readonly N[]>>;

  select<const T extends readonly FieldInput[]>(
    fields: (query: FieldsQuery<TTable>) => T
  ): SelectFrom<TTable, MergeFields<T>>;

  select<const T extends readonly FieldInput[] | readonly MySqlColumnSelectionName<TTable>[]>(
    fields: T & readonly (FieldInput | MySqlColumnSelectionName<TTable>)[]
  ): SelectFrom<TTable, MergeFields<NamedFields<TTable, T>>>;

  select<TSelection extends SelectedFields<MySqlColumn, TTable>>(
    fields?: Fields<FieldsQuery<TTable>, TSelection>
  ): SelectFrom<TTable, TSelection>;

  select<TAlias extends string>(
    alias: MySqlAliasTable<TTable, TAlias>
  ): SelectFrom<MySqlAliasTable<TTable, TAlias>, undefined>;

  select<TAlias extends string>(
    alias: MySqlAliasTable<TTable, TAlias>,
    fields: readonly []
  ): SelectFrom<MySqlAliasTable<TTable, TAlias>, {}>;

  select<TAlias extends string, N extends MySqlColumnSelectionName<MySqlAliasTable<TTable, TAlias>>>(
    alias: MySqlAliasTable<TTable, TAlias>,
    fields: readonly N[] & readonly MySqlColumnSelectionName<MySqlAliasTable<TTable, TAlias>>[]
  ): SelectFrom<
    MySqlAliasTable<TTable, TAlias>,
    MySqlSelectedNamedColumns<MySqlAliasTable<TTable, TAlias>, readonly N[]>
  >;

  select<TAlias extends string, const T extends readonly FieldInput[]>(
    alias: MySqlAliasTable<TTable, TAlias>,
    fields: (query: FieldsQuery<MySqlAliasTable<TTable, TAlias>>) => T
  ): SelectFrom<MySqlAliasTable<TTable, TAlias>, MergeFields<T>>;

  select<
    TAlias extends string,
    const T extends readonly FieldInput[] | readonly MySqlColumnSelectionName<MySqlAliasTable<TTable, TAlias>>[],
  >(
    alias: MySqlAliasTable<TTable, TAlias>,
    fields: T & readonly (FieldInput | MySqlColumnSelectionName<MySqlAliasTable<TTable, TAlias>>)[]
  ): SelectFrom<MySqlAliasTable<TTable, TAlias>, MergeFields<NamedFields<MySqlAliasTable<TTable, TAlias>, T>>>;

  select<TAlias extends string, TSelection extends SelectedFields<MySqlColumn, MySqlAliasTable<TTable, TAlias>>>(
    alias: MySqlAliasTable<TTable, TAlias>,
    fields: Fields<FieldsQuery<MySqlAliasTable<TTable, TAlias>>, TSelection>
  ): SelectFrom<MySqlAliasTable<TTable, TAlias>, TSelection>;

  select(fieldsOrAlias?: unknown, fields?: unknown): any {
    const tx = this.getTx();

    const isAlias = isTable(fieldsOrAlias);
    const table: MySqlTable = isAlias ? (fieldsOrAlias as MySqlTable) : this.t;
    const selectedFields = this.resolveFields(isAlias ? fields : fieldsOrAlias, table);
    return tx.select(selectedFields ?? TableColumns(table)).from(table);
  }

  /********************************************************************************************************************
   * find
   * ******************************************************************************************************************/

  async find(where: BaseWhere<this>): Promise<FindResult<TTable, undefined>>;

  async find(fields: readonly [], where?: BaseWhere<this>): Promise<FindResult<TTable, {}>>;

  async find<N extends MySqlColumnSelectionName<TTable>>(
    fields: readonly N[] & readonly MySqlColumnSelectionName<TTable>[],
    where?: BaseWhere<this>
  ): Promise<FindResult<TTable, MySqlSelectedNamedColumns<TTable, readonly N[]>>>;

  async find<const T extends readonly FieldInput[]>(
    fields: (query: FieldsQuery<TTable>) => T,
    where: BaseWhere<this>
  ): Promise<FindResult<TTable, MergeFields<T>>>;

  async find<const T extends readonly FieldInput[] | readonly MySqlColumnSelectionName<TTable>[]>(
    fields: T & readonly (FieldInput | MySqlColumnSelectionName<TTable>)[],
    where: BaseWhere<this>
  ): Promise<FindResult<TTable, MergeFields<NamedFields<TTable, T>>>>;

  async find<TSelection extends SelectedFields<MySqlColumn, TTable>>(
    fields: Fields<FieldsQuery<TTable>, TSelection>,
    where: BaseWhere<this>
  ): Promise<FindResult<TTable, TSelection>>;

  async find<TAlias extends string>(
    alias: MySqlAliasTable<TTable, TAlias>,
    where: BaseWhere<this>
  ): Promise<FindResult<MySqlAliasTable<TTable, TAlias>, undefined>>;

  async find<TAlias extends string>(
    alias: MySqlAliasTable<TTable, TAlias>,
    fields: readonly [],
    where?: BaseWhere<this>
  ): Promise<FindResult<MySqlAliasTable<TTable, TAlias>, {}>>;

  async find<TAlias extends string, N extends MySqlColumnSelectionName<MySqlAliasTable<TTable, TAlias>>>(
    alias: MySqlAliasTable<TTable, TAlias>,
    fields: readonly N[] & readonly MySqlColumnSelectionName<MySqlAliasTable<TTable, TAlias>>[],
    where?: BaseWhere<this>
  ): Promise<
    FindResult<
      MySqlAliasTable<TTable, TAlias>,
      MySqlSelectedNamedColumns<MySqlAliasTable<TTable, TAlias>, readonly N[]>
    >
  >;

  async find<TAlias extends string, const T extends readonly FieldInput[]>(
    alias: MySqlAliasTable<TTable, TAlias>,
    fields: (query: FieldsQuery<MySqlAliasTable<TTable, TAlias>>) => T,
    where: BaseWhere<this>
  ): Promise<FindResult<MySqlAliasTable<TTable, TAlias>, MergeFields<T>>>;

  async find<
    TAlias extends string,
    const T extends readonly FieldInput[] | readonly MySqlColumnSelectionName<MySqlAliasTable<TTable, TAlias>>[],
  >(
    alias: MySqlAliasTable<TTable, TAlias>,
    fields: T & readonly (FieldInput | MySqlColumnSelectionName<MySqlAliasTable<TTable, TAlias>>)[],
    where: BaseWhere<this>
  ): Promise<FindResult<MySqlAliasTable<TTable, TAlias>, MergeFields<NamedFields<MySqlAliasTable<TTable, TAlias>, T>>>>;

  async find<TAlias extends string, TSelection extends SelectedFields<MySqlColumn, MySqlAliasTable<TTable, TAlias>>>(
    alias: MySqlAliasTable<TTable, TAlias>,
    fields: Fields<FieldsQuery<MySqlAliasTable<TTable, TAlias>>, TSelection>,
    where: BaseWhere<this>
  ): Promise<FindResult<MySqlAliasTable<TTable, TAlias>, TSelection>>;

  async find(aliasOrFieldsOrWhere: unknown, fieldsOrWhere?: unknown, where?: BaseWhere<this>): Promise<unknown> {
    const hasAlias = isTable(aliasOrFieldsOrWhere);
    const fieldsOrCondition = hasAlias ? fieldsOrWhere : aliasOrFieldsOrWhere;
    const hasFields = arguments.length === (hasAlias ? 3 : 2);

    const isCondition = (value: unknown): value is BaseWhere<this> => is(value, SQL) || typeof value === 'function';

    const table = hasAlias ? (aliasOrFieldsOrWhere as MySqlTable) : this.t;
    const selectedFields = this.resolveFields(
      !hasFields && isCondition(fieldsOrCondition) ? undefined : fieldsOrCondition,
      table
    );

    const conditionInput =
      !hasFields && isCondition(fieldsOrCondition)
        ? fieldsOrCondition
        : hasAlias
          ? where
          : isCondition(fieldsOrWhere)
            ? fieldsOrWhere
            : undefined;

    const condition = typeof conditionInput === 'function' ? conditionInput(this) : conditionInput;

    if (condition !== undefined && !is(condition, SQL)) {
      throw new Error('find: the where callback must return SQL or undefined.');
    }

    const builder = (() => {
      if (hasAlias) {
        type AliasTable = MySqlAliasTable<TTable, string>;

        const alias = aliasOrFieldsOrWhere as AliasTable;

        if (selectedFields === undefined) {
          return this.select(alias);
        }

        return this.select(alias, selectedFields as SelectedFields<MySqlColumn, AliasTable>);
      }

      return selectedFields === undefined
        ? this.select()
        : this.select(selectedFields as SelectedFields<MySqlColumn, TTable>);
    })();

    const [result] = await builder.where(condition).limit(1);
    return result;
  }

  /********************************************************************************************************************
   * findByPrimaryKey
   * ******************************************************************************************************************/

  // 오버로드 해석 실패 시 TypeScript는 인자 수를 만족하는 첫 시그니처로 자동완성하므로 컬럼명 배열을 맨 앞에 둔다.
  findByPrimaryKey<N extends MySqlColumnSelectionName<TTable>>(
    fields: readonly N[] & readonly MySqlColumnSelectionName<TTable>[],
    key: PrimaryKeyInput<TTable>
  ): Promise<FindResult<TTable, MySqlSelectedNamedColumns<TTable, readonly N[]>>>;

  findByPrimaryKey(key: PrimaryKeyInput<TTable>): Promise<FindResult<TTable, undefined>>;

  findByPrimaryKey(fields: readonly [], key: PrimaryKeyInput<TTable>): Promise<FindResult<TTable, {}>>;

  findByPrimaryKey<const T extends readonly FieldInput[]>(
    fields: (query: FieldsQuery<TTable>) => T,
    key: PrimaryKeyInput<TTable>
  ): Promise<FindResult<TTable, MergeFields<T>>>;

  findByPrimaryKey<const T extends readonly FieldInput[] | readonly MySqlColumnSelectionName<TTable>[]>(
    fields: T & readonly (FieldInput | MySqlColumnSelectionName<TTable>)[],
    key: PrimaryKeyInput<TTable>
  ): Promise<FindResult<TTable, MergeFields<NamedFields<TTable, T>>>>;

  findByPrimaryKey<TSelection extends SelectedFields<MySqlColumn, TTable>>(
    fields: Fields<FieldsQuery<TTable>, TSelection>,
    key: PrimaryKeyInput<TTable>
  ): Promise<FindResult<TTable, TSelection>>;

  async findByPrimaryKey(fieldsOrKey: unknown, key?: unknown): Promise<unknown> {
    const hasFields = arguments.length === 2;
    const primaryKeyValue = hasFields ? key : fieldsOrKey;
    const condition = this.primaryKeyCondition(primaryKeyValue, 'findByPrimaryKey');

    if (hasFields) {
      return this.find(this.resolveFields(fieldsOrKey) as SelectedFields<MySqlColumn, TTable>, condition);
    }

    return this.find(condition);
  }

  /********************************************************************************************************************
   * primaryKeyCondition
   * ******************************************************************************************************************/
  private primaryKeyCondition(primaryKeyValue: unknown, method: string): SQL {
    // 固定された MySqlTable 型で取得し、ジェネリックによる型の拡大を避ける。
    const table: MySqlTable = this.t;
    const config = getTableConfig(table);
    const columns = getTableColumns(table);

    const primaryColumns = new Set<MySqlColumn>(config.columns.filter((column) => column.primary));

    for (const primaryKey of config.primaryKeys) {
      for (const column of primaryKey.columns) {
        primaryColumns.add(column);
      }
    }

    const primaryEntries = Object.entries(columns).filter(([, column]) => primaryColumns.has(column));

    if (primaryEntries.length === 0) {
      throw new Error(`${method}: ${config.name} has no primary key.`);
    }

    const isKeyObject =
      typeof primaryKeyValue === 'object' && primaryKeyValue !== null && !Array.isArray(primaryKeyValue);

    if (primaryEntries.length > 1 && !isKeyObject) {
      throw new Error(`${method}: ${config.name} requires a composite key object.`);
    }

    const keyObject = isKeyObject ? (primaryKeyValue as Record<string, unknown>) : undefined;

    if (
      keyObject &&
      Object.keys(keyObject).some((name) => !primaryEntries.some(([primaryName]) => primaryName === name))
    ) {
      throw new Error(`${method}: ${config.name} received an unknown primary key field.`);
    }

    const conditions = primaryEntries.map(([name, column]) => {
      if (keyObject && !Object.hasOwn(keyObject, name)) {
        throw new Error(`${method}: missing primary key field "${name}".`);
      }

      const value = keyObject ? keyObject[name] : primaryKeyValue;

      if (value === undefined || value === null) {
        throw new Error(`${method}: primary key field "${name}" must have a value.`);
      }

      return eq(column, value);
    });

    const condition = drizzleAnd(...conditions);

    if (!condition) {
      throw new Error(`${method}: failed to build the primary key condition.`);
    }

    return condition;
  }

  /********************************************************************************************************************
   * exists
   * ******************************************************************************************************************/
  async exists(where?: BaseWhere<this>): Promise<boolean> {
    const condition = typeof where === 'function' ? where(this) : where;

    if (condition !== undefined && !is(condition, SQL)) {
      throw new Error('exists: the where callback must return SQL or undefined.');
    }

    const [result] = await this.select({ matched: this.drizzle.sqlNumber(1) })
      .where(condition)
      .limit(1);

    return result !== undefined;
  }

  /********************************************************************************************************************
   * existsByPrimarykey
   * ******************************************************************************************************************/
  async existsByPrimaryKey(key: PrimaryKeyInput<TTable>): Promise<boolean> {
    const result = await this.findByPrimaryKey({ matched: this.drizzle.sqlNumber(1) }, key);

    return result !== undefined;
  }

  /********************************************************************************************************************
   * notExists
   * ******************************************************************************************************************/
  async notExists(where?: BaseWhere<this>): Promise<boolean> {
    return !(await this.exists(where));
  }

  /********************************************************************************************************************
   * notExistsByPrimaryKey
   * ******************************************************************************************************************/
  async notExistsByPrimaryKey(key: PrimaryKeyInput<TTable>): Promise<boolean> {
    return !(await this.existsByPrimaryKey(key));
  }

  /********************************************************************************************************************
   * count
   * ******************************************************************************************************************/
  async count(where?: BaseWhere<this>): Promise<number> {
    const condition = typeof where === 'function' ? where(this) : where;

    if (condition !== undefined && !is(condition, SQL)) {
      throw new Error('count: the where callback must return SQL or undefined.');
    }

    const [{ cnt }] = await this.select({ cnt: count() }).where(condition);

    return cnt;
  }

  private prepareValues(input: object, operation: 'insert' | 'update'): Record<string, unknown> {
    const values = { ...input } as Record<string, unknown>;
    const columns = getTableColumns(this.t);
    const policies = getColumnPolicies(this.t);
    let timestamp: unknown;
    let generated = false;
    for (const [key, column] of Object.entries(columns)) {
      const policy = policies[key] ?? {};
      const auto = 'autoIncrement' in column && column.autoIncrement === true;
      const rule = operation === 'insert' ? policy.insert : policy.update;
      const primary = column.primary;
      const blocked =
        (operation === 'update' && policy.timestamp === 'created') ||
        rule === 'blocked' ||
        (operation === 'update' && primary && rule !== 'allowed') ||
        (auto && rule !== 'allowed' && rule !== 'required');
      if (blocked && Object.hasOwn(values, key)) throw new Error(`${operation}: column "${key}" is blocked.`);
      if (
        operation === 'update' &&
        !blocked &&
        rule === 'required' &&
        policy.timestamp !== 'updated' &&
        values[key] === undefined
      ) {
        throw new Error(`update: column "${key}" is required.`);
      }
      if (policy.timestamp && values[key] === undefined && (operation === 'insert' || policy.timestamp === 'updated')) {
        if (!generated) {
          const getTimestamp = this.getTimestamp ?? this.current.getTimestamp;
          if (!getTimestamp) throw new Error('timestamp generator is not configured');
          timestamp = getTimestamp();
          generated = true;
        }
        values[key] = timestamp;
      }
    }
    return values;
  }

  /********************************************************************************************************************
   * (PRIVATE) executeInsert
   * ******************************************************************************************************************/
  private async executeInsert(value: MySqlInsertValue<TTable> | MySqlInsertValue<TTable>[]): Promise<AR | AR[]> {
    const tx = this.getTx();

    const autoIncrementColumn = getTableConfig(this.t).columns.find(
      (column) => 'autoIncrement' in column && column.autoIncrement === true
    );
    const hasAutoIncrement = !!autoIncrementColumn;
    const autoIncrementKey =
      autoIncrementColumn &&
      Object.keys(getTableColumns(this.t)).find((key) => getTableColumns(this.t)[key] === autoIncrementColumn);

    if (hasAutoIncrement) {
      if (Array.isArray(value)) {
        const addedItems = await tx.insert(this.t).values(value).$returningId();
        return addedItems.map((item) => (item as any)[autoIncrementKey!]);
      } else {
        const [item] = await tx.insert(this.t).values(value).$returningId();
        return (item as any)[autoIncrementKey!];
      }
    } else {
      if (Array.isArray(value)) {
        await tx.insert(this.t).values(value);
        return Array(value.length).fill(undefined);
      } else {
        await tx.insert(this.t).values(value);
        return undefined as AR;
      }
    }
  }

  /********************************************************************************************************************
   * insertValues
   * ******************************************************************************************************************/
  insertValues(values: IV[]): IV[];
  insertValues(values: IV): IV;
  insertValues(values: IV | IV[]): IV | IV[] {
    return values;
  }

  /********************************************************************************************************************
   * updateValues
   * ******************************************************************************************************************/
  updateValues(values: UV): UV {
    return values;
  }

  /********************************************************************************************************************
   * add
   * ******************************************************************************************************************/
  add(value: IV[]): Promise<AR[]>;

  add(value: IV): Promise<AR>;

  add(value: IV | IV[]) {
    const items = Array.isArray(value) ? value : [value];
    const values = items.map((item) => this.prepareValues(item, 'insert'));
    return this.executeInsert((Array.isArray(value) ? values : values[0]) as unknown as MySqlInsertValue<TTable>);
  }

  /********************************************************************************************************************
   * edit
   * ******************************************************************************************************************/
  edit(
    this: this & (TableMutationPolicy<TTable> extends { updateBlocked: true } ? never : unknown),
    set: UV,
    where: BaseWhere<this>
  ) {
    this.assertMutationAllowed('update', 'edit');
    const condition = typeof where === 'function' ? where(this) : where;

    if (!is(condition, SQL)) {
      throw new Error('edit: a SQL where condition is required.');
    }

    const tx = this.getTx();

    return tx
      .update(this.t)
      .set(this.prepareValues(set, 'update') as MySqlUpdateSetSource<TTable>)
      .where(condition);
  }

  /********************************************************************************************************************
   * editByPrimaryKey
   * ******************************************************************************************************************/
  editByPrimaryKey(
    this: this & (TableMutationPolicy<TTable> extends { updateBlocked: true } ? never : unknown),
    set: UV,
    key: PrimaryKeyInput<TTable>
  ) {
    this.assertMutationAllowed('update', 'editByPrimaryKey');
    return this.edit(set, this.primaryKeyCondition(key, 'editByPrimaryKey'));
  }

  /********************************************************************************************************************
   * remove
   * ******************************************************************************************************************/
  remove(
    this: this & (TableMutationPolicy<TTable> extends { deleteBlocked: true } ? never : unknown),
    where: BaseWhere<this>
  ) {
    this.assertMutationAllowed('delete', 'remove');
    const condition = typeof where === 'function' ? where(this) : where;

    if (!is(condition, SQL)) {
      throw new Error('remove: a SQL where condition is required.');
    }

    const tx = this.getTx();

    return tx.delete(this.t).where(condition);
  }

  /********************************************************************************************************************
   * removeByPrimaryKey
   * ******************************************************************************************************************/
  removeByPrimaryKey(
    this: this & (TableMutationPolicy<TTable> extends { deleteBlocked: true } ? never : unknown),
    key: PrimaryKeyInput<TTable>
  ) {
    this.assertMutationAllowed('delete', 'removeByPrimaryKey');
    return this.remove(this.primaryKeyCondition(key, 'removeByPrimaryKey'));
  }

  private assertMutationAllowed(operation: 'update' | 'delete', method: string): void {
    const policy = getTablePolicy(this.t);
    if (operation === 'update' ? policy.updateBlocked : policy.deleteBlocked) {
      throw new Error(`${method}: ${operation} is blocked for table "${getTableConfig(this.t).name}".`);
    }
  }

  /********************************************************************************************************************
   * eq
   * ******************************************************************************************************************/
  eq(values: MySqlCompareValues<TTable>): SQL | undefined {
    return this.drizzle.eq(this.t, values);
  }

  /********************************************************************************************************************
   * ne
   * ******************************************************************************************************************/
  ne(values: MySqlCompareValues<TTable>): SQL | undefined {
    return this.drizzle.ne(this.t, values);
  }

  /********************************************************************************************************************
   * gt
   * ******************************************************************************************************************/
  gt(values: MySqlCompareValues<TTable>): SQL | undefined {
    return this.drizzle.gt(this.t, values);
  }

  /********************************************************************************************************************
   * gte
   * ******************************************************************************************************************/
  gte(values: MySqlCompareValues<TTable>): SQL | undefined {
    return this.drizzle.gte(this.t, values);
  }

  /********************************************************************************************************************
   * lt
   * ******************************************************************************************************************/
  lt(values: MySqlCompareValues<TTable>): SQL | undefined {
    return this.drizzle.lt(this.t, values);
  }

  /********************************************************************************************************************
   * lte
   * ******************************************************************************************************************/
  lte(values: MySqlCompareValues<TTable>): SQL | undefined {
    return this.drizzle.lte(this.t, values);
  }

  /********************************************************************************************************************
   * lte
   * ******************************************************************************************************************/
  inArray(values: MySqlArrayCompareValues<TTable>): SQL | undefined {
    return this.drizzle.inArray(this.t, values);
  }

  /********************************************************************************************************************
   * notInArray
   * ******************************************************************************************************************/
  notInArray(values: MySqlArrayCompareValues<TTable>): SQL | undefined {
    return this.drizzle.notInArray(this.t, values);
  }

  /********************************************************************************************************************
   * between
   * ******************************************************************************************************************/
  between(values: MySqlRangeCompareValues<TTable>): SQL | undefined {
    return this.drizzle.between(this.t, values);
  }

  /********************************************************************************************************************
   * notBetween
   * ******************************************************************************************************************/
  notBetween(values: MySqlRangeCompareValues<TTable>): SQL | undefined {
    return this.drizzle.notBetween(this.t, values);
  }

  /********************************************************************************************************************
   * like
   * ******************************************************************************************************************/
  like(values: MySqlPatternCompareValues<TTable>): SQL | undefined {
    return this.drizzle.like(this.t, values);
  }

  /********************************************************************************************************************
   * notLike
   * ******************************************************************************************************************/
  notLike(values: MySqlPatternCompareValues<TTable>): SQL | undefined {
    return this.drizzle.notLike(this.t, values);
  }

  /********************************************************************************************************************
   * ilike
   * ******************************************************************************************************************/
  ilike(values: MySqlPatternCompareValues<TTable>): SQL | undefined {
    return this.drizzle.ilike(this.t, values);
  }

  /********************************************************************************************************************
   * notIlike
   * ******************************************************************************************************************/
  notIlike(values: MySqlPatternCompareValues<TTable>): SQL | undefined {
    return this.drizzle.notIlike(this.t, values);
  }

  /********************************************************************************************************************
   * isNull
   * ******************************************************************************************************************/
  isNull(name: MySqlColumnName<TTable>): SQL;
  isNull(names: MySqlNullConditionInput<TTable>): SQL | undefined;
  isNull(names: MySqlNullConditionInput<TTable>): SQL | undefined {
    return this.drizzle.isNull(this.t, names);
  }

  /********************************************************************************************************************
   * isNotNull
   * ******************************************************************************************************************/
  isNotNull(name: MySqlColumnName<TTable>): SQL;
  isNotNull(names: MySqlNullConditionInput<TTable>): SQL | undefined;
  isNotNull(names: MySqlNullConditionInput<TTable>): SQL | undefined {
    return this.drizzle.isNotNull(this.t, names);
  }

  /********************************************************************************************************************
   * and
   * ******************************************************************************************************************/
  and(options: MySqlConditions<TTable>): SQL | undefined {
    return this.drizzle.and(this.t, options);
  }

  /********************************************************************************************************************
   * or
   * ******************************************************************************************************************/
  or(options: MySqlConditions<TTable>): SQL | undefined {
    return this.drizzle.or(this.t, options);
  }
}

/********************************************************************************************************************
 * types
 * ******************************************************************************************************************/

type SelectFrom<TTable extends MySqlTable, TSelection extends FieldSet | undefined> = MySqlAsyncSelectBase<
  GetSelectTableName<TTable>,
  TSelection extends undefined ? MySqlSelectedTableColumns<TTable> : TSelection,
  'partial'
>;

type FindResult<TTable extends MySqlTable, TSelection extends FieldSet | undefined> =
  Awaited<SelectFrom<TTable, TSelection>>[number] | undefined;

type WhereQuery<TQuery> = Pick<
  TQuery,
  Extract<
    keyof TQuery,
    | 't'
    | 'eq'
    | 'ne'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'inArray'
    | 'notInArray'
    | 'between'
    | 'notBetween'
    | 'like'
    | 'notLike'
    | 'ilike'
    | 'notIlike'
    | 'isNull'
    | 'isNotNull'
    | 'and'
    | 'or'
  >
>;
type BaseWhere<TQuery> = SQL | undefined | ((query: WhereQuery<TQuery>) => SQL | undefined);

type FieldSet = SelectedFields<MySqlColumn, MySqlTable>;
type FieldInput = FieldSet | false | undefined;
type FieldsQuery<TTable extends MySqlTable> = {
  readonly t: TTable;
  columns(): MySqlSelectedTableColumns<TTable>;
  columns<N extends MySqlColumnSelectionName<TTable>>(
    ...names: N[] & MySqlColumnSelectionName<TTable>[]
  ): MySqlSelectedNamedColumnUnion<TTable, N>;
};
type Fields<TQuery, TSelection> = TSelection | ((query: TQuery) => TSelection);
type NamedFields<TTable extends MySqlTable, T extends readonly (FieldInput | MySqlColumnSelectionName<TTable>)[]> = {
  [I in keyof T]: T[I] extends MySqlColumnSelectionName<TTable>
    ? MySqlSelectedNamedColumns<TTable, readonly [T[I]]>
    : Extract<T[I], FieldInput>;
};
type MergeField<First, Result> = First extends FieldSet
  ? Result extends unknown
    ? Omit<Result, keyof First> & First
    : never
  : Result;
type MergeFields<T extends readonly FieldInput[], Result = {}> = T extends readonly [
  infer First extends FieldInput,
  ...infer Rest extends readonly FieldInput[],
]
  ? MergeFields<Rest, MergeField<First, Result>>
  : number extends T['length']
    ? Exclude<T[number], false | undefined>
    : Result extends unknown
      ? { [P in keyof Result]: Result[P] }
      : never;

const normalizeFields = (fields: unknown): FieldSet | undefined => {
  if (fields === undefined) return undefined;
  const groups = Array.isArray(fields) ? fields : [fields];
  const result: FieldSet = {};
  for (const group of groups) {
    if (Array.isArray(fields) && (group === false || group === undefined)) continue;
    if (typeof group !== 'object' || group === null || Array.isArray(group) || isTable(group) || is(group, SQL)) {
      throw new Error('fields: expected a selection object or an array of selection objects.');
    }
    Object.assign(result, group);
  }
  for (const [name, field] of Object.entries(result)) {
    if (is(field, MySqlColumn) && field.name !== name) {
      result[name] = sql`${field}`.mapWith(field).as(name);
    }
  }
  return result;
};

type PrimaryKeyNames<T extends MySqlTable> = {
  [P in keyof T['_']['columns']]: T['_']['columns'][P]['_'] extends {
    isPrimaryKey: true;
  }
    ? P
    : never;
}[keyof T['_']['columns']];

type PrimaryKeyObject<T extends MySqlTable> = {
  [P in PrimaryKeyNames<T>]: T['_']['columns'][P]['_']['data'];
};

type IsUnion<T, U = T> = T extends U ? ([U] extends [T] ? false : true) : never;

type PrimaryKeyInput<T extends MySqlTable> = [PrimaryKeyNames<T>] extends [never]
  ? never
  : IsUnion<PrimaryKeyNames<T>> extends true
    ? PrimaryKeyObject<T>
    : PrimaryKeyObject<T> | PrimaryKeyObject<T>[PrimaryKeyNames<T>];

type AutoIncrementKeys<TTable extends MySqlTable> = {
  [P in keyof TTable['_']['columns']]: TTable['_']['columns'][P]['_'] extends {
    isAutoincrement: true;
  }
    ? P
    : never;
}[keyof TTable['_']['columns']];

type HasAutoIncrement<TTable extends MySqlTable> = [AutoIncrementKeys<TTable>] extends [never] ? false : true;

type AddResult<TTable extends MySqlTable> = HasAutoIncrement<TTable> extends true ? number : undefined;
