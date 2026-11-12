import type { MySqlTable } from 'drizzle-orm/mysql-core';
import type { InferSelectModel, SQLWrapper } from 'drizzle-orm';
export type MySqlCompareValues<T extends MySqlTable> = {
    [P in MySqlColumnName<T>]?: InferSelectModel<T>[P] | SQLWrapper;
};
export type MySqlColumnName<T extends MySqlTable> = keyof T['_']['columns'] & string;
export type MySqlArrayCompareValues<T extends MySqlTable> = {
    [P in MySqlColumnName<T>]?: (NonNullable<InferSelectModel<T>[P]> | SQLWrapper)[] | SQLWrapper;
};
export type MySqlRangeCompareValues<T extends MySqlTable> = {
    [P in MySqlColumnName<T>]?: [
        NonNullable<InferSelectModel<T>[P]> | SQLWrapper,
        NonNullable<InferSelectModel<T>[P]> | SQLWrapper
    ];
};
export type MySqlPatternCompareValues<T extends MySqlTable> = {
    [P in MySqlColumnName<T> as NonNullable<InferSelectModel<T>[P]> extends string ? P : never]?: string;
};
export type MySqlNullConditionInput<T extends MySqlTable> = MySqlColumnName<T> | undefined | readonly (MySqlColumnName<T> | undefined)[];
