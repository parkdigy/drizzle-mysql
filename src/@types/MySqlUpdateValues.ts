import type { MySqlTable } from 'drizzle-orm/mysql-core/table';
import type { MySqlUpdateSetSource } from 'drizzle-orm/mysql-core/query-builders/update';

export type MySqlUpdateValues<
  TTable extends MySqlTable,
  TBlocked extends keyof MySqlUpdateSetSource<TTable> = never,
  TRequired extends Exclude<keyof MySqlUpdateSetSource<TTable>, TBlocked> = never,
> = Omit<MySqlUpdateSetSource<TTable>, TBlocked | TRequired> & {
  [P in TBlocked]?: never;
} & {
  [P in TRequired]-?: Exclude<MySqlUpdateSetSource<TTable>[P], undefined>;
};
