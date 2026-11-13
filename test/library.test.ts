import { int, mysqlTable, varchar } from 'drizzle-orm/mysql-core';
import { asc as drizzleAsc, sql, type SQL } from 'drizzle-orm';
import { createConditions, drizzleMySql } from '../src';
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

test('remove 인자를 생략하면 조건 없는 DELETE 빌더를 반환한다', () => {
  const query = db.query(user);
  const generated = query.remove().toSQL();

  expect(generated.sql).toMatch(/^delete from `users`$/i);
  expect(generated.sql).not.toMatch(/where/i);
  expect(generated.params).toEqual([]);
  expect(() => query.remove(undefined as never)).toThrow('remove: a SQL where condition is required.');
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

test('and와 or는 객체 조건과 여러 SQL 조건을 중첩 결합한다', () => {
  const query = db.query(user);
  const composed = query.select().where((q) =>
    q.and(
      q.and({ eq: { id: 1 } }),
      q.or({ isNull: 'displayName', eq: { displayName: 'Ada' } }),
    ),
  ).toSQL();
  expect(composed.sql).toContain('`users`.`id` = ?');
  expect(composed.sql).toContain(' or ');
  expect(composed.params).toEqual([1, 'Ada']);

  const direct = query.and(query.eq({ id: 1 }), false, query.eq({ displayName: 'Ada' }));
  const directOr = query.or(query.eq({ id: 1 }), query.eq({ id: 2 }));
  expect(db.current().select().from(user).where(direct).toSQL().params).toEqual([1, 'Ada']);
  expect(db.current().select().from(user).where(directOr).toSQL().params).toEqual([1, 2]);
  expect(query.and(false, undefined)).toBeUndefined();
  expect(query.or(false, undefined)).toBeUndefined();

  const subquery = query.select(['id']).as('selected_user');
  const subqueryCondition = query.select(subquery).where((q) =>
    q.and(q.and(q.eq({ id: 1 })), q.or(q.eq({ id: 2 }), q.eq({ id: 3 }))),
  ).toSQL();
  expect(subqueryCondition.sql).toContain('`selected_user`.`id`');
  expect(subqueryCondition.sql).toContain(' or ');
  expect(subqueryCondition.params).toEqual([1, 2, 3]);
});

test('and/or 객체 조건은 서로 중첩할 수 있지만 같은 연산자는 다시 중첩할 수 없다', () => {
  const query = db.query(user);
  const nested = query.and({
    eq: { id: 1 },
    or: {
      eq: { displayName: 'Ada' },
      ne: { displayName: 'Grace' },
    },
  });
  const generated = db.current().select().from(user).where(nested).toSQL();

  expect(generated.sql).toContain('`users`.`id` = ?');
  expect(generated.sql).toContain(' or ');
  expect(generated.params).toEqual([1, 'Ada', 'Grace']);
  expect(() => Reflect.apply(query.and, query, [{ and: {} }])).toThrow('cannot nest "and" inside itself');
  expect(() => Reflect.apply(query.or, query, [{ or: {} }])).toThrow('cannot nest "or" inside itself');
});

test('orEq와 orNe는 쿼리·스키마 키·테이블 별칭에서 비교를 OR로 결합한다', () => {
  const alias = db.a.user('u');
  const conditions = createConditions({ user });
  const direct = db.query(user).orEq({ id: 1, displayName: 'Ada' })!;
  const query = db.current().select().from(user).where(direct).toSQL();
  expect(query.sql.replace(/[()]/g, '')).toContain('`users`.`id` = ? or `users`.`display_name` = ?');
  expect(query.params).toEqual([1, 'Ada']);

  for (const operator of ['orEq', 'orNe'] as const) {
    const comparison = operator === 'orEq' ? '=' : '<>';
    const values = { id: 1, displayName: 'Ada' };
    for (const condition of [conditions[operator](user, values), conditions[operator]('user', values)]) {
      const generated = db.current().select().from(user).where(condition).toSQL();
      expect(generated.sql.replace(/[()]/g, '')).toContain(
        `\`users\`.\`id\` ${comparison} ? or \`users\`.\`display_name\` ${comparison} ?`,
      );
      expect(generated.params).toEqual([1, 'Ada']);
    }
    const aliased = db.current().select().from(alias).where(conditions[operator](alias, values)).toSQL();
    expect(aliased.sql.replace(/[()]/g, '')).toContain(
      `\`u\`.\`id\` ${comparison} ? or \`u\`.\`display_name\` ${comparison} ?`,
    );
    expect(aliased.params).toEqual([1, 'Ada']);
    expect(db.query(user)[operator]({})).toBeUndefined();
    expect(conditions[operator](user, { id: undefined })).toBeUndefined();
  }

  const optional = mysqlTable('optional_or_conditions', {
    id: int(),
    displayName: varchar({ length: 50 }),
  });
  const optionalConditions = createConditions({ optional });
  const nullCheck = optionalConditions.orEq(optional, { id: null, displayName: undefined });
  const nullSql = db.current().select().from(optional).where(nullCheck).toSQL();
  expect(nullSql.sql).toContain('`optional_or_conditions`.`id` is null');
  expect(nullSql.params).toEqual([]);
  expect(() => conditions.orEq(user, { missing: 1 } as never)).toThrow('unknown column');
  const grouped = conditions.and(user, { orEq: { id: 1, displayName: 'Ada' }, gt: { id: 0 } });
  expect(db.current().select().from(user).where(grouped).toSQL().sql).toContain(' or ');

  const callback = db.query(user).select().where((q) => q.orNe({ id: 1, displayName: 'Ada' })).toSQL();
  expect(callback.sql.replace(/[()]/g, '')).toContain('`users`.`id` <> ? or `users`.`display_name` <> ?');
  if (false) {
    // @ts-expect-error OR 비교도 컬럼 값의 타입을 검사한다.
    db.query(user).orNe({ id: 'invalid' });
    // @ts-expect-error 존재하지 않는 컬럼은 허용하지 않는다.
    db.query(user).orEq({ missing: 1 });
  }
});

test('OR 비교 연산자들은 컬럼 조건만 OR로 묶고 배열·범위 검증을 유지한다', () => {
  const conditions = createConditions({ user });
  const cases = {
    gt: { id: 1, displayName: 'Ada' },
    gte: { id: 1, displayName: 'Ada' },
    lt: { id: 1, displayName: 'Ada' },
    lte: { id: 1, displayName: 'Ada' },
    inArray: { id: [1, 2], displayName: ['Ada'] },
    notInArray: { id: [1, 2], displayName: ['Ada'] },
    between: { id: [1, 2], displayName: ['A', 'Z'] },
    notBetween: { id: [1, 2], displayName: ['A', 'Z'] },
    like: { displayName: 'A%' },
    notLike: { displayName: 'A%' },
    ilike: { displayName: 'A%' },
    notIlike: { displayName: 'A%' },
    isNull: ['id', 'displayName'],
    isNotNull: ['id', 'displayName'],
  };
  const call = (operator: string, ...args: unknown[]) =>
    Reflect.apply((conditions as unknown as Record<string, (...args: unknown[]) => SQL | undefined>)[operator]!, undefined, args);

  for (const [base, values] of Object.entries(cases)) {
    const operator = `or${base.charAt(0).toUpperCase()}${base.slice(1)}`;
    const ordinary = call(base, user, values);
    const expected = call(operator, user, values);
    const generated = db.current().select().from(user).where(expected).toSQL();
    if (Object.keys(values).length > 1) expect(generated.sql).toContain(' or ');
    expect(generated.params).toEqual(
      db.current().select().from(user).where(ordinary).toSQL().params,
    );
    const grouped = conditions.and(user, { [operator]: values } as never);
    expect(db.current().select().from(user).where(grouped).toSQL()).toEqual(generated);
  }

  expect(() => conditions.orBetween(user, { id: [1] } as never)).toThrow('two non-null bounds');
  expect(() => conditions.orInArray(user, { id: '1' } as never)).toThrow('array or a SQL query');
  expect(() => conditions.orIsNull(user, ['missing'] as never)).toThrow('unknown column');

  const contacts = mysqlTable('or_contacts', {
    first: varchar({ length: 50 }),
    second: varchar({ length: 50 }),
  });
  const contactConditions = createConditions({ contacts });
  for (const operator of ['orLike', 'orNotLike', 'orIlike', 'orNotIlike'] as const) {
    const generated = db.current().select().from(contacts)
      .where(contactConditions[operator](contacts, { first: 'A%', second: '%@example.com' }))
      .toSQL();
    expect(generated.sql).toContain(' or ');
    expect(generated.params).toEqual(['A%', '%@example.com']);
  }
});

test('서브쿼리 where 콜백에서도 OR 비교와 NULL 연산자를 제공한다', () => {
  const subqueryTable = mysqlTable('or_subquery_users', {
    id: int(),
    name: varchar({ length: 50 }),
  });
  const subquery = db.query(subqueryTable).select(['id', 'name']).as('selected_user');
  const comparison = db.query(subqueryTable)
    .select(subquery)
    .where((q) => q.orGt({ id: 1, name: 'A' }))
    .toSQL();
  expect(comparison.sql).toContain('`selected_user`.`id` > ?');
  expect(comparison.sql).toContain(' or ');
  expect(comparison.params).toEqual([1, 'A']);

  const nullCheck = db.query(subqueryTable)
    .select(subquery)
    .where((q) => q.orIsNull(['id', 'name']))
    .toSQL();
  expect(nullCheck.sql).toContain(' or ');
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
  const queryAlias = query.alias('query_alias');
  const descending = query.select().orderBy(query.desc('id')).toSQL();
  const ascending = query.select().orderBy(query.asc('id')).toSQL();
  const callbackDescending = query.select(['id']).orderBy((q) => q.desc('id')).toSQL();
  const callbackAscending = query.select(['id']).orderBy((q) => q.asc('id')).toSQL();
  const callbackColumn = query.select(['id']).orderBy((q) => drizzleAsc(q.t.id)).toSQL();
  const aliasDescending = query.select(alias).orderBy(query.desc(alias, 'id')).toSQL();
  const aliasAscending = query.select(alias).orderBy(query.asc(alias, 'id')).toSQL();
  const aliasCallback = query.select(alias, ['id']).orderBy((q) => q.desc('id')).toSQL();
  const multiCallback = query.select(['id']).orderBy((q) => q.desc('id', 'displayName')).toSQL();
  const multiArrayCallback = query.select(['id']).orderBy((q) => [q.asc('id', 'displayName'), q.desc('displayName')]).toSQL();
  const multiQueryMethod = query.select().orderBy(...query.asc('id', 'displayName')).toSQL();
  const multiDatabaseMethod = query.select().orderBy(db.asc(user.id, user.displayName)).toSQL();
  const multiDatabaseAlias = query.select().orderBy(db.desc(alias, 'id', 'displayName')).toSQL();
  const nestedOrderArray = query.select().orderBy([db.asc(user.id), db.desc(user.displayName)]).toSQL();
  const queryAliasOrder = query.select(queryAlias).orderBy((q) => q.asc('id', 'displayName')).toSQL();

  expect(descending.sql).toMatch(/order by `users`\.`id` desc/i);
  expect(ascending.sql).toMatch(/order by `users`\.`id` asc/i);
  expect(callbackDescending.sql).toMatch(/order by `users`\.`id` desc/i);
  expect(callbackAscending.sql).toMatch(/order by `users`\.`id` asc/i);
  expect(callbackColumn.sql).toMatch(/order by `users`\.`id` asc/i);
  expect(aliasDescending.sql).toMatch(/order by `u`\.`id` desc/i);
  expect(aliasAscending.sql).toMatch(/order by `u`\.`id` asc/i);
  expect(aliasCallback.sql).toMatch(/order by `u`\.`id` desc/i);
  for (const generated of [multiCallback, multiArrayCallback, multiQueryMethod, multiDatabaseMethod, multiDatabaseAlias, nestedOrderArray]) {
    expect(generated.sql).toContain('order by');
    expect(generated.sql).toContain('`display_name`');
  }
  expect(queryAliasOrder.sql).toContain('`query_alias`.`display_name` asc');
  expect(() => query.desc('missing' as never)).toThrow('orderBy: unknown column "missing".');
  expect(() => db.asc(user, 'missing' as never)).toThrow('orderBy: unknown column "missing".');
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

test('배열 조건에서 일반 값과 컬럼 및 SQL 표현식을 함께 사용한다', () => {
  const alias = db.alias(user, 'td');
  const grouped = db
    .current()
    .select()
    .from(alias)
    .where(db.and(alias, { inArray: { id: [0, alias.id] } }))
    .toSQL();
  expect(grouped.sql).toContain('`td`.`id` in (?, `td`.`id`)');
  expect(grouped.params).toEqual([0]);

  const excluded = db
    .current()
    .select()
    .from(alias)
    .where(db.notInArray(alias, { id: [0, alias.id, sql`1 + 1`] }))
    .toSQL();
  expect(excluded.sql).toContain('`td`.`id` not in (?, `td`.`id`, 1 + 1)');
  expect(excluded.params).toEqual([0]);

  const queryCondition = db.query(user).select().where((q) => q.inArray({ id: [0, q.t.id] })).toSQL();
  expect(queryCondition.sql).toContain('`users`.`id` in (?, `users`.`id`)');
  expect(queryCondition.params).toEqual([0]);

  if (false) {
    // @ts-expect-error 숫자 컬럼의 배열에는 문자열 값을 넣을 수 없다.
    db.and(alias, { inArray: { id: [0, 'wrong'] } });
    // @ts-expect-error notInArray도 컬럼의 값 타입을 검사한다.
    db.notInArray(alias, { id: ['wrong'] });
  }
});

test('배열 및 범위 조건에서 SQL 서브쿼리 빌더를 사용한다', () => {
  const query = db.query(user);
  const oneRowBuilder = query.select(['id']).limit(1).where(query.lt({ id: 1 }));
  const multiRowBuilder = query.select(['id']).where(query.lt({ id: 10 }));
  const inArray = db.current().select().from(user).where(query.inArray({ id: multiRowBuilder })).toSQL();
  const notInArray = db.current().select().from(user).where(query.notInArray({ id: multiRowBuilder })).toSQL();
  const between = db.current().select().from(user).where(query.between({ id: [oneRowBuilder, oneRowBuilder] })).toSQL();
  const grouped = db.current().select().from(user).where(db.and(user, { inArray: { id: multiRowBuilder } })).toSQL();

  expect(inArray.sql).toContain('`users`.`id` in (select `id` from `users` where `users`.`id` < ?)');
  expect(inArray.params).toEqual([10]);
  expect(notInArray.sql).toContain('`users`.`id` not in (select `id` from `users` where `users`.`id` < ?)');
  expect(notInArray.params).toEqual([10]);
  expect(between.sql).toContain(
    '`users`.`id` between (select `id` from `users` where `users`.`id` < ? limit ?) and (select `id` from `users` where `users`.`id` < ? limit ?)',
  );
  expect(between.params).toEqual([1, 1, 1, 1]);
  expect(grouped.sql).toContain('`users`.`id` in (select `id` from `users` where `users`.`id` < ?)');
  expect(grouped.params).toEqual([10]);

  if (false) {
    // @ts-expect-error 서브쿼리 배열 조건도 컬럼의 데이터 타입을 검사한다.
    query.inArray({ id: ['wrong'] });
    // @ts-expect-error 서브쿼리 범위 경계도 컬럼의 데이터 타입을 검사한다.
    query.between({ id: ['wrong', oneRowBuilder] });
  }
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
