import { int, mysqlTable, varchar } from 'drizzle-orm/mysql-core';
import { drizzleMySql } from '../src';
import * as api from '../src';

const user = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
});
const db = drizzleMySql({ url: 'mysql://example:example@127.0.0.1/example', schema: { user } });
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

test('잘못된 페이지 번호를 거부한다', async () => {
  await expect(db.paginate(db.query(user).select(), 0, 10)).rejects.toThrow(RangeError);
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
