import { drizzleMySql, mysqlTable, varchar } from '../src';

const table1 = mysqlTable('table1', { name: varchar('name', { length: 50 }).notNull() });
const table2 = mysqlTable('table2', { name: varchar('name', { length: 50 }).notNull() });

// DB 커밋 자체가 아닌 트랜잭션 생성, 쿼리 연결, 문맥 복원을 검증하는 모의 실행기다.
function setup() {
  const db = drizzleMySql({ url: '', schema: { table1, table2 } });
  const raw = db.current();
  const events: string[] = [];
  const committed: unknown[] = [];
  let sequence = 0;
  const transaction = jest.spyOn(raw, 'transaction').mockImplementation((async (
    callback: (tx: unknown) => Promise<unknown>
  ) => {
    const id = ++sequence;
    const pending: unknown[] = [];
    const tx = {
      insert: (table: unknown) => ({
        values: async (value: unknown) => {
          pending.push({ table, value });
        },
      }),
    };
    events.push(`begin:${id}`);
    try {
      const result = await callback(tx);
      committed.push(...pending);
      events.push(`commit:${id}`);
      return result;
    } catch (error) {
      events.push(`rollback:${id}`);
      throw error;
    }
  }) as never);
  return { db, raw, events, committed, transaction };
}

test('안쪽은 독립 커밋하고 바깥 실패 시 바깥 변경만 롤백한다', async () => {
  const { db, raw, events, committed, transaction } = setup();
  try {
    await expect(
      db.trans(async () => {
        const outer = db.current();
        await db.query(table1).add({ name: 'name-1' });
        const result = await db.trans(async () => {
          expect(db.current()).not.toBe(outer);
          await db.query(table2).add({ name: 'name-2' });
          return 42;
        });
        expect(result).toBe(42);
        expect(db.current()).toBe(outer);
        throw new Error('nono');
      })
    ).rejects.toThrow('nono');
    expect(events).toEqual(['begin:1', 'begin:2', 'commit:2', 'rollback:1']);
    expect(committed).toEqual([{ table: table2, value: { name: 'name-2' } }]);
    expect(db.current()).toBe(raw);
  } finally {
    transaction.mockRestore();
  }
});

test.each([true, false])('안쪽 오류를 처리하는지(%s)에 따라 바깥 커밋 여부를 결정한다', async (caught) => {
  const { db, raw, events, committed, transaction } = setup();
  try {
    const run = db.trans(async () => {
      const outer = db.current();
      await db.query(table1).add({ name: 'name-1' });
      try {
        await db.trans(async () => {
          await db.query(table2).add({ name: 'name-2' });
          throw new Error('inner');
        });
      } catch (error) {
        expect(db.current()).toBe(outer);
        if (!caught) throw error;
      }
    });
    if (caught) await expect(run).resolves.toBeUndefined();
    else await expect(run).rejects.toThrow('inner');
    expect(events).toEqual(['begin:1', 'begin:2', 'rollback:2', caught ? 'commit:1' : 'rollback:1']);
    expect(committed).toEqual(caught ? [{ table: table1, value: { name: 'name-1' } }] : []);
    expect(db.current()).toBe(raw);
  } finally {
    transaction.mockRestore();
  }
});
