import { coalesceNumber, coalesceString, coalesceBoolean } from '../src';
import { coalesce, drizzleMySql, int, mysqlTable, varchar } from '../src';

const users = mysqlTable('users', {
  id: int('id').notNull(),
  name: varchar('name', { length: 50 }),
  email: varchar('email', { length: 100 }),
});
const db = drizzleMySql({ url: '', schema: { users } });
const query = db.query(users);
afterAll(() => db.close());

test('COALESCE는 컬럼·SQL 표현식과 기본 값을 처리하고 쿼리의 컬럼명을 해석한다', () => {
  const expressions = [
    db.coalesce(users.email, 'no email'),
    db.coalesce(users.id, 0),
    db.coalesce(users.name, users.email),
    db.coalesce(db.sql`cast(${users.id} as signed)`, db.sql`${users.id} * 100`),
  ];
  const shorthand = [
    query.coalesce('email', 'no email'),
    query.coalesce('id', 0),
    query.coalesce('name', users.email),
    query.coalesce(db.sql`cast(${users.id} as signed)`, db.sql`${users.id} * 100`),
  ];
  const expected = [
    ['coalesce(`email`, ?)', ['no email']],
    ['coalesce(`id`, ?)', [0]],
    ['coalesce(`name`, `email`)', []],
    ['coalesce(cast(`users`.`id` as signed), `users`.`id` * 100)', []],
  ];
  expressions.forEach((expression, index) => {
    const result = query.select({ value: expression }).toSQL();
    expect(result.sql).toContain(expected[index]?.[0]);
    expect(result.params).toEqual(expected[index]?.[1]);
    expect(query.select({ value: shorthand[index]! }).toSQL()).toEqual(result);
  });
  expect(query.select({ value: coalesce(users.email, "a'b") }).toSQL().params).toEqual(["a'b"]);
  const alias = db.a.users('u');
  expect(
    query
      .select()
      .where(db.eq(db.coalesce(alias.email, null), 'x'))
      .toSQL().sql
  ).toContain('coalesce(`u`.`email`, ?)');
  expect(() => Reflect.apply(query.coalesce, query, ['missing', 'fallback'])).toThrow('unknown column "missing"');
});

test('선택적 decoder는 SQL을 변경하지 않고 mapWith와 동일하게 값을 변환한다', async () => {
  const { drizzle } = await import('drizzle-orm/mysql2');
  for (const value of ['12.5', null]) {
    const database = drizzle({
      client: {
        query: async () => [[[value]], []],
      } as never,
    });
    const first = db.sql`cast(${users.id} as signed)`;
    const fallback = db.sql`${users.id} * 100`;
    for (const decoder of [Number, { mapFromDriverValue: (value: unknown) => Number(value) + 1 }]) {
      const expected = database.select({ value: db.coalesce(first, fallback).mapWith(decoder) }).from(users);
      for (const expression of [
        db.coalesce(first, fallback, decoder),
        query.coalesce(first, fallback, decoder),
        coalesce(first, fallback, decoder),
      ]) {
        const selected = database.select({ value: expression }).from(users);
        expect(selected.toSQL()).toEqual(expected.toSQL());
        expect(await selected).toEqual([{ value: value === null ? null : decoder === Number ? 12.5 : 13.5 }]);
      }
    }
    expect(await database.select({ value: query.coalesce('id', 0, Number) }).from(users)).toEqual([
      { value: value === null ? null : 12.5 },
    ]);
  }
});

test('명시적 결과 타입은 SQL과 decoder 동작을 변경하지 않는다', () => {
  const inferred = db
    .query(users)
    .select({ value: db.coalesce(users.id, 0) })
    .toSQL();
  expect(
    db
      .query(users)
      .select({ value: db.coalesce<0 | 1 | 2>(users.id, 0) })
      .toSQL()
  ).toEqual(inferred);
  expect(
    db
      .query(users)
      .select({ value: query.coalesce<0 | 1 | 2>('id', 0) })
      .toSQL()
  ).toEqual(inferred);
  expect(
    db
      .query(users)
      .select({ value: coalesce<0 | 1 | 2>(users.id, 0, Number) })
      .toSQL()
  ).toEqual(inferred);
});

test.each([
  ['coalesceNumber', coalesceNumber, Number],
  ['coalesceString', coalesceString, String],
  ['coalesceBoolean', coalesceBoolean, Boolean],
] as const)('%s는 모든 진입점에서 COALESCE와 자동 변환기를 적용한다', async (method, helper, decoder) => {
  const { drizzle } = await import('drizzle-orm/mysql2');
  for (const value of ['12.5', '0', 0, 1, null]) {
    const database = drizzle({
      client: { query: async () => [[[value]], []] } as never,
    });
    for (const expression of [
      helper(users.id, 0),
      db[method](users.id, 0),
      query[method]('id', 0),
      query[method](users.id, 0),
      helper<unknown>(users.id, 0),
      db[method]<unknown>(users.id, 0),
      query[method]<unknown>('id', 0),
    ]) {
      const selected = database.select({ value: expression }).from(users);
      const expected = database.select({ value: coalesce(users.id, 0).mapWith(decoder) }).from(users);
      expect(selected.toSQL()).toEqual(expected.toSQL());
      expect(await selected).toEqual([{ value: value === null ? null : decoder(value) }]);
    }
  }
  expect(() => Reflect.apply(query[method], query, ['missing', 0])).toThrow('unknown column "missing"');
});
