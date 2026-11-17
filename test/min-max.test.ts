import { drizzle } from 'drizzle-orm/mysql2';
import { min as nativeMin, max as nativeMax } from 'drizzle-orm';
import { drizzleMySql, datetime, mysqlTable, min, max } from '../src';

const dates = mysqlTable('dates', { updated: datetime('updated', { mode: 'date' }) });
const db = drizzleMySql({ url: '', schema: { dates } });
const query = db.query(dates);
afterAll(() => db.close());

test.each(['min', 'max'] as const)('%s는 결과 타입을 지정해도 기존 SQL과 값 매핑을 유지한다', async (method) => {
  const aggregate = method === 'min' ? min : max;
  const native = method === 'min' ? nativeMin : nativeMax;
  for (const value of [new Date('2026-01-01T00:00:00Z'), null]) {
    const database = drizzle({
      client: { query: async () => [[[value === null ? null : '2026-01-01 00:00:00']], []] } as never,
    });
    for (const expression of [
      aggregate<Date | null>(dates.updated),
      db[method]<Date | null>(dates.updated),
      query[method]<Date | null>('updated'),
    ]) {
      const selected = database.select({ value: expression }).from(dates);
      expect(selected.toSQL()).toEqual(
        database
          .select({ value: native(dates.updated) })
          .from(dates)
          .toSQL()
      );
      expect(await selected).toEqual([{ value }]);
    }
  }
  expect(() => Reflect.apply(query[method], query, ['missing'])).toThrow('unknown column "missing"');
});
