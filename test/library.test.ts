import { int, mysqlTable, varchar } from 'drizzle-orm/mysql-core';
import { asc as drizzleAsc, sql, type SQL } from 'drizzle-orm';
import { drizzleMySql } from '../src';
import * as api from '../src';
import { TableColumns } from '../src/columns';

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

test('where 콜백은 조건 헬퍼와 테이블 객체를 제공한다', () => {
  const query = db.query(user);
  const alias = db.a.user('u');
  const tableColumn = query.select(['id']).where((q) => db.eq(q.t.displayName, 'Ada')).toSQL();
  const aliasTableColumn = query.select(alias, ['id']).where((q) => db.eq(q.t.displayName, 'Ada')).toSQL();
  const queryCondition = query.select(['id']).where((q) => q.eq({ displayName: 'Ada' })).toSQL();
  const groupedCondition = query
    .select(['id'])
    .where((q) => q.and({ eq: { displayName: 'Ada' }, gt: { id: 1 } }))
    .toSQL();
  const aliasCondition = query.select(alias, ['id']).where((q) => q.eq({ displayName: 'Ada' })).toSQL();

  expect(tableColumn.sql).toMatch(/where `users`\.`display_name` = \?/i);
  expect(tableColumn.params).toEqual(['Ada']);
  expect(aliasTableColumn.sql).toMatch(/where `u`\.`display_name` = \?/i);
  expect(aliasTableColumn.params).toEqual(['Ada']);
  expect(queryCondition.sql).toMatch(/where `users`\.`display_name` = \?/i);
  expect(queryCondition.params).toEqual(['Ada']);
  expect(groupedCondition.sql).toMatch(/where \(\(`users`\.`display_name` = \?\) and \(`users`\.`id` > \?\)\)/i);
  expect(groupedCondition.params).toEqual(['Ada', 1]);
  expect(aliasCondition.sql).toMatch(/where `u`\.`display_name` = \?/i);
  expect(aliasCondition.params).toEqual(['Ada']);
});

test('join 콜백은 조인 컬럼 조건 헬퍼와 기준 테이블을 제공한다', () => {
  const query = db.query(user);
  const baseAlias = db.alias(user, 'base');
  const joinAlias = db.alias(user, 'joined');
  const joined = query.select().innerJoin(joinAlias, (q) => q.eq({ id: q.t.id })).toSQL();
  const aliasJoined = query.select(baseAlias).innerJoin(joinAlias, (q) => q.eq({ id: q.t.id })).toSQL();

  expect(joined.sql).toMatch(/inner join `users` `joined` on `joined`\.`id` = `users`\.`id`/i);
  expect(aliasJoined.sql).toMatch(/inner join `users` `joined` on `joined`\.`id` = `base`\.`id`/i);
});

test('조인 뒤에도 where와 orderBy 콜백 헬퍼를 유지한다', () => {
  const query = db.query(user);
  const joinedTable = db.alias(user, 'joined');
  const secondJoinedTable = db.alias(user, 'second_joined');
  const beforeJoin = query.select().where((q) => q.eq({ id: 1 })).toSQL();
  const afterJoin = query
    .select()
    .innerJoin(joinedTable, db.eq(joinedTable.id, user.id))
    .where((q) => q.eq({ id: 1 }))
    .toSQL();
  const afterTwoJoins = query
    .select()
    .innerJoin(joinedTable, db.eq(joinedTable.id, user.id))
    .innerJoin(secondJoinedTable, db.eq(secondJoinedTable.id, user.id))
    .where((q) => q.eq({ id: 1 }))
    .orderBy((q) => q.desc('displayName'))
    .toSQL();

  expect(beforeJoin.sql).toMatch(/where `users`\.`id` = \?/i);
  expect(afterJoin.sql).toMatch(/inner join `users` `joined` on `joined`\.`id` = `users`\.`id` where `users`\.`id` = \?/i);
  expect(afterJoin.params).toEqual([1]);
  expect(afterTwoJoins.sql).toMatch(/inner join `users` `joined`.*inner join `users` `second_joined`.*where `users`\.`id` = \? order by `users`\.`display_name` desc/i);
  expect(afterTwoJoins.params).toEqual([1]);
});

test('select 서브쿼리를 콜백 조건으로 조인한다', () => {
  const query = db.query(user);
  const builder = query.select(['id']).limit(1).orderBy(query.desc('id'));
  const subquery = builder.as('latest');
  const joined = query.select().innerJoin(subquery, (q) => q.eq({ id: q.t.id })).toSQL();

  expect(joined.sql).toMatch(/inner join \(select `id` from `users` order by `users`\.`id` desc limit \?\) `latest` on `latest`\.`id` = `users`\.`id`/i);
  expect(joined.params).toEqual([1]);
});

test('서브쿼리 별칭의 컬럼을 columns 선택자로 고른다', () => {
  const query = db.query(user);
  const builder = query.select(['id']).limit(1).orderBy(query.desc('id'));
  const subquery = builder.as('latest');
  const selected = query
    .select(TableColumns(subquery, 'id'))
    .innerJoin(subquery, db.eq(subquery.id, user.id))
    .toSQL();

  expect(selected.sql).toMatch(/select `latest`\.`id` as `id` from `users` inner join \(select `id` from `users` order by `users`\.`id` desc limit \?\) `latest` on `latest`\.`id` = `users`\.`id`/i);
  expect(selected.params).toEqual([1]);
  expect(() => TableColumns(subquery, 'missing' as never)).toThrow('columns: unknown column "missing".');
});

test('컬럼명과 별칭 테이블로 오름차순과 내림차순을 지정한다', () => {
  const query = db.query(user);
  const alias = db.a.user('u');
  const descending = query.select().orderBy(query.desc('id')).toSQL();
  const ascending = query.select().orderBy(query.asc('id')).toSQL();
  const callbackDescending = query.select(['id']).orderBy((q) => q.desc('id')).toSQL();
  const callbackAscending = query.select(['id']).orderBy((q) => q.asc('id')).toSQL();
  const callbackColumn = query.select(['id']).orderBy((q) => drizzleAsc(q.t.id)).toSQL();
  const aliasDescending = query.select(alias).orderBy(query.desc(alias, 'id')).toSQL();
  const aliasAscending = query.select(alias).orderBy(query.asc(alias, 'id')).toSQL();
  const aliasCallback = query.select(alias, ['id']).orderBy((q) => q.desc('id')).toSQL();

  expect(descending.sql).toMatch(/order by `users`\.`id` desc/i);
  expect(ascending.sql).toMatch(/order by `users`\.`id` asc/i);
  expect(callbackDescending.sql).toMatch(/order by `users`\.`id` desc/i);
  expect(callbackAscending.sql).toMatch(/order by `users`\.`id` asc/i);
  expect(callbackColumn.sql).toMatch(/order by `users`\.`id` asc/i);
  expect(aliasDescending.sql).toMatch(/order by `u`\.`id` desc/i);
  expect(aliasAscending.sql).toMatch(/order by `u`\.`id` asc/i);
  expect(aliasCallback.sql).toMatch(/order by `u`\.`id` desc/i);
  expect(() => query.desc('missing' as never)).toThrow('orderBy: unknown column "missing".');
});

test('select 빌더를 조건과 선택 필드의 서브쿼리로 사용한다', () => {
  const query = db.query(user);
  const builder = query.select({ min_id: query.min('id').as('id') }).where(query.gt({ id: 2 }));
  const condition = db.current().select().from(user).where(query.eq({ id: builder })).toSQL();
  const selected = query.select({ sub_query_value: sql`(${builder})`.as('sub_query_value') }).toSQL();

  expect(condition.sql).toMatch(/where `users`\.`id` = \(select min\(`id`\) as `id` from `users` where `users`\.`id` > \?/i);
  expect(condition.params).toEqual([2]);
  expect(selected.sql).toMatch(/select \(\(select min\(`id`\) as `id` from `users` where `users`\.`id` > \?\)\) as `sub_query_value` from `users`/i);
  expect(selected.params).toEqual([2]);
});

test('eq에서 컬럼명 또는 별칭 컬럼과 서브쿼리 빌더를 비교한다', () => {
  const query = db.query(user);
  const builder = query.select(['id']).limit(1).orderBy(query.desc('id'));
  const alias = db.a.user('u');
  const condition = db.current().select().from(user).where(query.eq('id', builder)).toSQL();
  const aliasCondition = db.current().select().from(alias).where(query.eq(alias, 'id', builder)).toSQL();

  expect(condition.sql).toMatch(/where `users`\.`id` = \(select `id` from `users` order by `users`\.`id` desc limit \?/i);
  expect(condition.params).toEqual([1]);
  expect(aliasCondition.sql).toMatch(/where `u`\.`id` = \(select `id` from `users` order by `users`\.`id` desc limit \?/i);
  expect(aliasCondition.params).toEqual([1]);
});

test('서브쿼리와 일반 컬럼을 한 선택 객체에서 함께 사용한다', () => {
  const query = db.query(user);
  const builder = query.select(['id']).limit(1).orderBy(query.desc('id'));
  const statement = query.select({ id: 'id', sub_query_value: builder });
  type Row = Awaited<typeof statement>[number];
  const row: Row = { id: 1, sub_query_value: 1 };
  const selected = statement.toSQL();

  expect(selected.sql).toMatch(/select .*`id` as `id`.*\(select `id` from `users` order by `users`\.`id` desc limit \?\) as `sub_query_value` from `users`/i);
  expect(selected.params).toEqual([1]);
  expect(row).toEqual({ id: 1, sub_query_value: 1 });
  const rawSqlSelection = query.select({ id: 'id', sub_query_value: sql`(${builder})` }).toSQL();
  expect(rawSqlSelection.sql).toMatch(/as `sub_query_value` from `users`/i);
});

test('find와 findByPrimaryKey에서 문자열 매핑 객체와 결과 타입을 지원한다', () => {
  const q = db.query(user);
  if (false) {
    const found = q.find({ id_2: 'id' });
    const foundWithCondition = q.find({ id_2: 'id' }, q.eq({ displayName: 'Ada' }));
    const foundByPrimaryKey = q.findByPrimaryKey({ id_2: 'id' }, 1);
    const aggregates = q.find({ min_id: q.min('id'), max_id: q.max('id') });
    const aggregatesWithCondition = q.find(
      { min_id: q.min('id'), max_id: q.max('id') },
      q.eq({ displayName: 'Ada' })
    );
    type FoundRow = NonNullable<Awaited<typeof found>>;
    const row: FoundRow = { id_2: 1 };
    void [foundWithCondition, foundByPrimaryKey, aggregates, aggregatesWithCondition, row];
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
