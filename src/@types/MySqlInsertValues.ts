import type { MySqlTable } from 'drizzle-orm/mysql-core/table';
import type { MySqlInsertValue as InsertValue } from 'drizzle-orm/mysql-core/query-builders/insert';

export type MySqlInsertValues<TTable extends MySqlTable, TBlocked extends keyof InsertValue<TTable> = never> = [
  TBlocked,
] extends [never]
  ? InsertValue<TTable>
  : Omit<InsertValue<TTable>, TBlocked> & {
      [P in TBlocked]?: never;
    };
