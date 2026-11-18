import type { MySqlTable } from 'drizzle-orm/mysql-core';
import type {
  MySqlArrayCompareValues,
  MySqlCompareValues,
  MySqlNullConditionInput,
  MySqlPatternCompareValues,
  MySqlRangeCompareValues,
} from './common';

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

type OrConditions<T extends MySqlTable> = {
  [K in keyof BaseConditions<T> as `or${Capitalize<K>}`]?: BaseConditions<T>[K];
};

type AtomicConditions<T extends MySqlTable> = BaseConditions<T> & OrConditions<T>;

export type MySqlAndConditions<T extends MySqlTable> = AtomicConditions<T> & {
  or?: MySqlOrConditions<T>;
};

export type MySqlOrConditions<T extends MySqlTable> = AtomicConditions<T> & {
  and?: MySqlAndConditions<T>;
};

export type MySqlConditions<T extends MySqlTable> = AtomicConditions<T> & {
  and?: MySqlAndConditions<T>;
  or?: MySqlOrConditions<T>;
};
