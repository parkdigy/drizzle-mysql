import { SQL, sql } from 'drizzle-orm';

import {
  drizzleMySql,
  datetime,
  int,
  varchar,
  mysqlTable,
  MySqlQuery,
  type MySqlAddValues,
  type MySqlEditValues,
} from '../src';
import type { MySql2Database } from 'drizzle-orm/mysql2';

const table = mysqlTable('policy_test', {
  id: int().autoincrement().primaryKey(),
  allowed: int().autoincrement().insertAllowed().updateAllowed(),
  name: varchar({ length: 50 }).notNull(),
  secret: varchar({ length: 50 }).insertBlocked(),
  locked: int().updateBlocked(),
  required: int().updateRequired(),
  created: varchar({ length: 50 }).notNull().createdAt(),
  updated: varchar({ length: 50 }).notNull().updatedAt(),
});
if (false) {
  const validInsert: MySqlAddValues<typeof table> = { name: 'x', allowed: 3 };
  const validUpdate: MySqlEditValues<typeof table> = { required: 1, allowed: 2 };
  // @ts-expect-error 자동 증가 컬럼은 기본적으로 입력이 금지된다.
  const badInsert: MySqlAddValues<typeof table> = { name: 'x', id: 1 };
  // @ts-expect-error 지정한 컬럼은 입력이 금지된다.
  const badSecret: MySqlAddValues<typeof table> = { name: 'x', secret: 'x' };
  const validTime: MySqlAddValues<typeof table> = { name: 'x', created: 'x', updated: 'y' };
  // @ts-expect-error 시각 컬럼의 데이터 타입과 일치해야 한다.
  const badTime: MySqlAddValues<typeof table> = { name: 'x', created: 1 };
  const validUpdateTime: MySqlEditValues<typeof table> = { required: 1, updated: 'x' };
  // @ts-expect-error 생성 시각은 수정할 수 없다.
  const badUpdateTime: MySqlEditValues<typeof table> = { required: 1, created: 'x' };
  // @ts-expect-error 수정 필수 컬럼이 누락되었다.
  const badUpdate: MySqlEditValues<typeof table> = { name: 'x' };
  // @ts-expect-error 수정 금지 컬럼이다.
  const badLocked: MySqlEditValues<typeof table> = { required: 1, locked: 2 };
  // @ts-expect-error 금지 컬럼은 undefined로도 지정할 수 없다.
  const undefinedCreated: MySqlEditValues<typeof table> = { required: 1, created: undefined };
  // @ts-expect-error 명시적인 수정 금지 컬럼도 타입에서 제외한다.
  const undefinedLocked: MySqlEditValues<typeof table> = { required: 1, locked: undefined };
  // @ts-expect-error 등록 금지 컬럼은 undefined로도 지정할 수 없다.
  const undefinedSecret: MySqlAddValues<typeof table> = { name: 'x', secret: undefined };
  // @ts-expect-error 자동 증가 컬럼도 타입에서 제외한다.
  const undefinedId: MySqlAddValues<typeof table> = { name: 'x', id: undefined };
  // @ts-expect-error 제네릭으로 지정한 금지 컬럼도 타입에서 제외한다.
  const undefinedCustom: MySqlEditValues<typeof table, 'name'> = { required: 1, name: undefined };
  // @ts-expect-error 제네릭으로 지정한 등록 금지 컬럼도 타입에서 제외한다.
  const undefinedCustomInsert: MySqlAddValues<typeof table, 'name'> = { name: undefined };
  // @ts-expect-error 금지 컬럼은 keyof에도 포함되지 않는다.
  const blockedUpdateKey: keyof MySqlEditValues<typeof table> = 'created';
  // @ts-expect-error 등록 금지 컬럼은 keyof에도 포함되지 않는다.
  const blockedInsertKey: keyof MySqlAddValues<typeof table> = 'secret';
  void [
    undefinedCreated, undefinedLocked, undefinedSecret, undefinedId, undefinedCustom, undefinedCustomInsert,
    blockedUpdateKey, blockedInsertKey,
  ];
  void [validInsert, validUpdate, validTime, validUpdateTime, badInsert, badSecret, badTime, badUpdateTime, badUpdate, badLocked];
  drizzleMySql({ url: 'mysql://localhost/example', schema: { table } });
  // @ts-expect-error 이전 timestamp 옵션은 지원하지 않는다.
  drizzleMySql({ url: 'mysql://localhost/example', schema: { table }, timestamp: () => 'now' });
}

test.each(['explicit', 'inherited'] as const)('컬럼 정책과 %s 시각을 등록 및 수정에 적용한다', async (mode) => {
  const inserted: unknown[] = [];
  const updated: unknown[] = [];
  const fake = {
    insert: () => ({
      values: (value: unknown) => {
        inserted.push(value);
        return { $returningId: async () => [{ id: 7 }] };
      },
    }),
    update: () => ({
      set: (value: unknown) => {
        updated.push(value);
        return { where: () => Promise.resolve() };
      },
    }),
  } as unknown as MySql2Database;
  const getTimestamp = jest.fn(() => 'now');
  const current = Object.assign(() => fake, { getTimestamp });
  const query = new MySqlQuery(table, current, mode === 'explicit' ? getTimestamp : undefined);
  if (false) {
    // @ts-expect-error add 호출에서도 금지 컬럼을 제외한다.
    query.add({ name: 'x', secret: undefined });
    // @ts-expect-error 배열 add에서도 금지 컬럼을 제외한다.
    query.add([{ name: 'x', id: undefined }]);
    // @ts-expect-error edit 호출에서도 생성 시각 컬럼을 제외한다.
    query.edit({ required: 1, created: undefined }, sql`1 = 1`);
    // @ts-expect-error 기본 키 수정 호출에도 동일한 타입을 적용한다.
    query.editByPrimaryKey({ required: 1, locked: undefined }, 1);
  }
  await query.add({ name: 'x', allowed: 3 });
  expect(inserted).toEqual([{ name: 'x', allowed: 3, created: 'now', updated: 'now' }]);
  expect(getTimestamp).toHaveBeenCalledTimes(1);
  await query.edit({ required: 1 }, sql`1 = 1`);
  expect(updated).toEqual([{ required: 1, updated: 'now' }]);
  expect(getTimestamp).toHaveBeenCalledTimes(2);
  expect(() => query.edit({ required: 1, created: 'manual' } as never, sql`1 = 1`)).toThrow('created');
  await query.edit({ required: 1, updated: 'manual' }, sql`1 = 1`);
  expect(updated[1]).toEqual({ required: 1, updated: 'manual' });
  expect(getTimestamp).toHaveBeenCalledTimes(2);
  expect(() => query.edit({ required: 1, locked: 2 } as never, sql`1 = 1`)).toThrow('locked');
  expect(() => query.edit({} as never, sql`1 = 1`)).toThrow('required');
  expect(() => query.add({ name: 'x', id: 1 } as never)).toThrow('id');
  expect(() => query.add({ name: 'x', secret: undefined } as never)).toThrow('secret');
  expect(() => query.edit({ required: 1, created: undefined } as never, sql`1 = 1`)).toThrow('created');
  expect(() => query.editByPrimaryKey({ required: 1, locked: undefined } as never, 1)).toThrow('locked');
});

test('getTimestamp 생략 시 CURRENT_TIMESTAMP SQL 표현식을 사용한다', async () => {
  const db = drizzleMySql({ url: 'mysql://localhost/example', schema: { table } });
  const inserted: unknown[] = [];
  const fake = {
    insert: () => ({
      values: (value: unknown) => {
        inserted.push(value);
        return { $returningId: async () => [{ id: 1 }] };
      },
    }),
  } as unknown as MySql2Database;
  try {
    const query = new MySqlQuery(table, Object.assign(() => fake, { getTimestamp: db.current.getTimestamp }));
    await query.add({ name: 'default timestamp' });
    const created = (inserted[0] as Record<string, unknown>).created;
    const updated = (inserted[0] as Record<string, unknown>).updated;
    expect(created).toBeInstanceOf(SQL);
    expect(updated).toBe(created);
    expect((created as any).queryChunks[0].value).toBe('CURRENT_TIMESTAMP');
  } finally {
    await db.close();
  }
});

test('add는 선택 빌더에서 INSERT SELECT를 실행하고 누락된 시각 컬럼을 채운다', async () => {
  const sourceDb = drizzleMySql({ url: 'mysql://localhost/example', schema: { table }, getTimestamp: () => 'source' });
  let insertedFields: Record<string, unknown> | undefined;
  const fake = {
    select: (fields: Record<string, unknown>) => ({
      from: () => ({ getSelectedFields: () => fields }),
    }),
    insert: () => ({
      select: (builder: { getSelectedFields: () => Record<string, unknown> }) => {
        insertedFields = builder.getSelectedFields();
        return { $returningId: async () => [{ id: 11 }, { id: 12 }] };
      },
    }),
  } as unknown as MySql2Database;
  try {
    const target = new MySqlQuery(table, Object.assign(() => fake, { getTimestamp: () => sql`CURRENT_TIMESTAMP` }));
    const source = sourceDb.query(table).select(['name']);
    const ids = await target.add(source);
    expect(ids).toEqual([11, 12]);
    expect(insertedFields).toHaveProperty('name');
    expect(insertedFields).toHaveProperty('created');
    expect(insertedFields).toHaveProperty('updated');
  } finally {
    await sourceDb.close();
  }
});

test('입력값 헬퍼는 쿼리 타입으로 검사하고 입력값을 그대로 반환한다', async () => {
  const insert = jest.fn(() => ({
    values: () => ({ $returningId: async () => [{ id: 7 }] }),
  }));
  const update = jest.fn(() => ({
    set: () => ({ where: () => Promise.resolve() }),
  }));
  const current = jest.fn(() => ({ insert, update }) as unknown as MySql2Database);
  const getTimestamp = jest.fn(() => 'now');
  class Query extends MySqlQuery<typeof table> {}
  const query = new Query(table, current, getTimestamp);
  const input: MySqlAddValues<typeof table> = { name: 'x' };
  const rows = [input];
  const changes: MySqlEditValues<typeof table> = { required: 1 };
  expect(query.addValues(input)).toBe(input);
  expect(query.addValues(rows)).toBe(rows);
  expect(query.addValues([])).toEqual([]);
  expect(query.editValues(changes)).toBe(changes);
  expect(current).not.toHaveBeenCalled();
  expect(getTimestamp).not.toHaveBeenCalled();
  const editable = query.editValues({ required: 1 });
  editable.name = 'edited';
  if (false) {
    // @ts-expect-error 등록 필수 값은 누락할 수 없다.
    query.addValues({});
    // @ts-expect-error 등록 금지 컬럼은 undefined로도 지정할 수 없다.
    query.addValues({ name: 'x', secret: undefined });
    // @ts-expect-error 배열 입력도 각 행의 컬럼 타입을 검사한다.
    query.addValues([{ name: 1 }]);
    // @ts-expect-error 수정 필수 값을 누락할 수 없다.
    query.editValues({ name: 'x' });
    // @ts-expect-error 생성 시각은 수정할 수 없다.
    query.editValues({ required: 1, created: undefined });
    // @ts-expect-error 수정 금지 컬럼은 지정할 수 없다.
    query.editValues({ required: 1, locked: 2 });
    const custom = new MySqlQuery<
      typeof table,
      MySqlAddValues<typeof table, 'allowed'>,
      MySqlEditValues<typeof table, 'name', 'allowed'>
    >(table, current, getTimestamp);
    // @ts-expect-error 쿼리의 사용자 지정 등록 금지 타입도 유지한다.
    custom.addValues({ name: 'x', allowed: 1 });
    // @ts-expect-error 쿼리의 사용자 지정 수정 필수 타입도 유지한다.
    custom.editValues({ required: 1 });
    // @ts-expect-error 쿼리의 사용자 지정 수정 금지 타입도 유지한다.
    custom.editValues({ required: 1, allowed: 2, name: 'x' });
  }
  await query.add(query.addValues({ name: 'x' }));
  await query.add(query.addValues([{ name: 'x' }]));
  await query.editByPrimaryKey(editable, 7);
  expect(insert).toHaveBeenCalledTimes(2);
  expect(update).toHaveBeenCalledTimes(1);
  expect(input).toEqual({ name: 'x' });
  expect(changes).toEqual({ required: 1 });
});

test('등록 시 지정한 시각은 유지하고 누락된 시각만 행별 기본값으로 채운다', async () => {
  const inserted: unknown[] = [];
  const fake = {
    insert: () => ({
      values: (value: unknown) => {
        inserted.push(value);
        return { $returningId: async () => [{ id: 7 }] };
      },
    }),
  } as unknown as MySql2Database;
  let generated = 0;
  const getTimestamp = jest.fn(() => `now-${++generated}`);
  const query = new MySqlQuery(table, () => fake, getTimestamp);
  const input = { name: 'manual', created: 'created', updated: 'updated' };
  await query.add(input);
  expect(inserted[0]).toEqual(input);
  expect(getTimestamp).not.toHaveBeenCalled();
  await query.add([
    { name: 'created-only', created: 'created' },
    { name: 'updated-only', updated: 'updated' },
    { name: 'undefined', created: undefined, updated: undefined },
  ]);
  expect(inserted[1]).toEqual([
    { name: 'created-only', created: 'created', updated: 'now-1' },
    { name: 'updated-only', created: 'now-2', updated: 'updated' },
    { name: 'undefined', created: 'now-3', updated: 'now-3' },
  ]);
  expect(getTimestamp).toHaveBeenCalledTimes(3);
  expect(input).toEqual({ name: 'manual', created: 'created', updated: 'updated' });
  const unconfigured = new MySqlQuery(table, () => fake);
  await unconfigured.add(input);
  expect(() => unconfigured.add({ name: 'missing', created: 'created' })).toThrow(
    'timestamp generator is not configured'
  );
});

test('시각 컬럼은 원래 입력 타입과 명시적인 등록 금지 정책을 유지한다', async () => {
  const dates = mysqlTable('date_policy', {
    id: int().autoincrement().primaryKey(),
    create_date: datetime({ mode: 'string' }).notNull().createdAt(),
    update_date: datetime({ mode: 'string' }).notNull().updatedAt(),
    nullable: datetime({ mode: 'string' }).createdAt(),
    blocked: datetime({ mode: 'string' }).createdAt().insertBlocked(),
  });
  if (false) {
    const optional: MySqlAddValues<typeof dates> = {};
    const explicit: MySqlAddValues<typeof dates> = { create_date: '2026-01-01 00:00:00' };
    // @ts-expect-error string 모드 컬럼에는 Date를 지정할 수 없다.
    const wrongType: MySqlAddValues<typeof dates> = { create_date: new Date() };
    // @ts-expect-error notNull 컬럼에는 null을 지정할 수 없다.
    const wrongNull: MySqlAddValues<typeof dates> = { create_date: null };
    // @ts-expect-error 명시적 insertBlocked는 시각 컬럼에서도 적용한다.
    const blocked: MySqlAddValues<typeof dates> = { blocked: 'manual' };
    // @ts-expect-error 제네릭으로 지정한 등록 금지 컬럼도 유지한다.
    const customBlocked: MySqlAddValues<typeof dates, 'create_date'> = { create_date: 'manual' };
    void [optional, explicit, wrongType, wrongNull, blocked, customBlocked];
  }
  const inserted: unknown[] = [];
  const fake = {
    insert: () => ({
      values: (value: unknown) => {
        inserted.push(value);
        return { $returningId: async () => [{ id: 1 }] };
      },
    }),
  } as unknown as MySql2Database;
  const expression = sql`CURRENT_TIMESTAMP`;
  const query = new MySqlQuery(dates, () => fake, () => 'now');
  await query.add({ create_date: 'manual', update_date: expression, nullable: null });
  expect(inserted[0]).toEqual({
    create_date: 'manual',
    update_date: expression,
    nullable: null,
    blocked: 'now',
  });
  expect(() => query.add({ blocked: 'manual' } as never)).toThrow('blocked');
});

test('수정 시 지정한 시각을 유지하고 누락된 시각만 기본값으로 채운다', async () => {
  const dates = mysqlTable('update_date_policy', {
    id: int().primaryKey(),
    created: datetime({ mode: 'string' }).notNull().createdAt(),
    updated: datetime({ mode: 'string' }).notNull().updatedAt(),
    nullable: datetime({ mode: 'string' }).updatedAt(),
    required: datetime({ mode: 'string' }).updatedAt().updateRequired(),
    blocked: datetime({ mode: 'string' }).updatedAt().updateBlocked(),
  });
  if (false) {
    const optional: MySqlEditValues<typeof dates> = {};
    const explicit: MySqlEditValues<typeof dates> = { updated: 'manual', nullable: null };
    // @ts-expect-error string 모드 컬럼에는 Date를 지정할 수 없다.
    const wrongType: MySqlEditValues<typeof dates> = { updated: new Date() };
    // @ts-expect-error 명시적 updateBlocked는 유지한다.
    const blocked: MySqlEditValues<typeof dates> = { blocked: 'manual' };
    // @ts-expect-error 제네릭으로 지정한 수정 금지 컬럼은 유지한다.
    const customBlocked: MySqlEditValues<typeof dates, 'updated'> = { updated: 'manual' };
    void [optional, explicit, wrongType, blocked, customBlocked];
  }
  const updated: unknown[] = [];
  const fake = {
    update: () => ({
      set: (value: unknown) => {
        updated.push(value);
        return { where: () => Promise.resolve() };
      },
    }),
  } as unknown as MySql2Database;
  const getTimestamp = jest.fn(() => 'now');
  const query = new MySqlQuery(dates, () => fake, getTimestamp);
  const expression = sql`CURRENT_TIMESTAMP`;
  const input = { updated: 'manual', nullable: null, required: expression };
  await query.editByPrimaryKey(input, 1);
  expect(updated[0]).toEqual({ ...input, blocked: 'now' });
  await query.edit({ updated: undefined }, sql`1 = 1`);
  expect(updated[1]).toEqual({ updated: 'now', nullable: 'now', required: 'now', blocked: 'now' });
  expect(getTimestamp).toHaveBeenCalledTimes(2);
  expect(input).toEqual({ updated: 'manual', nullable: null, required: expression });
  expect(() => query.edit({ blocked: 'manual' } as never, sql`1 = 1`)).toThrow('blocked');
  const unconfigured = new MySqlQuery(table, () => fake);
  await unconfigured.edit({ required: 1, updated: 'manual' }, sql`1 = 1`);
  expect(updated[2]).toEqual({ required: 1, updated: 'manual' });
  expect(() => unconfigured.edit({ required: 1, updated: undefined }, sql`1 = 1`)).toThrow(
    'timestamp generator is not configured'
  );
});

test('팩토리와 상속한 쿼리는 연결별 시각을 사용하고 명시한 생성 함수를 우선한다', async () => {
  const getTimestamp = jest.fn(() => 'first');
  const first = drizzleMySql({ url: 'mysql://localhost/example', schema: { table }, getTimestamp });
  const second = drizzleMySql({
    url: 'mysql://localhost/example',
    schema: { table },
    getTimestamp: () => 'second',
  });
  class Query extends MySqlQuery<typeof table> {
    constructor() {
      super(table, first.current);
    }
  }
  try {
    const factory = first.query(table);
    const inherited = new Query();
    const override = new MySqlQuery(table, first.current, () => 'override');
    expect(factory.edit({ required: 1 }, sql`1 = 1`).toSQL().params).toEqual([1, 'first']);
    expect(inherited.edit({ required: 1 }, sql`1 = 1`).toSQL().params).toEqual([1, 'first']);
    expect(second.query(table).edit({ required: 1 }, sql`1 = 1`).toSQL().params).toEqual([1, 'second']);
    expect(override.edit({ required: 1 }, sql`1 = 1`).toSQL().params).toEqual([1, 'override']);
    expect(getTimestamp).toHaveBeenCalledTimes(2);
    const unconfigured = new MySqlQuery(table, () => first.current());
    expect(() => unconfigured.add({ name: 'x' })).toThrow('timestamp generator is not configured');
    expect(() => unconfigured.edit({ required: 1 }, sql`1 = 1`)).toThrow('timestamp generator is not configured');
    const failing = new MySqlQuery(table, first.current, () => {
      throw new Error('timestamp generation failed');
    });
    expect(() => failing.add({ name: 'x' })).toThrow('timestamp generation failed');
  } finally {
    await Promise.all([first.close(), second.close()]);
  }
});

const primaryKeyTable = mysqlTable('primary_key_policy', {
  id: varchar({ length: 50 }).primaryKey(),
  allowedBefore: varchar({ length: 50 }).updateAllowed().primaryKey(),
  allowedAfter: varchar({ length: 50 }).primaryKey().updateAllowed(),
  requiredKey: varchar({ length: 50 }).primaryKey().updateRequired(),
  value: int(),
});

const createdAllowedTable = mysqlTable('created_allowed_policy', {
  id: int().autoincrement().createdAt().updateAllowed(),
});

if (false) {
  const createdAllowed: MySqlEditValues<typeof createdAllowedTable> = { id: 2 };
  void createdAllowed;
}

test('updateAllowed는 createdAt 컬럼의 기본 수정 금지를 해제한다', async () => {
  const updated: unknown[] = [];
  const fake = {
    update: () => ({
      set: (value: unknown) => {
        updated.push(value);
        return { where: () => Promise.resolve() };
      },
    }),
  } as unknown as MySql2Database;
  const query = new MySqlQuery(createdAllowedTable, () => fake);

  await query.edit({ id: 2 }, sql`1 = 1`);
  expect(updated).toEqual([{ id: 2 }]);
});

if (false) {
  const allowed: MySqlEditValues<typeof primaryKeyTable> = { allowedBefore: 'a', allowedAfter: 'b' };
  // @ts-expect-error 자동 증가가 아닌 기본 키도 수정이 금지된다.
  const blocked: MySqlEditValues<typeof primaryKeyTable> = { id: 'a' };
  // @ts-expect-error updateRequired는 기본 키 수정 허용을 의미하지 않는다.
  const requiredBlocked: MySqlEditValues<typeof primaryKeyTable> = { requiredKey: 'a' };
  void [allowed, blocked, requiredBlocked];
}

test('기본 키는 updateAllowed를 명시한 경우에만 수정한다', async () => {
  const updated: unknown[] = [];
  const fake = {
    update: () => ({
      set: (value: unknown) => {
        updated.push(value);
        return { where: () => Promise.resolve() };
      },
    }),
  } as unknown as MySql2Database;
  const query = new MySqlQuery(
    primaryKeyTable,
    () => fake,
    () => 'now'
  );
  await query.edit({ allowedBefore: 'a', allowedAfter: 'b', value: 1 }, sql`1 = 1`);
  expect(updated).toEqual([{ allowedBefore: 'a', allowedAfter: 'b', value: 1 }]);
  expect(() => query.edit({ id: 'a' } as never, sql`1 = 1`)).toThrow('id');
  expect(() => query.edit({ requiredKey: 'a' } as never, sql`1 = 1`)).toThrow('requiredKey');
});
