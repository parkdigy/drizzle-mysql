import type { MySqlTable } from 'drizzle-orm/mysql-core';
import type { InferSelectModel, SQLWrapper } from 'drizzle-orm';

export type MySqlCompareValues<T extends MySqlTable> = {
  [P in keyof InferSelectModel<T>]?: InferSelectModel<T>[P] | SQLWrapper;
};

export type MySqlColumnName<T extends MySqlTable> = keyof T['_']['columns'] & string;

export type MySqlArrayCompareValues<T extends MySqlTable> = {
  [P in keyof InferSelectModel<T>]?: (NonNullable<InferSelectModel<T>[P]> | SQLWrapper)[];
};

export type MySqlRangeCompareValues<T extends MySqlTable> = {
  [P in keyof InferSelectModel<T>]?: [NonNullable<InferSelectModel<T>[P]>, NonNullable<InferSelectModel<T>[P]>];
};

export type MySqlPatternCompareValues<T extends MySqlTable> = {
  [P in keyof InferSelectModel<T> as NonNullable<InferSelectModel<T>[P]> extends string ? P : never]?: string;
};

export type MySqlNullConditionInput<T extends MySqlTable> =
  MySqlColumnName<T> | undefined | readonly (MySqlColumnName<T> | undefined)[];
