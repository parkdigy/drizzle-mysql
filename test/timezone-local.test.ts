import { datetime, drizzleMySql, mysqlTable, timestamp } from '../src';

const dates = mysqlTable('timezone_dates', {
  created: datetime('created').notNull().createdAt(),
  updated: datetime('updated').notNull().updatedAt(),
  stamp: timestamp('stamp'),
});

test.each(['option', 'url'] as const)('local 시간 조회와 트랜잭션 조회가 로컬 Date를 반환한다 (%s)', async (mode) => {
  const db = drizzleMySql({
    url: mode === 'url' ? 'mysql://localhost/test?timezone=local' : 'mysql://localhost/test',
    ...(mode === 'option' ? { timezone: 'local' } : {}),
    schema: { dates },
  });
  const pool = db.current().$client;
  if (!('getConnection' in pool)) throw new Error('Expected pool');
  const execute = jest.fn(async () => [[['2026-01-02 08:04:05', '2026-01-02 08:04:05', '2026-01-02 08:04:05']], []]);
  const poolQuery = jest.spyOn(pool, 'query').mockImplementation(execute as never);
  const connection = { beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release: () => {}, query: execute };
  const getConnection = jest.spyOn(pool, 'getConnection').mockResolvedValue(connection as never);
  try {
    for (const rows of [await db.query(dates).select(), await db.trans(() => db.query(dates).select())]) {
      for (const value of [rows[0]?.created, rows[0]?.updated, rows[0]?.stamp]) {
        expect(value).toBeInstanceOf(Date);
        expect(value?.getHours()).toBe(8);
        expect(value?.getMinutes()).toBe(4);
      }
    }
  } finally {
    poolQuery.mockRestore();
    getConnection.mockRestore();
    await db.close();
  }
});

test.each(['option', 'url'] as const)('직접 지정한 Date를 local INSERT와 UPDATE에 반영한다 (%s)', async (mode) => {
  const db = drizzleMySql({
    url: mode === 'url' ? 'mysql://localhost/test?timezone=local' : 'mysql://localhost/test',
    ...(mode === 'option' ? { timezone: 'local' } : {}),
    schema: { dates },
    getTimestamp: () => new Date('2026-01-01T23:04:05.000Z'),
  });
  const value = new Date('2026-01-01T23:04:05.000Z');
  const pad = (n: number) => String(n).padStart(2, '0');
  const expected = `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}.000`;
  const pool = db.current().$client;
  if (!('getConnection' in pool)) throw new Error('Expected pool');
  const calls: unknown[][] = [];
  const mock = jest.spyOn(pool, 'query').mockImplementation((async (_query: unknown, params: unknown[]) => {
    calls.push(params);
    return [{ insertId: 1, affectedRows: 1 }, []];
  }) as never);
  try {
    await db.query(dates).add({ created: value, stamp: value });
    expect(calls[0]).toEqual([expected, expected, expected]);
    const updated = db.query(dates).edit({ updated: value, stamp: value }, db.sql`1 = 1`).toSQL();
    expect(updated.params).toEqual([expected, expected]);
  } finally {
    mock.mockRestore();
    await db.close();
  }
});
