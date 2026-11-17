import { int, mysqlTable } from 'drizzle-orm/mysql-core';
import type { SQL } from 'drizzle-orm';
import { avg, avgDistinct, drizzleMySql, sum, sumDistinct } from '../src';

const table = mysqlTable('aggregate_values', { id: int('id') });
const db = drizzleMySql({ url: 'mysql://example:example@127.0.0.1/example', schema: { table } });
afterAll(() => db.close());

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
function decode(expression: SQL, value: unknown) {
  return (expression as SQL & { decoder: { mapFromDriverValue(value: unknown): unknown } }).decoder.mapFromDriverValue(value);
}

for (const [name, aggregate] of Object.entries({ sum, sumDistinct, avg, avgDistinct })) {
  test(`${name}: 매퍼로 값과 조회 결과 타입을 변환하고 SQL을 유지한다`, () => {
    const numeric = aggregate(table.id, Number);
    const custom = aggregate(table.id, { mapFromDriverValue: (value: string) => ({ value }) });
    const callback = aggregate(table.id, (value: string) => value.length > 0);
    const query = db.select(table, { numeric, custom, callback });
    type Row = Awaited<typeof query>[number];
    const numericType: Equal<Row['numeric'], number | null> = true;
    const customType: Equal<Row['custom'], { value: string } | null> = true;
    const callbackType: Equal<Row['callback'], boolean | null> = true;
    expect([numericType, customType, callbackType]).toEqual([true, true, true]);
    expect(decode(numeric, '12.5')).toBe(12.5);
    expect(decode(custom, '12.5')).toEqual({ value: '12.5' });
    expect(decode(callback, '12.5')).toBe(true);
    const sqlName = name.startsWith('sum') ? 'sum' : 'avg';
    const distinct = name.endsWith('Distinct') ? 'distinct ' : '';
    expect(query.toSQL().sql).toContain(`${sqlName}(${distinct}\`id\`)`);
    expect(decode(db[name as 'sum'](table.id, Number), '12.5')).toBe(12.5);
  });
}

// 실행 없이 필수 인자와 잘못된 매퍼를 타입 검사한다.
function checkRequiredDecoders() {
  for (const aggregate of [sum, sumDistinct, avg, avgDistinct, db.sum, db.sumDistinct, db.avg, db.avgDistinct]) {
    // @ts-expect-error 두 번째 인자는 필수다.
    aggregate(table.id);
    // @ts-expect-error undefined는 매퍼가 아니다.
    aggregate(table.id, undefined);
    // @ts-expect-error 객체에는 mapFromDriverValue가 필요하다.
    aggregate(table.id, {});
  }
}
void checkRequiredDecoders;
