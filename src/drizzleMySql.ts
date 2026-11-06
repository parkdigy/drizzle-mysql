import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { count, defineRelations, is, SQL, sql, type Subquery } from 'drizzle-orm';
import type { MySqlTable } from 'drizzle-orm/mysql-core';
import { AsyncLocalStorage } from 'node:async_hooks';
import * as native from 'drizzle-orm';
import { createAlias } from './alias';
import { createConditions } from './conditions';
import { TableColumns } from './columns';
import { MySqlQuery } from './MySqlQuery';

export function drizzleMySql<TSchema extends Record<string, MySqlTable>>(options: {
  url: string;
  schema: TSchema;
  timestamp?: () => unknown;
}) {
  const pool = mysql.createPool({ uri: options.url });
  const raw = drizzle({ client: pool, relations: defineRelations(options.schema) });
  type Transaction = Parameters<Parameters<typeof raw.transaction>[0]>[0];
  const context = new AsyncLocalStorage<Transaction>();
  const current = () => context.getStore() ?? raw;
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
    const [[{ total }], data] = await Promise.all([
      current().select({ total: count() }).from(builder.as('a')),
      builder.limit(limit).offset(offset),
    ]);
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
    asc: native.asc,
    desc: native.desc,
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
    sql,
    sqlNumber: (value: SQL | number) => (is(value, SQL) ? value : sql`${value}`).mapWith(Number),
    sqlString: (value: SQL | string) => (is(value, SQL) ? value : sql`${value}`).mapWith(String),
    sqlBoolean: (value: SQL | boolean) =>
      (is(value, SQL) ? value : sql`${value}`).mapWith((v) => v === true || v === 1),
    current,
    query: <TTable extends TSchema[keyof TSchema]>(table: TTable) =>
      new MySqlQuery(table, current, () => {
        if (!options.timestamp) throw new Error('timestamp generator is not configured');
        return options.timestamp();
      }),
    trans,
    paginate,
    close: () => pool.end(),
  };
}
