import { boolean, datetime, int, mysqlTable, varchar } from '../../../src';

export const testData = mysqlTable('test_data', {
  id: int({ unsigned: true }).autoincrement().primaryKey(),
  name: varchar({ length: 50 }).notNull(),
  email: varchar({ length: 100 }).notNull(),
  is_lock: boolean().notNull().default(false),
  create_date: datetime().notNull().createdAt(),
  update_date: datetime().notNull().updatedAt(),
});
