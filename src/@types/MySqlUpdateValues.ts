import type { MySqlTable } from 'drizzle-orm/mysql-core/table';
import type { MySqlUpdateSetSource } from 'drizzle-orm/mysql-core/query-builders/update';
import type { TablePolicies } from '../mysqlTable';

type Blocked<T extends MySqlTable> = {
  [K in keyof MySqlUpdateSetSource<T>]-?: K extends keyof TablePolicies<T>
    ? TablePolicies<T>[K] extends { timestamp: string } | { update: 'blocked' }
      ? K
      : TablePolicies<T>[K] extends { update: 'allowed' | 'required' }
        ? never
        : K extends keyof T['_']['columns']
          ? T['_']['columns'][K]['_']['isAutoincrement'] extends true
            ? K
            : never
          : never
    : K extends keyof T['_']['columns']
      ? T['_']['columns'][K]['_']['isAutoincrement'] extends true
        ? K
        : never
      : never;
}[keyof MySqlUpdateSetSource<T>] &
  keyof MySqlUpdateSetSource<T>;
type RequiredKeys<T extends MySqlTable> = {
  [K in keyof MySqlUpdateSetSource<T>]-?: K extends keyof TablePolicies<T>
    ? TablePolicies<T>[K] extends { update: 'required' }
      ? K
      : never
    : never;
}[keyof MySqlUpdateSetSource<T>] &
  keyof MySqlUpdateSetSource<T>;

export type MySqlUpdateValues<
  T extends MySqlTable,
  B extends keyof MySqlUpdateSetSource<T> = never,
  R extends Exclude<keyof MySqlUpdateSetSource<T>, B | Blocked<T>> = never,
> = Omit<MySqlUpdateSetSource<T>, B | Blocked<T> | R | RequiredKeys<T>> & { [K in B | Blocked<T>]?: never } & {
  [K in Exclude<R | RequiredKeys<T>, B | Blocked<T>>]-?: Exclude<MySqlUpdateSetSource<T>[K], undefined>;
};
