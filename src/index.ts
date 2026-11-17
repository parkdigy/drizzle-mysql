import { drizzleMySql } from './drizzleMySql';

export default drizzleMySql;

export * from './@types/index';
export * from './columns';
export * from './aggregates';
export { mysqlTable, type TablePolicy } from './mysqlTable';
export * from './conditions';
export { coalesce } from './coalesce';
export * from './drizzleMySql';
export * from './MySqlQuery';
export type { MySqlAliases } from './alias';

export {
  asc,
  desc,
  count,
  countDistinct,
  max,
  min,
  not,
  exists,
  notExists,
  type InferColumnsDataTypes,
} from 'drizzle-orm';

export {
  mysqlTableCreator,
  mysqlSchema,
  mysqlDatabase,
  mysqlView,
  bigint,
  binary,
  blob,
  boolean,
  char,
  customType,
  date,
  datetime,
  decimal,
  double,
  float,
  int,
  json,
  longblob,
  longtext,
  mediumblob,
  mediumint,
  mediumtext,
  mysqlEnum,
  real,
  serial,
  smallint,
  text,
  time,
  timestamp,
  tinyblob,
  tinyint,
  tinytext,
  varbinary,
  varchar,
  year,
  check,
  foreignKey,
  index,
  primaryKey,
  unique,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
