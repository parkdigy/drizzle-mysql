import mysql from 'mysql2/promise';
import type { PoolOptions } from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { count, defineRelations, getTableColumns, is, isTable, SQL, sql, Subquery } from 'drizzle-orm';
import { alias, type MySqlTable } from 'drizzle-orm/mysql-core';
import { AsyncLocalStorage } from 'node:async_hooks';
import * as native from 'drizzle-orm';
import { createAlias, type MySqlAliases } from './alias';
import { createConditions, type MySqlSchemaConditions } from './conditions';
import { TableColumns } from './columns';
import type { MySqlColumnName } from './@types';
import {
  MySqlQuery,
  type SelectFrom,
  type SelectInput,
  type ResolveSelectInput,
  type SubquerySelectInput,
  type ResolveSubquerySelectInput,
} from './MySqlQuery';

export type DrizzleMySqlOptions<TSchema extends Record<string, MySqlTable>> = {
  schema: TSchema;
  getTimestamp?: () => unknown;
} & (({ url: string } & Omit<PoolOptions, 'uri'>) | (PoolOptions & { uri?: never; url?: never }));

type MySqlConnection<TSchema extends Record<string, MySqlTable>> = ReturnType<typeof createConnection<TSchema>>;

type SelectTable<TSchema, TSource> = TSource extends MySqlTable
  ? TSource
  : TSource extends keyof TSchema
    ? Extract<TSchema[TSource], MySqlTable>
    : never;

interface MySqlDatabaseHelpers<TSchema extends Record<string, MySqlTable>> extends MySqlNativeHelpers {
  s: TSchema;
  a: MySqlAliases<TSchema>;
  columns: typeof TableColumns;
  alias: typeof alias;
  sql: typeof sql;
  sqlNumber(value: SQL | number): SQL<number>;
  sqlString(value: SQL | string): SQL<string>;
  sqlBoolean(value: SQL | boolean): SQL<boolean>;
  current: MySqlConnection<TSchema>['current'];
  trans: MySqlConnection<TSchema>['trans'];
  paginate: MySqlConnection<TSchema>['paginate'];
  close: MySqlConnection<TSchema>['close'];
  select<
    TSource extends (keyof TSchema & string) | MySqlTable,
    const TArgs extends readonly [fields?: SelectInput<SelectTable<TSchema, TSource>>],
  >(
    table: TSource,
    ...args: TArgs
  ): SelectFrom<SelectTable<TSchema, TSource>, ResolveSelectInput<SelectTable<TSchema, TSource>, TArgs[0]>>;
  select<TSource extends Subquery, const TArgs extends readonly [fields?: SubquerySelectInput<TSource>]>(
    source: TSource,
    ...args: TArgs
  ): SelectFrom<TSource, ResolveSubquerySelectInput<TSource, TArgs[0]>>;
  query<TTable extends MySqlTable>(table: TTable): MySqlQuery<TTable>;
}

type OrderByColumn = Parameters<typeof native.asc>[0];
type AliasOrderByHelper = {
  <TTable extends MySqlTable>(table: TTable, name: MySqlColumnName<TTable>): SQL;
  <TTable extends MySqlTable>(
    table: TTable,
    first: MySqlColumnName<TTable>,
    second: MySqlColumnName<TTable>,
    ...rest: MySqlColumnName<TTable>[]
  ): SQL[];
};
type MultiColumnOrderHelper = {
  (column: OrderByColumn): SQL;
  (first: OrderByColumn, second: OrderByColumn, ...rest: OrderByColumn[]): SQL[];
} & AliasOrderByHelper;

type MySqlNativeHelpers = Omit<
  Pick<
    typeof native,
    | 'count'
    | 'countDistinct'
    | 'avg'
    | 'avgDistinct'
    | 'sum'
    | 'sumDistinct'
    | 'max'
    | 'min'
    | 'not'
    | 'exists'
    | 'notExists'
    | 'arrayContains'
    | 'arrayContained'
    | 'arrayOverlaps'
  >,
  'asc' | 'desc'
> & {
  asc: MultiColumnOrderHelper;
  desc: MultiColumnOrderHelper;
};

const createOrderByHelper = (direction: (column: OrderByColumn) => SQL): MultiColumnOrderHelper => {
  const implementation = (...args: [OrderByColumn | MySqlTable, ...(OrderByColumn | string)[]]) => {
    let columns: OrderByColumn[];
    if (isTable(args[0])) {
      const [table, ...names] = args;
      const tableColumns = getTableColumns(table);
      columns = (names as string[]).map((name) => {
        const column = tableColumns[name];
        if (!column) throw new Error(`orderBy: unknown column "${name}".`);
        return column;
      });
    } else {
      columns = args as OrderByColumn[];
    }
    const orders = columns.map(direction);
    return orders.length === 1 ? orders[0] : orders;
  };
  return implementation as MultiColumnOrderHelper;
};

const asc = createOrderByHelper(native.asc);
const desc = createOrderByHelper(native.desc);

export type DrizzleMySql<TSchema extends Record<string, MySqlTable>> = MySqlDatabaseHelpers<TSchema> &
  MySqlSchemaConditions<TSchema>;

function createConnection<TSchema extends Record<string, MySqlTable>>(options: DrizzleMySqlOptions<TSchema>) {
  const { url, schema, getTimestamp: configuredTimestamp, ...connectionOptions } = options;
  const pool = mysql.createPool(url ? { ...connectionOptions, uri: url } : connectionOptions);
  const raw = drizzle({ client: pool, relations: defineRelations(schema) });
  type Transaction = Parameters<Parameters<typeof raw.transaction>[0]>[0];
  const context = new AsyncLocalStorage<Transaction>();
  const timezone = connectionOptions.timezone ?? (url ? new URL(url).searchParams.get('timezone') : null);
  const timestampGenerator = configuredTimestamp ?? (() => new Date());
  const getTimestamp = () => {
    const now = timestampGenerator();
    if (timezone !== 'local' || !(now instanceof Date)) return now;
    // Drizzle encodes Date values as UTC before mysql2 can apply its timezone option.
    const pad = (value: number, length = 2) => String(value).padStart(length, '0');
    const local = `${pad(now.getFullYear(), 4)}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${pad(now.getMilliseconds(), 3)}`;
    return sql`${local}`;
  };
  const current = Object.assign(() => context.getStore() ?? raw, { getTimestamp });
  const trans = <T>(callback: () => Promise<T>): Promise<T> => {
    const parent = context.getStore();
    const execute = (tx: Transaction) => context.run(tx, callback);
    return parent ? parent.transaction(execute) : raw.transaction(execute);
  };
  const paginate = async <TResult extends unknown[]>(
    builder: {
      limit(limit: number): { offset(offset: number): PromiseLike<TResult> };
      as(alias: string): Subquery;
    },
    page: number,
    limit: number
  ) => {
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1) {
      throw new RangeError('page and limit must be positive integers');
    }
    const offset = (page - 1) * limit;
    const [[countRow], data] = await Promise.all([
      current().select({ total: count() }).from(builder.as('a')),
      builder.limit(limit).offset(offset),
    ]);
    const total = countRow?.total ?? 0;
    return {
      data,
      paging: {
        current_page: page,
        per_page: limit,
        last_page: Math.ceil(total / limit),
        total,
        from: offset,
        to: offset + data.length,
      },
    };
  };
  return {
    current,
    trans,
    paginate,
    close: () => pool.end(),
  };
}

export function drizzleMySql<TSchema extends Record<string, MySqlTable>>(
  options: DrizzleMySqlOptions<TSchema>
): DrizzleMySql<TSchema> {
  const connection = createConnection(options);
  function select(tableOrName: string | MySqlTable | Subquery, fields?: unknown): unknown {
    const table = typeof tableOrName === 'string' ? options.schema[tableOrName] : tableOrName;
    if (!table) throw new Error(`select: unknown table "${tableOrName}".`);
    if (is(table, Subquery)) {
      return new MySqlQuery(table as unknown as MySqlTable, connection.current).select(
        table,
        fields as SubquerySelectInput<Subquery>
      );
    }
    return new MySqlQuery(table, connection.current).select(fields as never);
  }
  return {
    select: select as MySqlDatabaseHelpers<TSchema>['select'],
    asc,
    desc,
    count: native.count,
    countDistinct: native.countDistinct,
    avg: native.avg,
    avgDistinct: native.avgDistinct,
    sum: native.sum,
    sumDistinct: native.sumDistinct,
    max: native.max,
    min: native.min,
    not: native.not,
    exists: native.exists,
    notExists: native.notExists,
    arrayContains: native.arrayContains,
    arrayContained: native.arrayContained,
    arrayOverlaps: native.arrayOverlaps,
    s: options.schema,
    a: createAlias(options.schema),
    ...createConditions(options.schema),
    columns: TableColumns,
    alias,
    sql,
    sqlNumber: (value: SQL | number) => (is(value, SQL) ? value : sql`${value}`).mapWith(Number),
    sqlString: (value: SQL | string) => (is(value, SQL) ? value : sql`${value}`).mapWith(String),
    sqlBoolean: (value: SQL | boolean) =>
      (is(value, SQL) ? value : sql`${value}`).mapWith((v) => v === true || v === 1),
    ...connection,
    query: <TTable extends MySqlTable>(table: TTable): MySqlQuery<TTable> => new MySqlQuery(table, connection.current),
  };
}
