import { int, mysqlTable, varchar } from 'drizzle-orm/mysql-core';
import type { SQL } from 'drizzle-orm';
import { drizzleMySql } from '../src';
import * as api from '../src';

const user = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
});
const db = drizzleMySql({ url: 'mysql://example:example@127.0.0.1/example', schema: { user }, getTimestamp: () => 'now' });
afterAll(() => db.close());

test('스키마에 맞는 컬럼, 별칭, 조건과 CRUD 쿼리를 생성한다', () => {
  const q = db.query(user);
  const alias = db.a.user('u');
  const query = q
    .select(alias, ['displayName'])
    .where(db.eq(alias, { displayName: 'Ada' }))
    .toSQL();
  expect(query.sql).toContain('`u`.`display_name`');
  expect(query.params).toEqual(['Ada']);
  expect(Object.keys(db.columns(user, 'id', 'displayName as name'))).toEqual(['id', 'name']);
  expect(() => q.edit({ displayName: 'x' }, undefined)).toThrow('where condition');
});

test('select 문자열 매핑 객체의 키를 결과 별칭으로 사용한다', () => {
  const selected = db.query(user).select({ id_2: 'id', display_name_2: 'displayName' });
  type Row = Awaited<typeof selected>[number];
  const row: Row = { id_2: 1, display_name_2: 'Ada' };
  expect(selected.toSQL().sql).toBe('select `id` as `id_2`, `display_name` as `display_name_2` from `users`');
  expect(row).toEqual({ id_2: 1, display_name_2: 'Ada' });
  expect(() => db.query(user).select({ missing: 'missing' } as never)).toThrow('select: unknown column "missing".');
});

test('find와 findByPrimaryKey에서 문자열 매핑 객체와 결과 타입을 지원한다', () => {
  const q = db.query(user);
  if (false) {
    const found = q.find({ id_2: 'id' });
    const foundWithCondition = q.find({ id_2: 'id' }, q.eq({ displayName: 'Ada' }));
    const foundByPrimaryKey = q.findByPrimaryKey({ id_2: 'id' }, 1);
    type FoundRow = NonNullable<Awaited<typeof found>>;
    const row: FoundRow = { id_2: 1 };
    void [foundWithCondition, foundByPrimaryKey, row];
  }
});

test('잘못된 페이지 번호를 거부한다', async () => {
  await expect(db.paginate(db.query(user).select(), 0, 10)).rejects.toThrow(RangeError);
});

test.each(['as', 'AS', 'As', 'aS'] as const)('컬럼 별칭의 %s 키워드를 대소문자 구분 없이 처리한다', (keyword) => {
  const q = db.query(user);
  const alias = db.a.user('u');
  const selection = `displayName ${keyword} My_Name` as const;
  const fields = q.columns('id', selection);
  const value: SQL.Aliased<string> = fields.My_Name;
  expect(value.fieldAlias).toBe('My_Name');
  expect(Object.keys(fields)).toEqual(['id', 'My_Name']);
  expect(Object.keys(db.columns(user, selection))).toEqual(['My_Name']);
  expect(Object.keys(db.columns([alias, selection], [user, 'id']))).toEqual(['My_Name', 'id']);
  const selected = q.select(alias, ['id', selection]);
  type Row = Awaited<typeof selected>[number];
  const row: Row = { id: 1, My_Name: 'Ada' };
  expect(row.My_Name).toBe('Ada');
  expect(selected.toSQL().sql).toBe('select `id`, `display_name` as `My_Name` from `users` `u`');
  expect(q.select(['id', selection]).toSQL().sql).toContain('as `My_Name`');
  expect(q.select((query) => [query.columns(selection)]).toSQL().sql).toContain('as `My_Name`');
  if (false) {
    const found = q.find(alias, [selection]);
    type FoundRow = NonNullable<Awaited<typeof found>>;
    const foundRow: FoundRow = { My_Name: 'Ada' };
    // @ts-expect-error 별칭 결과는 컬럼의 원래 데이터 타입을 유지한다.
    const wrongRow: Row = { id: 1, My_Name: 1 };
    // @ts-expect-error 존재하지 않는 컬럼은 대문자 AS에서도 허용하지 않는다.
    q.select(alias, ['missing AS name']);
    void [foundRow, wrongRow];
  }
});

test('스키마와 SQL 컬럼명이 같을 때 전체 선택 결과의 타입과 키가 일치한다', () => {
  const accounts = mysqlTable('accounts', {
    account_id: int('account_id').notNull(),
    display_name: varchar('display_name', { length: 100 }).notNull(),
  });
  const fields = db.columns(accounts);
  const id: typeof accounts.account_id = fields.account_id;
  const name: typeof accounts.display_name = fields.display_name;
  expect(Object.keys(fields)).toEqual(['account_id', 'display_name']);
  expect([id, name]).toEqual([accounts.account_id, accounts.display_name]);
  const selected = db.columns(accounts, 'account_id', 'display_name as name');
  expect(Object.keys(selected)).toEqual(['account_id', 'name']);
  const selectedId: typeof accounts.account_id = selected.account_id;
  expect(selectedId).toBe(accounts.account_id);
});

test('제거한 컬럼명 보정 API는 내보내지 않는다', () => {
  expect(Object.hasOwn(api, 'withColumnNames')).toBe(false);
});
