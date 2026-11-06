import path from 'node:path';
import ts from 'typescript';

const fileName = path.resolve('test/values-types.fixture.ts');
const source = `
import { int, mysqlTable, varchar } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import type { MySqlInsertValues, MySqlUpdateValues } from '../src';

const adminGroup = mysqlTable('admin_group', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('group_name', { length: 100 }).notNull(),
  description: varchar('description', { length: 255 }),
  generated: int('generated').generatedAlwaysAs(sql\`1\`),
});
type AdminGroup = typeof adminGroup;

// @ts-expect-error Empty strings are incomplete column names.
type InsertCompletion = MySqlInsertValues<AdminGroup, '' /* insert */>;
// @ts-expect-error Empty strings are incomplete column names.
type UpdateCompletion = MySqlUpdateValues<AdminGroup, '' /* update */>;
// @ts-expect-error Empty strings are incomplete column names.
type InsertUnionCompletion = MySqlInsertValues<AdminGroup, 'id' | '' /* insert union */>;
// @ts-expect-error Empty strings are incomplete column names.
type UpdateUnionCompletion = MySqlUpdateValues<AdminGroup, 'id' | '' /* update union */>;
// @ts-expect-error Empty strings are incomplete column names.
type RequiredCompletion = MySqlUpdateValues<AdminGroup, 'id', '' /* required */>;

const insert: MySqlInsertValues<AdminGroup> = { name: 'Admins' };
const blockedInsert: MySqlInsertValues<AdminGroup, 'id'> = { name: 'Admins' };
const update: MySqlUpdateValues<AdminGroup> = {};
const requiredUpdate: MySqlUpdateValues<AdminGroup, 'id', 'name'> = { name: 'Admins' };
const expressions: MySqlUpdateValues<AdminGroup, 'id', 'name'> = { name: sql\`'Admins'\` };
const nullUpdate: MySqlUpdateValues<AdminGroup, 'id', 'description'> = { description: null };
// @ts-expect-error Required insert columns remain required.
const missingInsert: MySqlInsertValues<AdminGroup> = {};
// @ts-expect-error Blocked columns cannot be inserted.
const invalidInsert: MySqlInsertValues<AdminGroup, 'id'> = { id: 1, name: 'Admins' };
// @ts-expect-error Blocked columns cannot be updated.
const invalidUpdate: MySqlUpdateValues<AdminGroup, 'id'> = { id: 1 };
// @ts-expect-error Required update columns cannot be omitted.
const missingUpdate: MySqlUpdateValues<AdminGroup, 'id', 'name'> = {};
// @ts-expect-error Required update columns cannot be undefined.
const undefinedUpdate: MySqlUpdateValues<AdminGroup, 'id', 'name'> = { name: undefined };
// @ts-expect-error Unknown columns cannot be blocked.
type UnknownInsert = MySqlInsertValues<AdminGroup, 'unknown'>;
// @ts-expect-error Unknown columns cannot be blocked.
type UnknownUpdate = MySqlUpdateValues<AdminGroup, 'unknown'>;
// @ts-expect-error Generated columns are not writable.
type GeneratedInsert = MySqlInsertValues<AdminGroup, 'generated'>;
// @ts-expect-error Generated columns are not writable.
type GeneratedUpdate = MySqlUpdateValues<AdminGroup, 'generated'>;
// @ts-expect-error Blocked columns cannot also be required.
type BlockedRequired = MySqlUpdateValues<AdminGroup, 'id', 'id'>;
`;

const options: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  strict: true,
  skipLibCheck: true,
  types: [],
};
const service = ts.createLanguageService({
  getScriptFileNames: () => [fileName],
  getScriptVersion: () => '0',
  getScriptSnapshot: (name) => {
    const text = name === fileName ? source : ts.sys.readFile(name);
    return text === undefined ? undefined : ts.ScriptSnapshot.fromString(text);
  },
  getCurrentDirectory: () => process.cwd(),
  getCompilationSettings: () => options,
  getDefaultLibFileName: ts.getDefaultLibFilePath,
  fileExists: ts.sys.fileExists,
  readFile: ts.sys.readFile,
  readDirectory: ts.sys.readDirectory,
  getDirectories: ts.sys.getDirectories,
});

afterAll(() => service.dispose());

test.each(['insert', 'update', 'insert union', 'update union', 'required'])(
  '%s 제네릭 문자열에서 입력 가능한 컬럼을 자동완성한다',
  (marker) => {
    const position = source.indexOf(`'' /* ${marker} */`) + 1;
    const names = service.getCompletionsAtPosition(fileName, position, {})?.entries.map((entry) => entry.name);
    const expected = marker === 'required' || marker.endsWith('union') ? ['name', 'description'] : ['id', 'name', 'description'];
    expect(names).toEqual(expect.arrayContaining(expected));
    expect(names).not.toContain('generated');
    expect(names).not.toContain('group_name');
    if (marker === 'required') expect(names).not.toContain('id');
  }
);

test('등록·수정 값의 필수, 금지 및 생성 컬럼 제약을 유지한다', () => {
  const diagnostics = [...service.getSyntacticDiagnostics(fileName), ...service.getSemanticDiagnostics(fileName)];
  expect(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: (name) => name,
    getCurrentDirectory: () => process.cwd(),
    getNewLine: () => '\n',
  })).toBe('');
});
