import type { MySqlTable } from 'drizzle-orm/mysql-core';
import type { MySqlArrayCompareValues, MySqlCompareValues, MySqlNullConditionInput, MySqlPatternCompareValues, MySqlRangeCompareValues } from './common.js';
type BaseConditions<T extends MySqlTable> = {
    eq?: MySqlCompareValues<T>;
    ne?: MySqlCompareValues<T>;
    gt?: MySqlCompareValues<T>;
    gte?: MySqlCompareValues<T>;
    lt?: MySqlCompareValues<T>;
    lte?: MySqlCompareValues<T>;
    inArray?: MySqlArrayCompareValues<T>;
    notInArray?: MySqlArrayCompareValues<T>;
    between?: MySqlRangeCompareValues<T>;
    notBetween?: MySqlRangeCompareValues<T>;
    like?: MySqlPatternCompareValues<T>;
    notLike?: MySqlPatternCompareValues<T>;
    ilike?: MySqlPatternCompareValues<T>;
    notIlike?: MySqlPatternCompareValues<T>;
    isNull?: MySqlNullConditionInput<T>;
    isNotNull?: MySqlNullConditionInput<T>;
};
export type MySqlConditions<T extends MySqlTable> = BaseConditions<T> & {
    [K in keyof BaseConditions<T> as `or${Capitalize<K>}`]?: BaseConditions<T>[K];
};
export {};
