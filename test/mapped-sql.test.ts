import { drizzle } from 'drizzle-orm/mysql2';
import { drizzleMySql, int, mysqlTable } from '../src';

const table = mysqlTable('items', { id: int('id').notNull() });
const db = drizzleMySql({ url: '', schema: { table } });
afterAll(() => db.close());

test('매핑 SQL 태그는 기존 db.sql 호출과 동일한 SQL 및 바인딩을 생성한다', () => {
  const tagged = db
    .query(table)
    .select({
      number: db.sqlNumber`${table.id} + ${1}`,
      boolean: db.sqlBoolean`${table.id}`,
      string: db.sqlString`concat(${table.id}, ${"a'b"}, ${db.sql`${2} + 3`})`,
    })
    .toSQL();
  const original = db
    .query(table)
    .select({
      number: db.sqlNumber(db.sql`${table.id} + ${1}`),
      boolean: db.sqlBoolean(db.sql`${table.id}`),
      string: db.sqlString(db.sql`concat(${table.id}, ${"a'b"}, ${db.sql`${2} + 3`})`),
    })
    .toSQL();
  expect(tagged).toEqual(original);
  expect(tagged.params).toEqual([1, "a'b", 2]);
  expect(tagged.sql).toContain('concat(');
  expect(
    db
      .query(table)
      .select({ n: db.sqlNumber`1`, b: db.sqlBoolean`1`, s: db.sqlString`1` })
      .toSQL().params
  ).toEqual([]);
  expect(
    db
      .query(table)
      .select({ n: db.sqlNumber(1), b: db.sqlBoolean(true), s: db.sqlString('x') })
      .toSQL().params
  ).toEqual([1, true, 'x']);
});

test.each([true, false, 1, 0, '1', null])('매핑 SQL 태그는 기존 결과 변환 규칙을 유지한다 (%s)', async (value) => {
  const database = drizzle({
    client: {
      query: async () => [[[value, value, value]], []],
    } as never,
  });
  const expressions = { n: db.sqlNumber`${table.id}`, b: db.sqlBoolean`${table.id}`, s: db.sqlString`${table.id}` };
  expect(await database.select(expressions).from(table)).toEqual([
    {
      n: value === null ? null : Number(value),
      b: value === null ? null : value === true || value === 1,
      s: value === null ? null : String(value),
    },
  ]);
});
