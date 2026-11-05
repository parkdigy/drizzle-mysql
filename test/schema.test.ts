import { sql } from 'drizzle-orm';
import { getTableConfig, getViewConfig } from 'drizzle-orm/mysql-core';
import type { AnyMySqlColumn, MySqlTable } from 'drizzle-orm/mysql-core';
import * as api from '../src';

test('공개 컬럼 빌더로 MySQL 스키마를 정의한다', () => {
  const custom = api.customType<{ data: string }>({ dataType: () => 'text' });
  const columns = {
    bigint: api.bigint({ mode: 'bigint' }),
    binary: api.binary({ length: 16 }),
    blob: api.blob(),
    boolean: api.boolean(),
    char: api.char({ length: 10 }),
    custom: custom(),
    date: api.date(),
    datetime: api.datetime(),
    decimal: api.decimal({ precision: 10, scale: 2 }),
    double: api.double(),
    float: api.float(),
    int: api.int(),
    json: api.json().$type<{ enabled: boolean }>(),
    longblob: api.longblob(),
    longtext: api.longtext(),
    mediumblob: api.mediumblob(),
    mediumint: api.mediumint(),
    mediumtext: api.mediumtext(),
    mysqlEnum: api.mysqlEnum(['active', 'inactive']),
    real: api.real(),
    serial: api.serial(),
    smallint: api.smallint(),
    text: api.text(),
    time: api.time(),
    timestamp: api.timestamp(),
    tinyblob: api.tinyblob(),
    tinyint: api.tinyint(),
    tinytext: api.tinytext(),
    varbinary: api.varbinary({ length: 16 }),
    varchar: api.varchar({ length: 100 }),
    year: api.year(),
  };
  const table = api.mysqlTable('column_types', columns);
  const config = getTableConfig(table);
  expect(config.columns.map((column) => column.name)).toEqual(Object.keys(columns));
  expect(table.decimal.getSQLType()).toBe('decimal(10,2)');
  const value: typeof table.$inferInsert = { bigint: 1n, json: { enabled: true }, mysqlEnum: 'active' };
  expect(value.json).toEqual({ enabled: true });
});

test('공개 API로 인덱스와 키 및 제약조건을 정의한다', () => {
  const parent = api.mysqlTable('parents', { id: api.int().primaryKey() });
  const table = api.mysqlTable(
    'children',
    {
      id: api.int().notNull(),
      parent_id: api.int(),
      name: api.varchar({ length: 100 }),
      email: api.varchar({ length: 100 }),
      age: api.int(),
      manager_id: api.int().references((): AnyMySqlColumn => table.id),
    },
    (t) => [
      api.primaryKey({ columns: [t.id, t.parent_id] }),
      api.foreignKey({ columns: [t.parent_id], foreignColumns: [parent.id] }),
      api.index('children_name_idx').on(t.name),
      api.uniqueIndex('children_email_idx').on(t.email),
      api.unique('children_name_parent_unique').on(t.name, t.parent_id),
      api.check('children_age_check', sql`${t.age} >= 0`),
    ]
  );
  const typedTable: MySqlTable = table;
  const config = getTableConfig(typedTable);
  expect(config.primaryKeys).toHaveLength(1);
  expect(config.foreignKeys).toHaveLength(2);
  expect(config.indexes).toHaveLength(2);
  expect(config.uniqueConstraints).toHaveLength(1);
  expect(config.checks).toHaveLength(1);
});

test('공개 API로 접두사 테이블과 스키마 및 뷰를 정의한다', () => {
  const table = api.mysqlTableCreator((name) => `app_${name}`)('users', { id: api.int() });
  expect(getTableConfig(table).name).toBe('app_users');
  for (const createSchema of [api.mysqlSchema, api.mysqlDatabase]) {
    const schema = createSchema('app');
    expect(getTableConfig(schema.table('users', { id: api.int() })).schema).toBe('app');
  }
  const view = api.mysqlView('existing_users', { id: api.int() }).existing();
  expect(getViewConfig(view)).toMatchObject({ name: 'existing_users', isExisting: true });
});
