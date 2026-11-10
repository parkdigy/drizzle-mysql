import { drizzleMySql, int, mysqlTable, varchar } from '../src';

const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  nickname: varchar('nickname', { length: 50 }),
});
const db = drizzleMySql({ url: '', schema: { users }, getTimestamp: () => new Date() });
const u = db.a.users('u');

afterAll(() => db.close());

test('연결 select는 테이블명과 alias에서 기존 선택 및 빌더 동작을 유지한다', () => {
  expect(db.select('users').toSQL()).toEqual(db.query(users).select().toSQL());
  expect(db.select(u).toSQL()).toEqual(db.query(users).select(u).toSQL());
  expect(db.select('users', ['id', 'name as label']).toSQL()).toEqual(
    db.query(users).select(['id', 'name as label']).toSQL()
  );

  const mapped = db.select(u, { label: 'name' }).where((q) => q.eq({ id: 1 })).orderBy((q) => q.desc('id'));
  expect(mapped.toSQL()).toEqual(
    db.query(users).select(u, { label: 'name' }).where((q) => q.eq({ id: 1 })).orderBy((q) => q.desc('id')).toSQL()
  );

  const callback = db.select(u, (q) => [q.columns('id'), { label: q.t.name }] as const);
  expect(callback.toSQL()).toEqual(
    db.query(users).select(u, (q) => [q.columns('id'), { label: q.t.name }] as const).toSQL()
  );
  expect(db.select('users', []).toSQL()).toEqual(db.query(users).select([]).toSQL());

  type Row = Awaited<typeof callback>[number];
  const row: Row = { id: 1, label: 'Ada' };
  if (false) {
    // @ts-expect-error 등록되지 않은 테이블명
    db.select('missing');
    // @ts-expect-error 존재하지 않는 컬럼
    db.select('users', ['missing']);
    // @ts-expect-error alias의 존재하지 않는 컬럼
    db.select(u, { label: 'missing' });
    // @ts-expect-error 선택 결과의 id는 숫자 타입을 유지한다
    const invalid: Row = { id: 'wrong', label: 'Ada' };
    void invalid;
  }
  void row;
});

test('혼합 선택에서 컬럼 객체의 데이터 타입과 null 허용을 유지한다', () => {
  const direct = db.select(u, db.columns(u));
  const named = db.select('users', db.columns(users, 'id'));
  const mixed = db.select(u, { id: u.id, label: 'name', total: db.sqlNumber(1) });

  if (false) {
    const directRow: { id: number; name: string; nickname: string | null } = {} as Awaited<typeof direct>[number];
    const namedRow: { id: number } = {} as Awaited<typeof named>[number];
    const mixedRow: { id: number; label: string; total: number } = {} as Awaited<typeof mixed>[number];
    // @ts-expect-error 컬럼 객체의 원래 데이터 타입을 유지한다
    const invalid: Awaited<typeof mixed>[number] = { id: 'wrong', label: 'Ada', total: 1 };
    void [directRow, namedRow, mixedRow, invalid];
  }
});

test('등록되지 않은 테이블명과 컬럼은 명확한 오류를 반환한다', () => {
  expect(() => db.select('missing' as 'users')).toThrow('select: unknown table "missing".');
  expect(() => db.select('users', { label: 'missing' } as unknown as { label: 'name' })).toThrow(
    'select: unknown column "missing".'
  );
});

test('서브쿼리를 select의 기준으로 사용하고 선택한 컬럼만 노출한다', () => {
  const aa = db.select('users', ['id', 'name']).where((q) => q.eq({ id: 1 })).as('aa');
  const result = db.select(aa, (q) => q.columns('id', 'name'));
  const idOnly = db.select(aa, ['id']);
  const mapped = db.select(aa, { label: 'name' });
  const all = db.select(aa);
  const queryBased = db.query(users).select(aa, ['id']);

  expect(result.toSQL().sql).toContain('from (select');
  expect(result.toSQL().params).toEqual([1]);
  expect(result.where((q) => q.eq({ id: 2 })).orderBy((q) => q.desc('id')).toSQL().params).toEqual([1, 2]);
  expect(db.select(aa, db.columns(aa, 'id')).toSQL().params).toEqual([1]);
  expect(queryBased.toSQL()).toEqual(idOnly.toSQL());
  expect(db.select(aa).where((q) => q.isNull('name')).toSQL().sql).toContain('`aa`.`name` is null');

  if (false) {
    const row: { id: number; name: string } = {} as Awaited<typeof result>[number];
    const idRow: { id: number } = {} as Awaited<typeof idOnly>[number];
    const labelRow: { label: string } = {} as Awaited<typeof mapped>[number];
    const allRow: { id: number; name: string } = {} as Awaited<typeof all>[number];
    // @ts-expect-error 서브쿼리 조건도 컬럼의 데이터 타입을 검사한다
    db.select(aa).where((q) => q.eq({ id: 'wrong' }));
    const limited = db.select('users', ['id']).as('limited');
    // @ts-expect-error 내부에서 선택하지 않은 컬럼은 참조할 수 없다
    db.select(limited, (q) => q.columns('id', 'name'));
    // @ts-expect-error 선택하지 않은 컬럼은 노출하지 않는다
    ({} as Awaited<typeof idOnly>[number]).name;
    // @ts-expect-error 숫자 타입을 유지한다
    const wrong: Awaited<typeof idOnly>[number] = { id: 'wrong' };
    void [row, idRow, labelRow, allRow, wrong];
  }
});

test('SQL 표현식 필드의 자동 별칭과 데이터 타입을 서브쿼리 조건에도 유지한다', () => {
  const aa = db
    .query(users)
    .select((q) => ({ id: q.t.id, test: db.sql<number>`0`, label: db.sql<string>`'label'` }))
    .where((q) => q.eq({ id: 1 }))
    .as('aa');
  const selected = db.select(aa, db.columns(aa, 'id', 'test'));
  const result = selected.where((q) => q.eq({ test: 0 }));
  const arrayAlias = db.query(users).select((q) => [q.columns('id'), { test: db.sql<number>`0` }] as const).as('array_alias');
  const explicitAlias = db.select('users', { test: db.sql<number>`0`.as('test') }).as('explicit_alias');
  const directAlias = db.select('users', { test: db.sql<number>`0` }).as('direct_alias');

  expect(result.toSQL().sql).toContain('`aa`.`test` = ?');
  expect(result.toSQL().params).toEqual([1, 0]);
  expect(db.select(arrayAlias).where((q) => q.inArray({ test: [0, 1] })).toSQL().params).toEqual([0, 1]);
  expect(db.select(explicitAlias).where((q) => q.eq({ test: 0 })).toSQL().params).toEqual([0]);
  expect(db.select(directAlias).where((q) => q.between({ test: [0, 1] })).toSQL().params).toEqual([0, 1]);
  if (false) {
    const row: { id: number; test: number } = {} as Awaited<typeof selected>[number];
    db.select(aa).where((q) => q.like({ label: 'a%' }));
    // @ts-expect-error 숫자 SQL 필드의 문자열 조건은 허용하지 않는다
    db.select(aa).where((q) => q.eq({ test: 'wrong' }));
    // @ts-expect-error 숫자 SQL 필드의 문자열 결과는 허용하지 않는다
    const wrong: Awaited<typeof selected>[number] = { id: 1, test: 'wrong' };
    void [row, wrong];
  }
});
