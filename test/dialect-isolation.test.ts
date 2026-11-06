import { ColumnBuilder } from 'drizzle-orm/column-builder';
import { MySqlColumnBuilder } from 'drizzle-orm/mysql-core/columns/common';
import { MsSqlColumnBuilder } from 'drizzle-orm/mssql-core/columns/common';
import '../src/mysqlTable';

test('컬럼 정책 메서드는 MySQL 빌더에만 설치한다', () => {
  expect(Object.hasOwn(MySqlColumnBuilder.prototype, 'createdAt')).toBe(true);
  expect(Object.hasOwn(ColumnBuilder.prototype, 'createdAt')).toBe(false);
  expect(Object.hasOwn(MsSqlColumnBuilder.prototype, 'createdAt')).toBe(false);
});
