import { randomBytes } from 'node:crypto';
import { int, mysqlTable, varchar } from '../src';
import { sql } from 'drizzle-orm';
import { drizzleMySql } from '../src';

const table = mysqlTable(`codex_test_${randomBytes(8).toString('hex')}`, {
  user_id: int('user_id').autoincrement().primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  created_at: varchar('created_at', { length: 50 }).createdAt(),
  updated_at: varchar('updated_at', { length: 50 }).updatedAt(),
});
const runIntegration = process.env.MYSQL_INTEGRATION === '1' && process.env.DATABASE_URL ? describe : describe.skip;

runIntegration('MySQL 통합 테스트', () => {
  const db = drizzleMySql({
    url: process.env.DATABASE_URL!,
    schema: { table },
    getTimestamp: () => 'now',
  });
  const query = db.query(table);
  if (false) {
    query.add({ name: 'manual', created_at: 'manual' });
    // @ts-expect-error 존재하지 않는 컬럼이다.
    query.eq({ missing: 1 });
  }
  let created = false;
  beforeAll(async () => {
    await db
      .current()
      .execute(
        sql`CREATE TABLE ${table} (user_id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50) NOT NULL, created_at VARCHAR(50), updated_at VARCHAR(50))`
      );
    created = true;
  });
  afterAll(async () => {
    try {
      if (created) await db.current().execute(sql`DROP TABLE ${table}`);
    } finally {
      await db.close();
    }
  });
  test('CRUD, 조건 및 페이지네이션', async () => {
    const id = await query.add({ name: 'first' });
    expect((await query.findByPrimaryKey(id))?.name).toBe('first');
    await query.editByPrimaryKey({ name: 'updated' }, id);
    expect(await query.count(query.eq({ name: 'updated' }))).toBe(1);
    const result = await db.paginate(query.select().where(query.eq({ user_id: id })), 1, 10);
    expect(result.data).toHaveLength(1);
    await query.removeByPrimaryKey(id);
    expect(await query.existsByPrimaryKey(id)).toBe(false);
  });
  test('설정한 컬럼에 생성 및 수정 시각을 입력한다', async () => {
    const id = await query.add({ name: 'dated' });
    const row = await query.findByPrimaryKey(id);
    expect(row).toMatchObject({ created_at: 'now', updated_at: 'now' });
    await query.editByPrimaryKey({ name: 'dated-2' }, id);
    expect((await query.findByPrimaryKey(id))?.updated_at).toBe('now');
  });
  test('등록 시 직접 지정한 시각을 유지하고 누락된 시각은 자동 입력한다', async () => {
    const id = await query.add({ name: 'manual-time', created_at: 'created', updated_at: 'updated' });
    expect(await query.findByPrimaryKey(id)).toMatchObject({ created_at: 'created', updated_at: 'updated' });
    await query.editByPrimaryKey({ name: 'manual-time-edited' }, id);
    expect(await query.findByPrimaryKey(id)).toMatchObject({ created_at: 'created', updated_at: 'now' });
    await query.editByPrimaryKey({ updated_at: 'manual-edit' }, id);
    expect(await query.findByPrimaryKey(id)).toMatchObject({ created_at: 'created', updated_at: 'manual-edit' });
    const partialId = await query.add({ name: 'partial-time', created_at: 'created' });
    expect(await query.findByPrimaryKey(partialId)).toMatchObject({ created_at: 'created', updated_at: 'now' });
  });
  test('중첩 트랜잭션 롤백과 원본 Drizzle 접근', async () => {
    await db.trans(async () => {
      await query.add({ name: 'outer' });
      await expect(
        db.trans(async () => {
          await db.current().insert(table).values({ name: 'inner' });
          throw new Error('rollback');
        })
      ).rejects.toThrow('rollback');
      expect(await query.count(query.eq({ name: 'inner' }))).toBe(0);
    });
    expect(await query.count(query.eq({ name: 'outer' }))).toBe(1);
  });
  test('동시 트랜잭션과 서로 다른 연결의 문맥은 독립적이다', async () => {
    const other = drizzleMySql({ url: process.env.DATABASE_URL!, schema: { table }, getTimestamp: () => 'now' });
    try {
      await expect(
        db.trans(async () => {
          await query.add({ name: 'rolled-back' });
          expect(await db.query(table).count(db.eq(table, { name: 'rolled-back' }))).toBe(1);
          expect(await other.query(table).count(other.eq(table, { name: 'rolled-back' }))).toBe(0);
          throw new Error('outer rollback');
        })
      ).rejects.toThrow('outer rollback');
      await Promise.all([
        db.trans(async () => {
          await query.add({ name: 'parallel-a' });
        }),
        db.trans(async () => {
          await query.add({ name: 'parallel-b' });
        }),
      ]);
      expect(await query.count(query.inArray({ name: ['parallel-a', 'parallel-b'] }))).toBe(2);
      expect(await query.count(query.eq({ name: 'rolled-back' }))).toBe(0);
    } finally {
      await other.close();
    }
  });
});
