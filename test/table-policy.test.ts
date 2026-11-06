import { sql } from 'drizzle-orm';
import ts from 'typescript';
import { getTableConfig, mysqlTable as nativeTable, type MySqlTable } from 'drizzle-orm/mysql-core';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import { drizzleMySql, index, int, mysqlTable, MySqlQuery, varchar, type TablePolicy } from '../src';

test('빈 정책 객체에서 수정·삭제 금지 옵션을 자동완성한다', () => {
  const file = `${process.cwd()}/test/table-policy-completion.ts`;
  const source = [
    "import { mysqlTable, int, index } from '../src';",
    "mysqlTable('third', { id: int() }, { /* third */ });",
    "mysqlTable('fourth', { id: int() }, t => [index('id_idx').on(t.id)], { /* fourth */ });",
    "mysqlTable('prefix', { id: int() }, { up/* prefix */ });",
    "mysqlTable('incomplete', { id: int() }, { /* incomplete */",
  ].join('\n');
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
    skipLibCheck: true,
  };
  const host: ts.LanguageServiceHost = {
    getScriptFileNames: () => [file],
    getScriptVersion: () => '0',
    getScriptSnapshot: (path) => {
      const text = path === file ? source : ts.sys.readFile(path);
      return text === undefined ? undefined : ts.ScriptSnapshot.fromString(text);
    },
    getCurrentDirectory: () => process.cwd(),
    getCompilationSettings: () => options,
    getDefaultLibFileName: ts.getDefaultLibFilePath,
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
  };
  const service = ts.createLanguageService(host);
  try {
    for (const marker of ['/* third */', '/* fourth */', '/* prefix */', '/* incomplete */']) {
      const completions = service.getCompletionsAtPosition(file, source.indexOf(marker), {});
      expect(completions?.entries.map((entry) => entry.name)).toEqual(
        expect.arrayContaining(['updateBlocked', 'deleteBlocked'])
      );
    }
  } finally {
    service.dispose();
  }
});

const columns = () => ({
  id: int().autoincrement().primaryKey(),
  name: varchar({ length: 50 }).notNull().updateAllowed(),
});
const logs = mysqlTable('logs', columns(), { updateBlocked: true, deleteBlocked: true });
const indexedLogs = mysqlTable(
  'indexed_logs',
  (types) => ({
    id: types.int().autoincrement().primaryKey(),
    name: types.varchar({ length: 50 }).notNull().updateAllowed(),
  }),
  (t) => [index('logs_name_idx').on(t.name)],
  { updateBlocked: true, deleteBlocked: true }
);
const updateOnly = mysqlTable('update_only', columns(), { deleteBlocked: true });
const deleteOnly = mysqlTable('delete_only', columns(), { updateBlocked: true });
const unrestricted = mysqlTable('unrestricted', columns(), { updateBlocked: false, deleteBlocked: false });

function checkTypes(current: () => MySql2Database) {
  const query = new MySqlQuery(logs, current);
  query.add({ name: 'x' });
  query.add([{ name: 'x' }]);
  query.select();
  query.findByPrimaryKey(1);
  // @ts-expect-error 테이블의 수정 금지는 컬럼의 updateAllowed보다 우선한다.
  query.edit({ name: 'x' }, sql`1 = 1`);
  // @ts-expect-error 기본 키 수정도 차단한다.
  query.editByPrimaryKey({ name: 'x' }, 1);
  // @ts-expect-error 삭제를 차단한다.
  query.remove(sql`1 = 1`);
  // @ts-expect-error 기본 키 삭제도 차단한다.
  query.removeByPrimaryKey(1);
  const indexed = new MySqlQuery(indexedLogs, current);
  // @ts-expect-error 네 번째 인자의 수정 금지도 타입에 적용한다.
  indexed.edit({ name: 'x' }, sql`1 = 1`);
  // @ts-expect-error 네 번째 인자의 삭제 금지도 타입에 적용한다.
  indexed.removeByPrimaryKey(1);
  new MySqlQuery(updateOnly, current).editByPrimaryKey({ name: 'x' }, 1);
  const updateBlocked = new MySqlQuery(deleteOnly, current);
  // @ts-expect-error 세 번째 인자에 updateBlocked만 지정해도 수정을 차단한다.
  updateBlocked.edit({ name: 'x' }, sql`1 = 1`);
  // @ts-expect-error 세 번째 인자에 updateBlocked만 지정해도 기본 키 수정을 차단한다.
  updateBlocked.editByPrimaryKey({ name: 'x' }, 1);
  updateBlocked.remove(sql`1 = 1`);
  updateBlocked.removeByPrimaryKey(1);
  const allowed = new MySqlQuery(unrestricted, current);
  allowed.edit({ name: 'x' }, sql`1 = 1`);
  allowed.editByPrimaryKey({ name: 'x' }, 1);
  allowed.remove(sql`1 = 1`);
  allowed.removeByPrimaryKey(1);
  const plain = nativeTable('plain', columns());
  new MySqlQuery(plain, current).edit({ name: 'x' }, sql`1 = 1`);
  const db = drizzleMySql({
    url: 'mysql://localhost/example',
    schema: { logs, indexedLogs, unrestricted },
    getTimestamp: () => 'now',
  });
  // @ts-expect-error db.query에서도 테이블의 수정 금지를 유지한다.
  db.query(logs).editByPrimaryKey({ name: 'x' }, 1);
  // @ts-expect-error db.query에서도 테이블의 삭제 금지를 유지한다.
  db.query(indexedLogs).remove(sql`1 = 1`);
  db.query(unrestricted).removeByPrimaryKey(1);
}
void checkTypes;

test('스키마 키 기반 중간 클래스를 상속해도 테이블 정책을 타입에서 유지한다', () => {
  const schema = { logs, deleteOnly, unrestricted };
  const current = jest.fn<ReturnType<() => MySql2Database>, []>();
  abstract class Query<K extends keyof typeof schema> extends MySqlQuery<(typeof schema)[K]> {
    constructor(key: K) {
      super(schema[key], current);
    }
  }
  class LogsQuery extends Query<'logs'> {
    check() {
      const values = this.updateValues({ name: 'x' });
      // @ts-expect-error 상속 클래스 내부의 this에서도 수정 금지를 유지한다.
      this.edit(values, sql`1 = 1`);
      // @ts-expect-error 상속 클래스 내부의 기본 키 수정도 차단한다.
      this.editByPrimaryKey(values, 1);
      // @ts-expect-error 상속 클래스 내부의 삭제도 차단한다.
      this.remove(sql`1 = 1`);
      // @ts-expect-error 상속 클래스 내부의 기본 키 삭제도 차단한다.
      this.removeByPrimaryKey(1);
    }
  }
  class UpdateBlockedQuery extends Query<'deleteOnly'> {
    check() {
      const values = this.updateValues({ name: 'x' });
      // @ts-expect-error updateBlocked만 선언한 상속 클래스에서도 차단한다.
      this.editByPrimaryKey(values, 1);
      this.removeByPrimaryKey(1);
    }
  }
  class AllowedQuery extends Query<'unrestricted'> {
    check() {
      this.editByPrimaryKey(this.updateValues({ name: 'x' }), 1);
      this.removeByPrimaryKey(1);
    }
  }
  void [LogsQuery, UpdateBlockedQuery, AllowedQuery];
  expect(current).not.toHaveBeenCalled();
});

test.each([logs, indexedLogs])('DB와 조건 콜백 접근 전에 수정·삭제를 거부한다: %s', (table) => {
  const current = jest.fn<ReturnType<() => MySql2Database>, []>();
  const where = jest.fn(() => sql`1 = 1`);
  // 型情報を失った呼び出しでも実行時のポリシーを適用する。
  const query = new MySqlQuery<MySqlTable>(table, current);
  expect(() => query.edit({ name: 'x' }, where)).toThrow(
    `edit: update is blocked for table "${getTableConfig(table).name}"`
  );
  expect(() => query.editByPrimaryKey({ name: 'x' }, 1)).toThrow('editByPrimaryKey: update is blocked');
  expect(() => query.remove(where)).toThrow('remove: delete is blocked');
  expect(() => query.removeByPrimaryKey(1)).toThrow('removeByPrimaryKey: delete is blocked');
  expect(where).not.toHaveBeenCalled();
  expect(current).not.toHaveBeenCalled();
});

test('登録・配列登録・参照とインデックス設定を維持する', async () => {
  const insert = jest.fn(() => ({
    values: jest.fn(() => ({ $returningId: async () => [{ id: 7 }] })),
  }));
  const from = jest.fn(() => 'select builder');
  const select = jest.fn(() => ({ from }));
  const current = () => ({ insert, select }) as unknown as MySql2Database;
  for (const table of [logs, indexedLogs]) {
    const query = new MySqlQuery(table, current);
    expect(await query.add({ name: 'x' })).toBe(7);
    expect(await query.add([{ name: 'x' }])).toEqual([7]);
    expect(query.select()).toBe('select builder');
    expect(from).toHaveBeenLastCalledWith(table);
  }
  expect(getTableConfig(indexedLogs).indexes[0].config.name).toBe('logs_name_idx');
});

test('省略・false・片方だけのポリシーと既存の設定コールバックを維持する', async () => {
  const oldConfig = mysqlTable('old_config', columns(), (t) => ({
    nameIndex: index('old_name_idx').on(t.name),
  }));
  const noPolicy = mysqlTable('no_policy', columns());
  const undefinedConfig = mysqlTable('undefined_config', columns(), undefined, { updateBlocked: true });
  const options: TablePolicy = { updateBlocked: true };
  const dynamic = mysqlTable('dynamic', columns(), options);
  options.updateBlocked = false;
  const where = jest.fn(() => Promise.resolve());
  const update = jest.fn(() => ({ set: () => ({ where }) }));
  const remove = jest.fn(() => ({ where }));
  const current = () => ({ update, delete: remove }) as unknown as MySql2Database;
  for (const table of [oldConfig, noPolicy, unrestricted]) {
    const query = new MySqlQuery(table, current);
    await query.edit({ name: 'x' }, sql`1 = 1`);
    await query.editByPrimaryKey({ name: 'x' }, 1);
    await query.remove(sql`1 = 1`);
    await query.removeByPrimaryKey(1);
  }
  await new MySqlQuery(updateOnly, current).editByPrimaryKey({ name: 'x' }, 1);
  await new MySqlQuery(deleteOnly, current).removeByPrimaryKey(1);
  for (const table of [deleteOnly, undefinedConfig, dynamic]) {
    const query = new MySqlQuery<MySqlTable>(table, current);
    expect(() => query.edit({ name: 'x' }, sql`1 = 1`)).toThrow('update is blocked');
  }
  expect(() => new MySqlQuery<MySqlTable>(updateOnly, current).remove(sql`1 = 1`)).toThrow('delete is blocked');
  expect(update).toHaveBeenCalledTimes(7);
  expect(remove).toHaveBeenCalledTimes(7);
  expect(getTableConfig(oldConfig).indexes[0].config.name).toBe('old_name_idx');
});

test('기본 키 편의 메서드는 기존처럼 edit과 remove에 위임한다', async () => {
  const where = () => Promise.resolve();
  const current = () =>
    ({
      update: () => ({ set: () => ({ where }) }),
      delete: () => ({ where }),
    }) as unknown as MySql2Database;
  const query = new MySqlQuery(unrestricted, current);
  const edit = jest.spyOn(query, 'edit');
  const remove = jest.spyOn(query, 'remove');
  await query.editByPrimaryKey({ name: 'x' }, 1);
  await query.removeByPrimaryKey(1);
  expect(edit).toHaveBeenCalledTimes(1);
  expect(remove).toHaveBeenCalledTimes(1);
});
