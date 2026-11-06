import { sql } from 'drizzle-orm';

import { int, varchar, mysqlTable, MySqlQuery, type MySqlInsertValues, type MySqlUpdateValues } from '../src';
import type { MySql2Database } from 'drizzle-orm/mysql2';

const table = mysqlTable('policy_test', {
  id: int().autoincrement().primaryKey(),
  allowed: int().autoincrement().insertAllowed().updateAllowed(),
  name: varchar({ length: 50 }).notNull(),
  secret: varchar({ length: 50 }).insertBlocked(),
  locked: int().updateBlocked(),
  required: int().updateRequired(),
  created: varchar({ length: 50 }).notNull().createdAt(),
  updated: varchar({ length: 50 }).notNull().updatedAt(),
});
if (false) {
  const validInsert: MySqlInsertValues<typeof table> = { name: 'x', allowed: 3 };
  const validUpdate: MySqlUpdateValues<typeof table> = { required: 1, allowed: 2 };
  // @ts-expect-error 자동 증가 컬럼은 기본적으로 입력이 금지된다.
  const badInsert: MySqlInsertValues<typeof table> = { name: 'x', id: 1 };
  // @ts-expect-error 지정한 컬럼은 입력이 금지된다.
  const badSecret: MySqlInsertValues<typeof table> = { name: 'x', secret: 'x' };
  // @ts-expect-error 자동 시각 컬럼은 직접 입력할 수 없다.
  const badTime: MySqlInsertValues<typeof table> = { name: 'x', created: 'x' };
  // @ts-expect-error 수정 필수 컬럼이 누락되었다.
  const badUpdate: MySqlUpdateValues<typeof table> = { name: 'x' };
  // @ts-expect-error 수정 금지 컬럼이다.
  const badLocked: MySqlUpdateValues<typeof table> = { required: 1, locked: 2 };
  void [validInsert, validUpdate, badInsert, badSecret, badTime, badUpdate, badLocked];
}

test('컬럼 정책과 시각을 등록 및 수정에 적용한다', async () => {
  const inserted: unknown[] = [];
  const updated: unknown[] = [];
  const fake = {
    insert: () => ({
      values: (value: unknown) => {
        inserted.push(value);
        return { $returningId: async () => [{ id: 7 }] };
      },
    }),
    update: () => ({
      set: (value: unknown) => {
        updated.push(value);
        return { where: () => Promise.resolve() };
      },
    }),
  } as unknown as MySql2Database;
  const query = new MySqlQuery(
    table,
    () => fake,
    () => 'now'
  );
  await query.add({ name: 'x', allowed: 3 });
  expect(inserted).toEqual([{ name: 'x', allowed: 3, created: 'now', updated: 'now' }]);
  await query.edit({ required: 1 }, sql`1 = 1`);
  expect(updated).toEqual([{ required: 1, updated: 'now' }]);
  expect(() => query.edit({ required: 1, locked: 2 } as never, sql`1 = 1`)).toThrow('locked');
  expect(() => query.edit({} as never, sql`1 = 1`)).toThrow('required');
  expect(() => query.add({ name: 'x', id: 1 } as never)).toThrow('id');
});
