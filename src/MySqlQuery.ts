import {
  SQL,
  isTable,
  is,
  sql,
  count,
  Subquery,
  eq,
  getTableColumns,
  and as drizzleAnd,
  or as drizzleOr,
  asc as drizzleAsc,
  desc as drizzleDesc,
  max as drizzleMax,
  min as drizzleMin,
  type Placeholder,
  type SQLWrapper,
} from 'drizzle-orm';
import {
  MySqlTable,
  MySqlColumn,
  MySqlSelectBase,
  alias as drizzleAlias,
  getTableConfig,
  type MySqlAsyncSelectBase,
  type MySqlUpdateSetSource,
  type MySqlJoin,
} from 'drizzle-orm/mysql-core';
import type { MySqlViewBase } from 'drizzle-orm/mysql-core/view-base';
import type { SelectedFields } from 'drizzle-orm/operations';
import type { GetSelectTableName } from 'drizzle-orm/query-builders/select.types';
import type {
  GetMySqlSetOperators,
  MySqlSetOperatorWithResult,
  SetOperatorRightSelect,
} from 'drizzle-orm/mysql-core/query-builders/select.types';
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
  MySqlAddValues,
  MySqlEditValues,
  MySqlCompareValues,
  MySqlColumnName,
  MySqlArrayCompareValues,
  MySqlRangeCompareValues,
  MySqlPatternCompareValues,
  MySqlNullConditionInput,
  MySqlAndConditions,
  MySqlOrConditions,
} from './@types';
import { createConditions } from './conditions';
import type { MySqlInsertValue } from 'drizzle-orm/mysql-core/query-builders/insert';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import type { TypedQueryBuilder } from 'drizzle-orm/query-builders/query-builder';

/********************************************************************************************************************
 * MySqlQuery
 * ******************************************************************************************************************/
export class MySqlQuery<
  TTable extends MySqlTable,
  AV extends MySqlAddValues<TTable> = MySqlAddValues<TTable>,
  EV extends MySqlEditValues<TTable> = MySqlEditValues<TTable>,
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

  /********************************************************************************************************************
   * alias
   * ******************************************************************************************************************/
  alias<TAlias extends string>(name: TAlias): MySqlAliasTable<TTable, TAlias> {
    return drizzleAlias(this.t, name) as MySqlAliasTable<TTable, TAlias>;
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
  columns<N extends MySqlColumnSelectionName<TTable>>(...names: N[]): MySqlSelectedNamedColumnUnion<TTable, N>;

  columns(...names: string[]): unknown {
    const table: MySqlTable = this.t;
    return TableColumns(table, ...(names as MySqlColumnSelectionName<MySqlTable>[]));
  }

  /********************************************************************************************************************
   * min / max
   * ******************************************************************************************************************/
  min<N extends keyof TTable['_']['columns'] & string>(
    name: N
  ): ReturnType<typeof drizzleMin<TTable['_']['columns'][N]>>;

  min<C extends MySqlColumn>(column: C): ReturnType<typeof drizzleMin<C>>;
  min(columnOrName: string | MySqlColumn): SQL<unknown> {
    return drizzleMin(this.resolveAggregateColumn(columnOrName));
  }

  max<N extends keyof TTable['_']['columns'] & string>(
    name: N
  ): ReturnType<typeof drizzleMax<TTable['_']['columns'][N]>>;

  max<C extends MySqlColumn>(column: C): ReturnType<typeof drizzleMax<C>>;
  max(columnOrName: string | MySqlColumn): SQL<unknown> {
    return drizzleMax(this.resolveAggregateColumn(columnOrName));
  }

  private resolveAggregateColumn(
    columnOrName: string | MySqlColumn,
    table: MySqlTable | Subquery = this.t
  ): MySqlColumn {
    if (typeof columnOrName !== 'string') return columnOrName;
    const columns = is(table, Subquery) ? sourceColumns(table) : getTableColumns(table);
    const column = columns[columnOrName];
    if (!column) throw new Error(`aggregate: unknown column "${columnOrName}".`);
    return column as MySqlColumn;
  }

  private resolveOrderColumn(name: string | undefined, table: MySqlTable | Subquery): MySqlColumn {
    if (name === undefined) throw new Error('orderBy: column name is required.');
    const columns = is(table, Subquery) ? sourceColumns(table) : getTableColumns(table);
    if (!Object.hasOwn(columns, name)) throw new Error(`orderBy: unknown column "${name}".`);
    return columns[name] as MySqlColumn;
  }

  private resolveConditionColumn(name: string, table: MySqlTable): MySqlColumn {
    const columns = getTableColumns(table);
    if (!Object.hasOwn(columns, name)) throw new Error(`Condition: unknown column "${name}".`);
    return columns[name];
  }

  /********************************************************************************************************************
   * asc
   * ******************************************************************************************************************/
  asc<N extends MySqlColumnName<TTable>>(name: N): SQL;
  asc<N extends MySqlColumnName<TTable>>(first: N, second: N, ...names: N[]): SQL[];
  asc<TAlias extends string, N extends MySqlColumnName<MySqlAliasTable<TTable, TAlias>>>(
    table: MySqlAliasTable<TTable, TAlias>,
    name: N
  ): SQL;

  asc<TAlias extends string, N extends MySqlColumnName<MySqlAliasTable<TTable, TAlias>>>(
    table: MySqlAliasTable<TTable, TAlias>,
    first: N,
    second: N,
    ...names: N[]
  ): SQL[];

  asc(tableOrName: MySqlTable | string, name?: string, ...names: string[]): SQL | SQL[] {
    const table = isTable(tableOrName) ? tableOrName : this.t;
    const columns = isTable(tableOrName) ? [name, ...names] : [tableOrName, ...(name ? [name] : []), ...names];
    return this.orderByColumns(drizzleAsc, table, columns);
  }

  /********************************************************************************************************************
   * desc
   * ******************************************************************************************************************/
  desc<N extends MySqlColumnName<TTable>>(name: N): SQL;
  desc<N extends MySqlColumnName<TTable>>(first: N, second: N, ...names: N[]): SQL[];
  desc<TAlias extends string, N extends MySqlColumnName<MySqlAliasTable<TTable, TAlias>>>(
    table: MySqlAliasTable<TTable, TAlias>,
    name: N
  ): SQL;

  desc<TAlias extends string, N extends MySqlColumnName<MySqlAliasTable<TTable, TAlias>>>(
    table: MySqlAliasTable<TTable, TAlias>,
    first: N,
    second: N,
    ...names: N[]
  ): SQL[];

  desc(tableOrName: MySqlTable | string, name?: string, ...names: string[]): SQL | SQL[] {
    const table = isTable(tableOrName) ? tableOrName : this.t;
    const columns = isTable(tableOrName) ? [name, ...names] : [tableOrName, ...(name ? [name] : []), ...names];
    return this.orderByColumns(drizzleDesc, table, columns);
  }

  private orderByColumns(
    direction: typeof drizzleAsc | typeof drizzleDesc,
    table: MySqlTable | Subquery,
    names: (string | undefined)[],
  ): SQL | SQL[] {
    const orders = names.map((name) => direction(this.resolveOrderColumn(name, table)));
    return orders.length === 1 ? orders[0] : orders;
  }

  private resolveFields(fields: unknown, table: MySqlTable | Subquery = this.t): FieldSet | undefined {
    if (Array.isArray(fields) && fields.length > 0 && fields.every((field) => typeof field === 'string')) {
      return sourceColumns(table, fields as string[]);
    }
    if (typeof fields !== 'function') return normalizeFields(fields, table);
    const query = {
      t: table,
      columns: (...names: string[]) => sourceColumns(table, names),
      min: (columnOrName: string | MySqlColumn) => drizzleMin(this.resolveAggregateColumn(columnOrName, table)),
      max: (columnOrName: string | MySqlColumn) => drizzleMax(this.resolveAggregateColumn(columnOrName, table)),
    };
    return normalizeFields(fields(query), table);
  }

  /********************************************************************************************************************
   * select
   * ******************************************************************************************************************/

  select(): SelectFrom<TTable, undefined>;

  select(fields: readonly []): SelectFrom<TTable, {}>;

  select<N extends MySqlColumnSelectionName<TTable>>(
    fields: readonly N[]
  ): SelectFrom<TTable, MySqlSelectedNamedColumns<TTable, readonly N[]>>;

  select<const T extends readonly SelectFieldInput<TTable>[]>(
    fields: (query: FieldsQuery<TTable>) => T
  ): SelectFrom<TTable, MergeSelectFields<TTable, T>>;

  select<const T extends readonly (SelectFieldInput<TTable> | MySqlColumnSelectionName<TTable>)[]>(
    fields: T
  ): SelectFrom<TTable, MergeSelectFields<TTable, SelectNamedFields<TTable, T>>>;

  select<const TSelection extends StringColumnSelection<TTable>>(
    fields: TSelection
  ): SelectFrom<TTable, StringColumnSelectionFields<TTable, TSelection>>;

  select<const TSelection extends MixedSelection<TTable>>(
    fields: TSelection
  ): SelectFrom<TTable, ResolveMixedSelection<TTable, TSelection>>;

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
    fields: readonly N[]
  ): SelectFrom<
    MySqlAliasTable<TTable, TAlias>,
    MySqlSelectedNamedColumns<MySqlAliasTable<TTable, TAlias>, readonly N[]>
  >;

  select<TAlias extends string, const T extends readonly SelectFieldInput<MySqlAliasTable<TTable, TAlias>>[]>(
    alias: MySqlAliasTable<TTable, TAlias>,
    fields: (query: FieldsQuery<MySqlAliasTable<TTable, TAlias>>) => T
  ): SelectFrom<MySqlAliasTable<TTable, TAlias>, MergeSelectFields<MySqlAliasTable<TTable, TAlias>, T>>;

  select<
    TAlias extends string,
    const T extends readonly (SelectFieldInput<MySqlAliasTable<TTable, TAlias>> | MySqlColumnSelectionName<MySqlAliasTable<TTable, TAlias>>)[],
  >(
    alias: MySqlAliasTable<TTable, TAlias>,
    fields: T
  ): SelectFrom<
    MySqlAliasTable<TTable, TAlias>,
    MergeSelectFields<MySqlAliasTable<TTable, TAlias>, SelectNamedFields<MySqlAliasTable<TTable, TAlias>, T>>
  >;

  select<TAlias extends string, const TSelection extends MixedSelection<MySqlAliasTable<TTable, TAlias>>>(
    alias: MySqlAliasTable<TTable, TAlias>,
    fields: TSelection
  ): SelectFrom<MySqlAliasTable<TTable, TAlias>, ResolveMixedSelection<MySqlAliasTable<TTable, TAlias>, TSelection>>;

  select<TAlias extends string, TSelection extends SelectedFields<MySqlColumn, MySqlAliasTable<TTable, TAlias>>>(
    alias: MySqlAliasTable<TTable, TAlias>,
    fields: Fields<FieldsQuery<MySqlAliasTable<TTable, TAlias>>, TSelection>
  ): SelectFrom<MySqlAliasTable<TTable, TAlias>, TSelection>;

  select<TSource extends Subquery, const TArgs extends readonly [fields?: SubquerySelectInput<TSource>]>(
    source: TSource,
    ...args: TArgs
  ): SelectFrom<TSource, ResolveSubquerySelectInput<TSource, TArgs[0]>>;

  select(fieldsOrAlias?: unknown, fields?: unknown): any {
    return this.buildSelectQuery(fieldsOrAlias, fields);
  }

  /********************************************************************************************************************
   * selectDistinct
   * ******************************************************************************************************************/

  selectDistinct(): SelectFrom<TTable, undefined>;

  selectDistinct(fields: readonly []): SelectFrom<TTable, {}>;

  selectDistinct<N extends MySqlColumnSelectionName<TTable>>(
    fields: readonly N[]
  ): SelectFrom<TTable, MySqlSelectedNamedColumns<TTable, readonly N[]>>;

  selectDistinct<const T extends readonly SelectFieldInput<TTable>[]>(
    fields: (query: FieldsQuery<TTable>) => T
  ): SelectFrom<TTable, MergeSelectFields<TTable, T>>;

  selectDistinct<const T extends readonly (SelectFieldInput<TTable> | MySqlColumnSelectionName<TTable>)[]>(
    fields: T
  ): SelectFrom<TTable, MergeSelectFields<TTable, SelectNamedFields<TTable, T>>>;

  selectDistinct<const TSelection extends StringColumnSelection<TTable>>(
    fields: TSelection
  ): SelectFrom<TTable, StringColumnSelectionFields<TTable, TSelection>>;

  selectDistinct<const TSelection extends MixedSelection<TTable>>(
    fields: TSelection
  ): SelectFrom<TTable, ResolveMixedSelection<TTable, TSelection>>;

  selectDistinct<TSelection extends SelectedFields<MySqlColumn, TTable>>(
    fields?: Fields<FieldsQuery<TTable>, TSelection>
  ): SelectFrom<TTable, TSelection>;

  selectDistinct<TAlias extends string>(
    alias: MySqlAliasTable<TTable, TAlias>
  ): SelectFrom<MySqlAliasTable<TTable, TAlias>, undefined>;

  selectDistinct<TAlias extends string>(
    alias: MySqlAliasTable<TTable, TAlias>,
    fields: readonly []
  ): SelectFrom<MySqlAliasTable<TTable, TAlias>, {}>;

  selectDistinct<TAlias extends string, N extends MySqlColumnSelectionName<MySqlAliasTable<TTable, TAlias>>>(
    alias: MySqlAliasTable<TTable, TAlias>,
    fields: readonly N[]
  ): SelectFrom<
    MySqlAliasTable<TTable, TAlias>,
    MySqlSelectedNamedColumns<MySqlAliasTable<TTable, TAlias>, readonly N[]>
  >;

  selectDistinct<TAlias extends string, const T extends readonly SelectFieldInput<MySqlAliasTable<TTable, TAlias>>[]>(
    alias: MySqlAliasTable<TTable, TAlias>,
    fields: (query: FieldsQuery<MySqlAliasTable<TTable, TAlias>>) => T
  ): SelectFrom<MySqlAliasTable<TTable, TAlias>, MergeSelectFields<MySqlAliasTable<TTable, TAlias>, T>>;

  selectDistinct<
    TAlias extends string,
    const T extends readonly (SelectFieldInput<MySqlAliasTable<TTable, TAlias>> | MySqlColumnSelectionName<MySqlAliasTable<TTable, TAlias>>)[],
  >(
    alias: MySqlAliasTable<TTable, TAlias>,
    fields: T
  ): SelectFrom<
    MySqlAliasTable<TTable, TAlias>,
    MergeSelectFields<MySqlAliasTable<TTable, TAlias>, SelectNamedFields<MySqlAliasTable<TTable, TAlias>, T>>
  >;

  selectDistinct<TAlias extends string, const TSelection extends MixedSelection<MySqlAliasTable<TTable, TAlias>>>(
    alias: MySqlAliasTable<TTable, TAlias>,
    fields: TSelection
  ): SelectFrom<MySqlAliasTable<TTable, TAlias>, ResolveMixedSelection<MySqlAliasTable<TTable, TAlias>, TSelection>>;

  selectDistinct<
    TAlias extends string,
    TSelection extends SelectedFields<MySqlColumn, MySqlAliasTable<TTable, TAlias>>,
  >(
    alias: MySqlAliasTable<TTable, TAlias>,
    fields: Fields<FieldsQuery<MySqlAliasTable<TTable, TAlias>>, TSelection>
  ): SelectFrom<MySqlAliasTable<TTable, TAlias>, TSelection>;

  selectDistinct<TSource extends Subquery, const TArgs extends readonly [fields?: SubquerySelectInput<TSource>]>(
    source: TSource,
    ...args: TArgs
  ): SelectFrom<TSource, ResolveSubquerySelectInput<TSource, TArgs[0]>>;

  selectDistinct(fieldsOrAlias?: unknown, fields?: unknown): any {
    return this.buildSelectQuery(fieldsOrAlias, fields, true);
  }

  /********************************************************************************************************************
   * (PRIVATE) buildSelectQuery
   * ******************************************************************************************************************/
  private buildSelectQuery(fieldsOrAlias?: unknown, fields?: unknown, distinct = false): any {
    const tx = this.getTx();

    const isAlias = isTable(fieldsOrAlias) || is(fieldsOrAlias, Subquery);
    const table = isAlias ? (fieldsOrAlias as MySqlTable | Subquery) : this.t;
    const selectedFields = this.resolveFields(isAlias ? fields : fieldsOrAlias, table);
    const enhancedQueries = new WeakSet<object>();
    const enhance = (input: unknown): unknown => {
      if (typeof input !== 'object' || input === null || enhancedQueries.has(input)) return input;
      const query = input as Record<string, unknown>;
      enhancedQueries.add(query);
      const builder = query as unknown as { where: (condition: unknown) => unknown };
      const originalWhere = builder.where.bind(query);
      const orderBy = query.orderBy;
      const originalOrderBy = typeof orderBy === 'function' ? orderBy.bind(query) : undefined;
      const bindCondition: (
        operator: string,
        conditionTable?: MySqlTable | Subquery
      ) => (input: unknown) => SQL | undefined =
        (operator, conditionTable = table) =>
        (input) => {
          const conditionOperator = (this.drizzle as unknown as Record<string, (...args: unknown[]) => unknown>)[
            operator
          ];
        const orGroup = operator.startsWith('or') && operator !== 'or';
        const baseOperator = orGroup ? operator[2].toLowerCase() + operator.slice(3) : operator;
        const join = orGroup ? drizzleOr : drizzleAnd;
        const baseConditionOperator = (this.drizzle as unknown as Record<string, (...args: unknown[]) => unknown>)[
          baseOperator
        ];
          if (isTable(conditionTable)) {
            return Reflect.apply(conditionOperator, undefined, [conditionTable, input]) as SQL | undefined;
          }

          const columns = conditionTable as unknown as Record<string, unknown>;
          if (operator === 'and' || operator === 'or') {
            if (typeof input !== 'object' || input === null || Array.isArray(input)) {
              throw new Error(`${operator}: expected a condition object.`);
            }
            const conditions: (SQL | undefined)[] = Object.entries(input).map(([nestedOperator, values]) => {
              if (nestedOperator === operator) {
                throw new Error(`Condition: cannot nest "${operator}" inside itself.`);
              }
              return bindCondition(nestedOperator, conditionTable)(values) as SQL | undefined;
            });
            return operator === 'and' ? drizzleAnd(...conditions) : drizzleOr(...conditions);
          }

          if (baseOperator === 'isNull' || baseOperator === 'isNotNull') {
            const names = typeof input === 'string' ? [input] : Array.isArray(input) ? input : [];
            if (names.length === 0 && input !== undefined) throw new Error(`${operator}: expected column names.`);
            return join(
              ...names.map((name) => {
                if (typeof name !== 'string' || columns[name] === undefined) {
                  throw new Error(`Condition: unknown column "${String(name)}".`);
                }
                return Reflect.apply(baseConditionOperator, undefined, [columns[name]]) as SQL;
              })
            );
          }

          if (typeof input !== 'object' || input === null || Array.isArray(input)) {
            throw new Error(`${operator}: expected a column/value object.`);
          }
          const conditions = Object.entries(input)
            .filter(([, value]) => value !== undefined)
            .map(([name, value]) => {
              const column = columns[name];
              if (column === undefined) throw new Error(`Condition: unknown column "${name}".`);
              if (value === null && (baseOperator === 'eq' || baseOperator === 'ne')) {
                const nullOperator = this.drizzle[baseOperator === 'eq' ? 'isNull' : 'isNotNull'];
                return Reflect.apply(nullOperator, undefined, [column]);
              }
              if (baseOperator === 'between' || baseOperator === 'notBetween') {
                if (!Array.isArray(value) || value.length !== 2) throw new Error(`${operator}: expected two bounds.`);
                return Reflect.apply(baseConditionOperator, undefined, [column, value[0], value[1]]) as SQL;
              }
              return Reflect.apply(baseConditionOperator, undefined, [column, value]);
            });
          return join(...(conditions as SQL[]));
        };
      const combineCallbackConditions = (
        operator: 'and' | 'or',
        conditionTable: MySqlTable | Subquery,
        inputs: unknown[]
      ): SQL | undefined => {
        const conditions: (SQLWrapper | undefined | false)[] = [];
        for (const input of inputs) {
          if (input === undefined || input === false) continue;
          if (typeof input === 'object' && input !== null && 'getSQL' in input && typeof input.getSQL === 'function') {
            conditions.push(input as SQLWrapper);
            continue;
          }
          if (typeof input === 'object' && input !== null && !Array.isArray(input)) {
            conditions.push(bindCondition(operator, conditionTable)(input));
            continue;
          }
          throw new Error(`${operator}: expected SQL conditions or a condition object.`);
        }
        const filtered = conditions.filter((condition): condition is SQLWrapper | undefined => condition !== false);
        return operator === 'and' ? drizzleAnd(...filtered) : drizzleOr(...filtered);
      };
      const conditionQuery = (conditionTable: MySqlTable | Subquery, contextTable: MySqlTable | Subquery) =>
        ({
          t: contextTable,
          eq: bindCondition('eq', conditionTable),
          ne: bindCondition('ne', conditionTable),
          orEq: bindCondition('orEq', conditionTable),
          orNe: bindCondition('orNe', conditionTable),
          gt: bindCondition('gt', conditionTable),
          gte: bindCondition('gte', conditionTable),
          lt: bindCondition('lt', conditionTable),
          lte: bindCondition('lte', conditionTable),
          inArray: bindCondition('inArray', conditionTable),
          notInArray: bindCondition('notInArray', conditionTable),
          between: bindCondition('between', conditionTable),
          notBetween: bindCondition('notBetween', conditionTable),
          like: bindCondition('like', conditionTable),
          notLike: bindCondition('notLike', conditionTable),
          ilike: bindCondition('ilike', conditionTable),
          notIlike: bindCondition('notIlike', conditionTable),
          isNull: bindCondition('isNull', conditionTable),
          isNotNull: bindCondition('isNotNull', conditionTable),
          orGt: bindCondition('orGt', conditionTable),
          orGte: bindCondition('orGte', conditionTable),
          orLt: bindCondition('orLt', conditionTable),
          orLte: bindCondition('orLte', conditionTable),
          orInArray: bindCondition('orInArray', conditionTable),
          orNotInArray: bindCondition('orNotInArray', conditionTable),
          orBetween: bindCondition('orBetween', conditionTable),
          orNotBetween: bindCondition('orNotBetween', conditionTable),
          orLike: bindCondition('orLike', conditionTable),
          orNotLike: bindCondition('orNotLike', conditionTable),
          orIlike: bindCondition('orIlike', conditionTable),
          orNotIlike: bindCondition('orNotIlike', conditionTable),
          orIsNull: bindCondition('orIsNull', conditionTable),
          orIsNotNull: bindCondition('orIsNotNull', conditionTable),
          and: (...conditions: unknown[]) => combineCallbackConditions('and', conditionTable, conditions),
          or: (...conditions: unknown[]) => combineCallbackConditions('or', conditionTable, conditions),
        }) as unknown as SelectConditionQuery<MySqlTable>;
      const whereQuery = conditionQuery(table, table);
      const orderByColumns = (direction: typeof drizzleAsc | typeof drizzleDesc, name: string, ...names: string[]) =>
        this.orderByColumns(direction, table, [name, ...names]);
      const orderByQuery: SelectOrderByQuery<MySqlTable | Subquery> = {
        t: table,
        asc: (name, ...names) => orderByColumns(drizzleAsc, name, ...names),
        desc: (name, ...names) => orderByColumns(drizzleDesc, name, ...names),
      };
      const enhancements: Record<string, unknown> = {
        where: (condition: unknown) =>
          enhance(
            originalWhere(
              typeof condition === 'function'
                ? () => (condition as (query: SelectConditionQuery<MySqlTable | Subquery>) => unknown)(whereQuery)
                : condition
            )
          ),
      };
      if (originalOrderBy) {
        enhancements.orderBy = (...args: unknown[]) => {
          if (typeof args[0] === 'function') {
            const result = (args[0] as (query: SelectOrderByQuery<MySqlTable | Subquery>) => unknown)(orderByQuery);
            const columns = Array.isArray(result) ? result.flat(Infinity) : [result];
            return enhance(originalOrderBy(...columns));
          }
          return enhance(originalOrderBy(...args.flat(Infinity)));
        };
      }
      for (const setOperator of ['union', 'unionAll', 'intersect', 'except']) {
        const operation = query[setOperator];
        if (typeof operation !== 'function') continue;
        enhancements[setOperator] = (...args: unknown[]) => {
          const result = Reflect.apply(operation, query, args);
          return result === query ? query : enhance(result);
        };
      }
      const crossJoin = query.crossJoin;
      if (typeof crossJoin === 'function') {
        enhancements.crossJoin = (joinedTable: unknown) => enhance(Reflect.apply(crossJoin, query, [joinedTable]));
      }
      for (const joinMethod of ['innerJoin', 'leftJoin', 'rightJoin']) {
        const join = query[joinMethod];
        if (typeof join !== 'function') continue;
        enhancements[joinMethod] = (joinedTable: unknown, on: unknown, ...rest: unknown[]) => {
          if (typeof on !== 'function' || (!isTable(joinedTable) && !is(joinedTable, Subquery))) {
            return enhance(Reflect.apply(join, query, [joinedTable, on, ...rest]));
          }
          const joinQuery = conditionQuery(joinedTable as MySqlTable | Subquery, table) as JoinConditionQuery<
            MySqlTable,
            Joinable
          >;
          return enhance(
            Reflect.apply(join, query, [joinedTable, () => (on as (query: unknown) => unknown)(joinQuery), ...rest])
          );
        };
      }
      return Object.assign(query, enhancements);
    };

    const selectBuilder = distinct
      ? tx.selectDistinct(selectedFields ?? sourceColumns(table)).from(table)
      : tx.select(selectedFields ?? sourceColumns(table)).from(table);
    return enhance(selectBuilder);
  }

  /********************************************************************************************************************
   * find
   * ******************************************************************************************************************/

  async find(where: BaseWhere<this>): Promise<FindResult<TTable, undefined>>;

  async find(fields: readonly [], where?: BaseWhere<this>): Promise<FindResult<TTable, {}>>;

  async find<N extends MySqlColumnSelectionName<TTable>>(
    fields: readonly N[],
    where?: BaseWhere<this>
  ): Promise<FindResult<TTable, MySqlSelectedNamedColumns<TTable, readonly N[]>>>;

  async find<const T extends readonly FieldInput[]>(
    fields: (query: FieldsQuery<TTable>) => T,
    where: BaseWhere<this>
  ): Promise<FindResult<TTable, MergeFields<T>>>;

  async find<const T extends readonly (FieldInput | MySqlColumnSelectionName<TTable>)[]>(
    fields: T,
    where: BaseWhere<this>
  ): Promise<FindResult<TTable, MergeFields<NamedFields<TTable, T>>>>;

  async find<const TSelection extends StringColumnSelection<TTable>>(
    fields: TSelection,
    where: (query: WhereQuery<MySqlQuery<TTable, AV, EV, AR>>) => SQL | undefined
  ): Promise<FindResult<TTable, StringColumnSelectionFields<TTable, TSelection>>>;

  async find<const TSelection extends StringColumnSelection<TTable>>(
    fields: TSelection,
    where?: BaseWhere<this>
  ): Promise<FindResult<TTable, StringColumnSelectionFields<TTable, TSelection>>>;

  async find<TSelection extends SelectedFields<MySqlColumn, TTable>>(
    fields: Fields<FieldsQuery<TTable>, TSelection>,
    where: (query: WhereQuery<MySqlQuery<TTable, AV, EV, AR>>) => SQL | undefined
  ): Promise<FindResult<TTable, TSelection>>;

  async find<TSelection extends SelectedFields<MySqlColumn, TTable>>(
    fields: Fields<FieldsQuery<TTable>, TSelection>,
    where?: BaseWhere<this>
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
    fields: readonly N[],
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
    const T extends readonly (FieldInput | MySqlColumnSelectionName<MySqlAliasTable<TTable, TAlias>>)[],
  >(
    alias: MySqlAliasTable<TTable, TAlias>,
    fields: T,
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
    fields: readonly N[],
    key: PrimaryKeyInput<TTable>
  ): Promise<FindResult<TTable, MySqlSelectedNamedColumns<TTable, readonly N[]>>>;

  findByPrimaryKey(key: PrimaryKeyInput<TTable>): Promise<FindResult<TTable, undefined>>;

  findByPrimaryKey(fields: readonly [], key: PrimaryKeyInput<TTable>): Promise<FindResult<TTable, {}>>;

  findByPrimaryKey<const T extends readonly FieldInput[]>(
    fields: (query: FieldsQuery<TTable>) => T,
    key: PrimaryKeyInput<TTable>
  ): Promise<FindResult<TTable, MergeFields<T>>>;

  findByPrimaryKey<const T extends readonly (FieldInput | MySqlColumnSelectionName<TTable>)[]>(
    fields: T,
    key: PrimaryKeyInput<TTable>
  ): Promise<FindResult<TTable, MergeFields<NamedFields<TTable, T>>>>;

  findByPrimaryKey<const TSelection extends StringColumnSelection<TTable>>(
    fields: TSelection,
    key: PrimaryKeyInput<TTable>
  ): Promise<FindResult<TTable, StringColumnSelectionFields<TTable, TSelection>>>;

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
        (operation === 'update' && policy.timestamp === 'created' && rule !== 'allowed') ||
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

  private async executeInsertSelect(
    selectQuery: TypedQueryBuilder<Record<string, unknown>>
  ): Promise<AR[]> {
    const selectedFields = (selectQuery as any).getSelectedFields() as Record<string, unknown>;
    const columns = getTableColumns(this.t);
    const policies = getColumnPolicies(this.t);

    for (const name of Object.keys(selectedFields)) {
      const column = columns[name];
      const policy = policies[name] ?? {};
      const autoIncrement = column && 'autoIncrement' in column && column.autoIncrement === true;
      if (policy.insert === 'blocked' || (autoIncrement && policy.insert !== 'allowed' && policy.insert !== 'required')) {
        throw new Error(`insert: column "${name}" is blocked.`);
      }
    }

    const timestampColumns = Object.entries(policies).filter(
      ([, policy]) => policy.timestamp === 'created' || policy.timestamp === 'updated'
    );
    const missingTimestamps = timestampColumns.filter(([name]) => !Object.hasOwn(selectedFields, name));

    if (missingTimestamps.length > 0) {
      const getTimestamp = this.getTimestamp ?? this.current.getTimestamp;
      if (!getTimestamp) throw new Error('timestamp generator is not configured');

      const source = (selectQuery as any).as('__insert_source');
      const fields = Object.fromEntries(Object.keys(selectedFields).map((name) => [name, source[name]]));
      const timestamp = getTimestamp();
      for (const [name] of missingTimestamps) fields[name] = sql`${timestamp}`.as(name);
      selectQuery = this.getTx().select(fields as any).from(source) as TypedQueryBuilder<Record<string, unknown>>;
    }

    const autoIncrementColumn = getTableConfig(this.t).columns.find(
      (column) => 'autoIncrement' in column && column.autoIncrement === true
    );
    const insert = this.getTx().insert(this.t).select(selectQuery as any);

    if (autoIncrementColumn) {
      const autoIncrementKey = Object.keys(columns).find((key) => columns[key] === autoIncrementColumn);
      const rows = await insert.$returningId();
      return rows.map((row) => (row as Record<string, unknown>)[autoIncrementKey!] as AR);
    }

    const [result] = (await insert) as unknown as [{ affectedRows: number }, undefined];
    return Array(result.affectedRows).fill(undefined as AR);
  }

  /********************************************************************************************************************
   * addValues
   * ******************************************************************************************************************/
  addValues(values: AV[]): AV[];
  addValues(values: AV): AV;
  addValues(values: AV | AV[]): AV | AV[] {
    return values;
  }

  /********************************************************************************************************************
   * editValues
   * ******************************************************************************************************************/
  editValues(values: EV): EV {
    return values;
  }

  /********************************************************************************************************************
   * add
   * ******************************************************************************************************************/
  add(value: AV[]): Promise<AR[]>;

  add<TSelection extends Record<string, unknown>>(value: TypedQueryBuilder<TSelection>): Promise<AR[]>;

  add(value: AV): Promise<AR>;

  add(value: AV | AV[] | TypedQueryBuilder<Record<string, unknown>>) {
    if (is(value, MySqlSelectBase)) {
      return this.executeInsertSelect(value as TypedQueryBuilder<Record<string, unknown>>);
    }

    const items = Array.isArray(value) ? value : [value];
    const values = items.map((item) => this.prepareValues(item, 'insert'));
    return this.executeInsert((Array.isArray(value) ? values : values[0]) as unknown as MySqlInsertValue<TTable>);
  }

  /********************************************************************************************************************
   * edit
   * ******************************************************************************************************************/
  edit(
    this: this & (TableMutationPolicy<TTable> extends { updateBlocked: true } ? never : unknown),
    set: EV,
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
    set: EV,
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
  eq(values: MySqlCompareValues<TTable>): SQL | undefined;

  eq<N extends MySqlColumnName<TTable>>(name: N, value: Required<MySqlCompareValues<TTable>>[N]): SQL;

  eq<TAlias extends string, N extends MySqlColumnName<MySqlAliasTable<TTable, TAlias>>>(
    table: MySqlAliasTable<TTable, TAlias>,
    name: N,
    value: Required<MySqlCompareValues<MySqlAliasTable<TTable, TAlias>>>[N]
  ): SQL;

  eq(
    tableOrValues: MySqlTable | string | MySqlCompareValues<TTable>,
    nameOrValue?: unknown,
    value?: unknown
  ): SQL | undefined {
    if (typeof tableOrValues === 'string') {
      return eq(this.resolveConditionColumn(tableOrValues, this.t), nameOrValue as SQLWrapper);
    }
    if (isTable(tableOrValues)) {
      return eq(this.resolveConditionColumn(nameOrValue as string, tableOrValues), value as SQLWrapper);
    }
    return this.drizzle.eq(this.t, tableOrValues);
  }

  orEq(values: MySqlCompareValues<TTable>): SQL | undefined {
    return this.drizzle.orEq(this.t, values);
  }

  orNe(values: MySqlCompareValues<TTable>): SQL | undefined {
    return this.drizzle.orNe(this.t, values);
  }

  orGt(values: MySqlCompareValues<TTable>): SQL | undefined {
    return this.drizzle.orGt(this.t, values);
  }

  orGte(values: MySqlCompareValues<TTable>): SQL | undefined {
    return this.drizzle.orGte(this.t, values);
  }

  orLt(values: MySqlCompareValues<TTable>): SQL | undefined {
    return this.drizzle.orLt(this.t, values);
  }

  orLte(values: MySqlCompareValues<TTable>): SQL | undefined {
    return this.drizzle.orLte(this.t, values);
  }

  orInArray(values: MySqlArrayCompareValues<TTable>): SQL | undefined {
    return this.drizzle.orInArray(this.t, values);
  }

  orNotInArray(values: MySqlArrayCompareValues<TTable>): SQL | undefined {
    return this.drizzle.orNotInArray(this.t, values);
  }

  orBetween(values: MySqlRangeCompareValues<TTable>): SQL | undefined {
    return this.drizzle.orBetween(this.t, values);
  }

  orNotBetween(values: MySqlRangeCompareValues<TTable>): SQL | undefined {
    return this.drizzle.orNotBetween(this.t, values);
  }

  orLike(values: MySqlPatternCompareValues<TTable>): SQL | undefined {
    return this.drizzle.orLike(this.t, values);
  }

  orNotLike(values: MySqlPatternCompareValues<TTable>): SQL | undefined {
    return this.drizzle.orNotLike(this.t, values);
  }

  orIlike(values: MySqlPatternCompareValues<TTable>): SQL | undefined {
    return this.drizzle.orIlike(this.t, values);
  }

  orNotIlike(values: MySqlPatternCompareValues<TTable>): SQL | undefined {
    return this.drizzle.orNotIlike(this.t, values);
  }

  orIsNull(names: MySqlNullConditionInput<TTable>): SQL | undefined {
    return this.drizzle.orIsNull(this.t, names);
  }

  orIsNotNull(names: MySqlNullConditionInput<TTable>): SQL | undefined {
    return this.drizzle.orIsNotNull(this.t, names);
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
  and(options: MySqlAndConditions<TTable>): SQL | undefined;
  and(...conditions: (SQLWrapper | false | undefined)[]): SQL | undefined;
  and(
    options: MySqlAndConditions<TTable> | SQLWrapper | false | undefined,
    ...conditions: (SQLWrapper | false | undefined)[]
  ): SQL | undefined {
    if (typeof options === 'object' && options !== null && !('getSQL' in options)) {
      return this.drizzle.and(this.t, options as MySqlAndConditions<TTable>);
    }
    return drizzleAnd(...[options, ...conditions].filter((condition): condition is SQLWrapper | undefined => condition !== false));
  }

  /********************************************************************************************************************
   * or
   * ******************************************************************************************************************/
  or(options: MySqlOrConditions<TTable>): SQL | undefined;
  or(...conditions: (SQLWrapper | false | undefined)[]): SQL | undefined;
  or(
    options: MySqlOrConditions<TTable> | SQLWrapper | false | undefined,
    ...conditions: (SQLWrapper | false | undefined)[]
  ): SQL | undefined {
    if (typeof options === 'object' && options !== null && !('getSQL' in options)) {
      return this.drizzle.or(this.t, options as MySqlOrConditions<TTable>);
    }
    return drizzleOr(...[options, ...conditions].filter((condition): condition is SQLWrapper | undefined => condition !== false));
  }
}

/********************************************************************************************************************
 * types
 * ******************************************************************************************************************/

type SelectQueryBase<
  TTable extends MySqlTable | Subquery,
  TSelection extends FieldSet | undefined,
> = MySqlAsyncSelectBase<
  GetSelectTableName<TTable>,
  TSelection extends undefined ? SourceSelection<TTable> : AliasedSelection<NonNullable<TSelection>>,
  'partial'
>;

type TableWhere<TTable extends MySqlTable | Subquery> =
  SQL | undefined | ((query: SelectConditionQuery<TTable>) => SQL | undefined);

type OrderByValue = MySqlColumn | SQL | SQL.Aliased;
type OrderByInput = OrderByValue | readonly OrderByValue[];
type SelectOrderByQuery<TTable extends MySqlTable | Subquery> = {
  readonly t: TTable;
  asc(name: SourceColumnName<TTable>, ...names: SourceColumnName<TTable>[]): SQL | SQL[];
  desc(name: SourceColumnName<TTable>, ...names: SourceColumnName<TTable>[]): SQL | SQL[];
};
type OrderByCallback<TTable extends MySqlTable | Subquery> = (
  query: SelectOrderByQuery<TTable>
) => OrderByInput | OrderByInput[];
type GroupByCallback<
  TTable extends MySqlTable | Subquery,
  TSelection extends FieldSet | undefined,
> = (aliases: SelectQueryBase<TTable, TSelection>['_']['selection']) => OrderByValue | OrderByValue[];
type HavingCondition<
  TTable extends MySqlTable | Subquery,
  TSelection extends FieldSet | undefined,
> = SQL | undefined | ((aliases: SelectQueryBase<TTable, TSelection>['_']['selection']) => SQL | undefined);
type OrderByPreserved<TQuery, TTable extends MySqlTable | Subquery> = Omit<TQuery, 'orderBy'> & {
  orderBy(builder: OrderByCallback<TTable>): Omit<OrderByPreserved<TQuery, TTable>, 'orderBy'>;
  orderBy(...columns: OrderByInput[]): Omit<OrderByPreserved<TQuery, TTable>, 'orderBy'>;
};
type SelectSetOperatorMethod<
  TQuery extends { readonly _: { readonly result: any[] }; union: (...args: any[]) => any },
  TTable extends MySqlTable | Subquery,
> = <TValue extends MySqlSetOperatorWithResult<TQuery['_']['result']>>(
  rightSelection:
    | ((setOperators: GetMySqlSetOperators) => SetOperatorRightSelect<TValue, TQuery['_']['result']>)
    | SetOperatorRightSelect<TValue, TQuery['_']['result']>
) => OrderByPreserved<ReturnType<TQuery['union']>, TTable>;
type DynamicSelect<
  TQuery extends { readonly _: { readonly selection: unknown }; $dynamic: (...args: any[]) => any },
  TTable extends MySqlTable | Subquery,
> = Omit<
  ReturnType<TQuery['$dynamic']>,
  'groupBy' | 'orderBy' | 'having' | 'limit' | 'offset' | '$dynamic'
> & {
  groupBy(builder: (aliases: TQuery['_']['selection']) => OrderByValue | OrderByValue[]): DynamicSelect<TQuery, TTable>;
  groupBy(...columns: OrderByValue[]): DynamicSelect<TQuery, TTable>;
  orderBy(builder: OrderByCallback<TTable>): DynamicSelect<TQuery, TTable>;
  orderBy(...columns: OrderByInput[]): DynamicSelect<TQuery, TTable>;
  having(condition: SQL | undefined | ((aliases: TQuery['_']['selection']) => SQL | undefined)): DynamicSelect<TQuery, TTable>;
  limit(value: number | Placeholder): DynamicSelect<TQuery, TTable>;
  offset(value: number | Placeholder): DynamicSelect<TQuery, TTable>;
  $dynamic(): DynamicSelect<TQuery, TTable>;
};

type Joinable = MySqlTable | Subquery | MySqlViewBase | SQL;
type JoinConditionValues<TJoinedTable extends Joinable> = TJoinedTable extends MySqlTable
  ? MySqlCompareValues<TJoinedTable>
  : TJoinedTable extends Subquery<string, infer TFields>
    ? { [K in keyof TFields]?: unknown }
    : never;
type JoinConditionQuery<
  TTable extends MySqlTable | Subquery,
  TJoinedTable extends Joinable,
> = TJoinedTable extends MySqlTable
  ? Omit<SelectConditionQuery<TJoinedTable>, 't'> & { readonly t: TTable }
  : { readonly t: TTable; eq(values: JoinConditionValues<TJoinedTable>): SQL | undefined };
type JoinCondition<
  TTable extends MySqlTable | Subquery,
  TSelection extends FieldSet | undefined,
  TJoinedTable extends Joinable,
> = TJoinedTable extends MySqlTable | Subquery
  ? SQL | undefined | ((query: JoinConditionQuery<TTable, TJoinedTable>) => SQL | undefined)
  : SQL | undefined | ((aliases: SelectQueryBase<TTable, TSelection>['_']['selection']) => SQL | undefined);
type JoinedSelect<
  TTable extends MySqlTable | Subquery,
  TSelection extends FieldSet | undefined,
  TJoinedTable extends Joinable,
  TKind extends 'inner' | 'left' | 'right' | 'cross',
> = Omit<
  MySqlJoin<SelectQueryBase<TTable, TSelection>, false, TKind, TJoinedTable>,
  | 'where' | 'having' | 'groupBy' | 'orderBy' | 'limit' | 'offset'
  | keyof SelectJoinMethods<TTable, TSelection>
> &
  SelectJoinMethods<TTable, TSelection> & {
    where(condition: TableWhere<TTable>): Omit<JoinedSelect<TTable, TSelection, TJoinedTable, TKind>, 'where'>;
    having(condition: HavingCondition<TTable, TSelection>): Omit<JoinedSelect<TTable, TSelection, TJoinedTable, TKind>, 'having'>;
    groupBy(builder: GroupByCallback<TTable, TSelection>): Omit<JoinedSelect<TTable, TSelection, TJoinedTable, TKind>, 'groupBy'>;
    groupBy(...columns: OrderByValue[]): Omit<JoinedSelect<TTable, TSelection, TJoinedTable, TKind>, 'groupBy'>;
    orderBy(builder: OrderByCallback<TTable>): Omit<JoinedSelect<TTable, TSelection, TJoinedTable, TKind>, 'orderBy'>;
    orderBy(...columns: OrderByInput[]): Omit<JoinedSelect<TTable, TSelection, TJoinedTable, TKind>, 'orderBy'>;
    limit(value: number | Placeholder): Omit<JoinedSelect<TTable, TSelection, TJoinedTable, TKind>, 'limit'>;
    offset(value: number | Placeholder): Omit<JoinedSelect<TTable, TSelection, TJoinedTable, TKind>, 'offset'>;
  };
type SelectJoinMethods<TTable extends MySqlTable | Subquery, TSelection extends FieldSet | undefined> = {
  innerJoin<TJoinedTable extends Joinable>(
    table: TJoinedTable,
    on: JoinCondition<TTable, TSelection, TJoinedTable>
  ): JoinedSelect<TTable, TSelection, TJoinedTable, 'inner'>;
  leftJoin<TJoinedTable extends Joinable>(
    table: TJoinedTable,
    on: JoinCondition<TTable, TSelection, TJoinedTable>
  ): JoinedSelect<TTable, TSelection, TJoinedTable, 'left'>;
  rightJoin<TJoinedTable extends Joinable>(
    table: TJoinedTable,
    on: JoinCondition<TTable, TSelection, TJoinedTable>
  ): JoinedSelect<TTable, TSelection, TJoinedTable, 'right'>;
  crossJoin<TJoinedTable extends Joinable>(table: TJoinedTable): JoinedSelect<TTable, TSelection, TJoinedTable, 'cross'>;
};

export type SelectFrom<TTable extends MySqlTable | Subquery, TSelection extends FieldSet | undefined> = Omit<
  SelectQueryBase<TTable, TSelection>,
  | 'where' | 'having' | 'groupBy' | 'orderBy' | 'limit' | 'offset' | '$dynamic'
  | 'union' | 'unionAll' | 'intersect' | 'except'
  | keyof SelectJoinMethods<TTable, TSelection>
> &
  SelectJoinMethods<TTable, TSelection> & {
    $dynamic(): DynamicSelect<SelectQueryBase<TTable, TSelection>, TTable>;
    union: SelectSetOperatorMethod<SelectQueryBase<TTable, TSelection>, TTable>;
    unionAll: SelectSetOperatorMethod<SelectQueryBase<TTable, TSelection>, TTable>;
    intersect: SelectSetOperatorMethod<SelectQueryBase<TTable, TSelection>, TTable>;
    except: SelectSetOperatorMethod<SelectQueryBase<TTable, TSelection>, TTable>;
    where(condition: TableWhere<TTable>): Omit<SelectFrom<TTable, TSelection>, 'where'>;
    having(condition: HavingCondition<TTable, TSelection>): Omit<SelectFrom<TTable, TSelection>, 'having'>;
    groupBy(builder: GroupByCallback<TTable, TSelection>): Omit<SelectFrom<TTable, TSelection>, 'groupBy'>;
    groupBy(...columns: OrderByValue[]): Omit<SelectFrom<TTable, TSelection>, 'groupBy'>;
    orderBy(builder: OrderByCallback<TTable>): Omit<SelectFrom<TTable, TSelection>, 'orderBy'>;
    orderBy(...columns: OrderByInput[]): Omit<SelectFrom<TTable, TSelection>, 'orderBy'>;
    limit(value: number | Placeholder): Omit<SelectFrom<TTable, TSelection>, 'limit'>;
    offset(value: number | Placeholder): Omit<SelectFrom<TTable, TSelection>, 'offset'>;
  };

type FindResult<TTable extends MySqlTable, TSelection extends FieldSet | undefined> =
  Awaited<SelectFrom<TTable, TSelection>>[number] | undefined;

type WhereQueryEq<TTable extends MySqlTable> = {
  (values: MySqlCompareValues<TTable>): SQL | undefined;
  <N extends MySqlColumnName<TTable>>(name: N, value: Required<MySqlCompareValues<TTable>>[N]): SQL;
  <TAlias extends string, N extends MySqlColumnName<MySqlAliasTable<TTable, TAlias>>>(
    table: MySqlAliasTable<TTable, TAlias>,
    name: N,
    value: Required<MySqlCompareValues<MySqlAliasTable<TTable, TAlias>>>[N]
  ): SQL;
};

type QueryTable<TQuery> = TQuery extends { readonly t: infer TTable extends MySqlTable } ? TTable : never;

type WhereQuery<TQuery> = Omit<
  Pick<
  TQuery,
  Extract<
    keyof TQuery,
    | 't'
    | 'eq'
    | 'ne'
    | 'orEq'
    | 'orNe'
    | 'orGt'
    | 'orGte'
    | 'orLt'
    | 'orLte'
    | 'orInArray'
    | 'orNotInArray'
    | 'orBetween'
    | 'orNotBetween'
    | 'orLike'
    | 'orNotLike'
    | 'orIlike'
    | 'orNotIlike'
    | 'orIsNull'
    | 'orIsNotNull'
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
  >,
  'eq'
> & {
  eq: WhereQueryEq<QueryTable<TQuery>>;
};
type SelectConditionQuery<TSource extends MySqlTable | Subquery> = TSource extends MySqlTable
  ? TableConditionQuery<TSource>
  : TSource extends Subquery
    ? SubqueryConditionQuery<TSource>
    : never;
type BaseTableConditionQuery<TTable extends MySqlTable> = {
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
  and(options: MySqlAndConditions<TTable>): SQL | undefined;
  and(...conditions: (SQLWrapper | false | undefined)[]): SQL | undefined;
  or(options: MySqlOrConditions<TTable>): SQL | undefined;
  or(...conditions: (SQLWrapper | false | undefined)[]): SQL | undefined;
};
type TableConditionQuery<TTable extends MySqlTable> = BaseTableConditionQuery<TTable> & {
  [K in keyof Omit<BaseTableConditionQuery<TTable>, 't' | 'and' | 'or'> as `or${Capitalize<K & string>}`]:
    BaseTableConditionQuery<TTable>[K];
};
type BaseWhere<TQuery> = SQL | undefined | ((query: WhereQuery<TQuery>) => SQL | undefined);

type FieldSet = SelectedFields<MySqlColumn, MySqlTable>;
// normalizeFields는 이름이 붙은 SQL 표현식을 런타임에 .as(name)으로 변환한다.
// 빌더 타입도 이 변환을 반영해야 서브쿼리에서 해당 필드를 참조할 수 있다.
type AliasedSelection<T extends FieldSet> = {
  [K in keyof T]: T[K] extends SQL<infer D> ? SQL.Aliased<D> : T[K];
};
type MixedSelection<TTable extends MySqlTable> = Record<
  string,
  FieldSet[string] | MySqlColumnName<TTable> | SQLWrapper
>;
type ResolveMixedSelection<TTable extends MySqlTable, TSelection> = {
  [K in keyof TSelection]: TSelection[K] extends MySqlColumnName<TTable>
    ? TTable['_']['columns'][TSelection[K]]
    : TSelection[K] extends MySqlColumn
      ? TSelection[K]
      : TSelection[K] extends { _: { result: unknown } }
        ? SQL.Aliased<SelectBuilderFieldData<TSelection[K]>>
      : TSelection[K] extends SQLWrapper<infer TData>
        ? SQL.Aliased<TData>
        : Extract<TSelection[K], FieldSet[string]>;
};
type SelectBuilderFieldData<TBuilder> = TBuilder extends { _: { result: unknown } }
  ? Awaited<TBuilder> extends readonly (infer TRow)[]
    ? TRow extends Record<string, unknown>
      ? TRow[keyof TRow]
      : unknown
    : unknown
  : unknown;
type StringColumnSelection<TTable extends MySqlTable> = Record<string, keyof TTable['_']['columns'] & string>;
type StringColumnSelectionFields<TTable extends MySqlTable, TSelection extends StringColumnSelection<TTable>> = {
  [K in keyof TSelection]: TTable['_']['columns'][TSelection[K]] extends MySqlColumn<infer TConfig>
    ? SQL.Aliased<TConfig['data']>
    : never;
};
type FieldInput = FieldSet | false | undefined;
type SelectFieldInput<TTable extends MySqlTable> = FieldInput | MixedSelection<TTable>;
type FieldsQuery<TTable extends MySqlTable> = {
  readonly t: TTable;
  columns(): MySqlSelectedTableColumns<TTable>;
  columns<N extends MySqlColumnSelectionName<TTable>>(...names: N[]): MySqlSelectedNamedColumnUnion<TTable, N>;
  min: MySqlQuery<TTable>['min'];
  max: MySqlQuery<TTable>['max'];
};
type Fields<TQuery, TSelection> = TSelection | ((query: TQuery) => TSelection);
export type SelectInput<TTable extends MySqlTable> =
  | readonly (SelectFieldInput<TTable> | MySqlColumnSelectionName<TTable>)[]
  | MixedSelection<TTable>
  | ((query: FieldsQuery<TTable>) => FieldSet | readonly SelectFieldInput<TTable>[]);
export type ResolveSelectInput<TTable extends MySqlTable, T> = T extends undefined
  ? undefined
  : T extends (...args: never[]) => infer R
    ? R extends readonly SelectFieldInput<TTable>[]
      ? MergeSelectFields<TTable, R>
      : Extract<R, FieldSet>
    : T extends readonly (SelectFieldInput<TTable> | MySqlColumnSelectionName<TTable>)[]
      ? MergeSelectFields<TTable, SelectNamedFields<TTable, T>>
      : T extends StringColumnSelection<TTable>
        ? StringColumnSelectionFields<TTable, T>
        : ResolveMixedSelection<TTable, T>;

type SourceSelection<T extends MySqlTable | Subquery> = T extends MySqlTable
  ? MySqlSelectedTableColumns<T>
  : T extends Subquery
    ? T['_']['selectedFields']
    : never;
type SourceColumnName<T extends MySqlTable | Subquery> = T extends MySqlTable
  ? MySqlColumnName<T>
  : keyof SourceSelection<T> & string;
type SubqueryFieldsQuery<T extends Subquery> = {
  readonly t: T;
  columns(): T['_']['selectedFields'];
  columns<N extends keyof T['_']['selectedFields'] & string>(...names: N[]): Pick<T['_']['selectedFields'], N>;
  min<N extends keyof T['_']['selectedFields'] & string>(
    name: N
  ): SQL<SubqueryFieldData<T['_']['selectedFields'][N]> | null>;
  max<N extends keyof T['_']['selectedFields'] & string>(
    name: N
  ): SQL<SubqueryFieldData<T['_']['selectedFields'][N]> | null>;
};
export type SubquerySelectInput<T extends Subquery> =
  | readonly (FieldInput | (keyof T['_']['selectedFields'] & string))[]
  | Record<string, FieldSet[string] | (keyof T['_']['selectedFields'] & string) | SQLWrapper>
  | ((query: SubqueryFieldsQuery<T>) => FieldSet | readonly FieldInput[]);
export type ResolveSubquerySelectInput<T extends Subquery, V> = Extract<
  ResolvedSubqueryInput<T, V>,
  FieldSet | undefined
>;
type ResolvedSubqueryInput<T extends Subquery, V> = V extends undefined
  ? undefined
  : V extends (...args: never[]) => infer R
    ? R extends readonly FieldInput[]
      ? MergeFields<R>
      : Extract<R, FieldSet>
    : V extends readonly unknown[]
      ? MergeFields<{
          [I in keyof V]: V[I] extends keyof T['_']['selectedFields']
            ? Extract<Pick<T['_']['selectedFields'], V[I]>, FieldSet>
            : Extract<V[I], FieldInput>;
        }>
      : {
          [K in keyof V]: V[K] extends keyof T['_']['selectedFields']
            ? T['_']['selectedFields'][V[K]]
            : V[K] extends MySqlColumn | SQL | SQL.Aliased
              ? V[K]
              : V[K] extends SQLWrapper<infer D>
                ? SQL.Aliased<D>
                : Extract<V[K], FieldSet[string]>;
        };
type SubqueryFieldData<F> = F extends MySqlColumn
  ? F['_']['data'] | (F['_']['notNull'] extends true ? never : null)
  : F extends SQL<infer D> | SQL.Aliased<infer D>
    ? D
    : unknown;
type SubqueryValues<T extends Subquery> = {
  [K in keyof T['_']['selectedFields']]?: SubqueryFieldData<T['_']['selectedFields'][K]> | SQLWrapper;
};
type SubqueryArrayValues<T extends Subquery> = {
  [K in keyof T['_']['selectedFields']]?:
    | (NonNullable<SubqueryFieldData<T['_']['selectedFields'][K]>> | SQLWrapper)[]
    | SQLWrapper;
};
type SubqueryRangeValues<T extends Subquery> = {
  [K in keyof T['_']['selectedFields']]?: [
    NonNullable<SubqueryFieldData<T['_']['selectedFields'][K]>> | SQLWrapper,
    NonNullable<SubqueryFieldData<T['_']['selectedFields'][K]>> | SQLWrapper,
  ];
};
type SubqueryPatternValues<T extends Subquery> = {
  [
    K in keyof T['_']['selectedFields'] as NonNullable<SubqueryFieldData<T['_']['selectedFields'][K]>> extends string
      ? K
      : never
  ]?: string;
};
type SubqueryAtomicMethods<T extends Subquery> = Pick<
  {
    [K in 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte']: (values: SubqueryValues<T>) => SQL | undefined;
  } & { [K in 'inArray' | 'notInArray']: (values: SubqueryArrayValues<T>) => SQL | undefined } & {
    [K in 'between' | 'notBetween']: (values: SubqueryRangeValues<T>) => SQL | undefined;
  } & { [K in 'like' | 'notLike' | 'ilike' | 'notIlike']: (values: SubqueryPatternValues<T>) => SQL | undefined } & {
    isNull(names: SourceColumnName<T> | undefined | readonly (SourceColumnName<T> | undefined)[]): SQL | undefined;
    isNotNull(names: SourceColumnName<T> | undefined | readonly (SourceColumnName<T> | undefined)[]): SQL | undefined;
  },
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
>;
type SubqueryAtomicConditions<T extends Subquery> = {
  [K in keyof SubqueryAtomicMethods<T>]?: Parameters<SubqueryAtomicMethods<T>[K]>[0];
} & {
  [K in keyof SubqueryAtomicMethods<T> as `or${Capitalize<K & string>}`]?: Parameters<SubqueryAtomicMethods<T>[K]>[0];
};
type SubqueryAndConditions<T extends Subquery> = SubqueryAtomicConditions<T> & {
  or?: SubqueryOrConditions<T>;
};
type SubqueryOrConditions<T extends Subquery> = SubqueryAtomicConditions<T> & {
  and?: SubqueryAndConditions<T>;
};
type BaseSubqueryConditionQuery<T extends Subquery> = {
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
  and(values: SubqueryAndConditions<T>): SQL | undefined;
  and(...conditions: (SQLWrapper | false | undefined)[]): SQL | undefined;
  or(values: SubqueryOrConditions<T>): SQL | undefined;
  or(...conditions: (SQLWrapper | false | undefined)[]): SQL | undefined;
};
type SubqueryConditionQuery<T extends Subquery> = BaseSubqueryConditionQuery<T> & {
  [K in keyof Omit<BaseSubqueryConditionQuery<T>, 't' | 'and' | 'or'> as `or${Capitalize<K & string>}`]:
    BaseSubqueryConditionQuery<T>[K];
};
type NamedFields<TTable extends MySqlTable, T extends readonly (FieldInput | MySqlColumnSelectionName<TTable>)[]> = {
  [I in keyof T]: T[I] extends MySqlColumnSelectionName<TTable>
    ? MySqlSelectedNamedColumns<TTable, readonly [T[I]]>
    : Extract<T[I], FieldInput>;
};
type SelectNamedFields<
  TTable extends MySqlTable,
  T extends readonly (SelectFieldInput<TTable> | MySqlColumnSelectionName<TTable>)[],
> = {
  [I in keyof T]: T[I] extends MySqlColumnSelectionName<TTable>
    ? MySqlSelectedNamedColumns<TTable, readonly [T[I]]>
    : T[I] extends SelectFieldInput<TTable>
      ? T[I]
      : never;
};
type ResolveSelectField<TTable extends MySqlTable, TField> = TField extends FieldSet
  ? TField
  : TField extends MixedSelection<TTable>
    ? ResolveMixedSelection<TTable, TField>
    : never;
type MergeSelectFields<TTable extends MySqlTable, T extends readonly unknown[], Result = {}> = T extends readonly [
  infer First,
  ...infer Rest,
]
  ? MergeSelectFields<
      TTable,
      Rest,
      First extends FieldSet | MixedSelection<TTable> ? Omit<Result, keyof First> & ResolveSelectField<TTable, First> : Result
    >
  : number extends T['length']
    ? ResolveSelectField<TTable, Exclude<T[number], false | undefined>>
    : Result extends unknown
      ? { [P in keyof Result]: Result[P] }
      : never;
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

const normalizeFields = (fields: unknown, table?: MySqlTable | Subquery): FieldSet | undefined => {
  if (fields === undefined) return undefined;
  const groups = Array.isArray(fields) ? fields : [fields];
  const result: FieldSet = {};
  for (const group of groups) {
    if (Array.isArray(fields) && (group === false || group === undefined)) continue;
    if (Array.isArray(fields) && typeof group === 'string') {
      if (!table) throw new Error('fields: a table is required for column-name selections.');
      Object.assign(result, sourceColumns(table, [group]));
      continue;
    }
    if (typeof group !== 'object' || group === null || Array.isArray(group) || isTable(group) || is(group, SQL)) {
      throw new Error('fields: expected a selection object or an array of selection objects.');
    }
    Object.assign(result, group);
  }
  for (const [name, field] of Object.entries(result)) {
    if (typeof field === 'string') {
      const column = table && (is(table, Subquery) ? sourceColumns(table) : getTableColumns(table))[field];
      if (!column) throw new Error(`select: unknown column "${field}".`);
      const decoder = is(column, MySqlColumn)
        ? column
        : is(column, SQL.Aliased)
          ? (column.sql as unknown as { decoder: { mapFromDriverValue(value: unknown): unknown } }).decoder
          : (value: unknown) => value;
      result[name] = sql`${column}`.mapWith(decoder).as(name);
      continue;
    }
    if (is(field, SQL)) {
      result[name] = field.as(name);
      continue;
    }
    if (is(field, SQL.Aliased)) continue;
    if (is(field, MySqlColumn) && field.name !== name) {
      result[name] = sql`${field}`.mapWith(field).as(name);
      continue;
    }
    if (typeof field === 'object' && field !== null && 'getSQL' in field && typeof field.getSQL === 'function') {
      result[name] = sql`${field}`.as(name);
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

function sourceColumns(source: MySqlTable | Subquery, names: string[] = []): FieldSet {
  return is(source, Subquery)
    ? (TableColumns(source, ...names) as FieldSet)
    : TableColumns(source, ...(names as MySqlColumnSelectionName<MySqlTable>[]));
}
