import path from 'node:path';
import ts from 'typescript';

const fileName = path.resolve('test/values-types.fixture.ts');
const source = `
import { int, mysqlTable, varchar } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import type { MySqlAddValues, MySqlEditValues } from '../src';

const adminGroup = mysqlTable('admin_group', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('group_name', { length: 100 }).notNull(),
  description: varchar('description', { length: 255 }),
  generated: int('generated').generatedAlwaysAs(sql\`1\`),
});
type AdminGroup = typeof adminGroup;

// @ts-expect-error Empty strings are incomplete column names.
type InsertCompletion = MySqlAddValues<AdminGroup, '' /* insert */>;
// @ts-expect-error Empty strings are incomplete column names.
type UpdateCompletion = MySqlEditValues<AdminGroup, '' /* update */>;
// @ts-expect-error Empty strings are incomplete column names.
type InsertUnionCompletion = MySqlAddValues<AdminGroup, 'id' | '' /* insert union */>;
// @ts-expect-error Empty strings are incomplete column names.
type UpdateUnionCompletion = MySqlEditValues<AdminGroup, 'id' | '' /* update union */>;
// @ts-expect-error Empty strings are incomplete column names.
type RequiredCompletion = MySqlEditValues<AdminGroup, 'id', '' /* required */>;

const insert: MySqlAddValues<AdminGroup> = { name: 'Admins' };
const blockedInsert: MySqlAddValues<AdminGroup, 'id'> = { name: 'Admins' };
const update: MySqlEditValues<AdminGroup> = {};
const requiredUpdate: MySqlEditValues<AdminGroup, 'id', 'name'> = { name: 'Admins' };
const expressions: MySqlEditValues<AdminGroup, 'id', 'name'> = { name: sql\`'Admins'\` };
const nullUpdate: MySqlEditValues<AdminGroup, 'id', 'description'> = { description: null };
// @ts-expect-error Required insert columns remain required.
const missingInsert: MySqlAddValues<AdminGroup> = {};
// @ts-expect-error Blocked columns cannot be inserted.
const invalidInsert: MySqlAddValues<AdminGroup, 'id'> = { id: 1, name: 'Admins' };
// @ts-expect-error Blocked columns cannot be updated.
const invalidUpdate: MySqlEditValues<AdminGroup, 'id'> = { id: 1 };
// @ts-expect-error Required update columns cannot be omitted.
const missingUpdate: MySqlEditValues<AdminGroup, 'id', 'name'> = {};
// @ts-expect-error Required update columns cannot be undefined.
const undefinedUpdate: MySqlEditValues<AdminGroup, 'id', 'name'> = { name: undefined };
// @ts-expect-error Unknown columns cannot be blocked.
type UnknownInsert = MySqlAddValues<AdminGroup, 'unknown'>;
// @ts-expect-error Unknown columns cannot be blocked.
type UnknownUpdate = MySqlEditValues<AdminGroup, 'unknown'>;
// @ts-expect-error Generated columns are not writable.
type GeneratedInsert = MySqlAddValues<AdminGroup, 'generated'>;
// @ts-expect-error Generated columns are not writable.
type GeneratedUpdate = MySqlEditValues<AdminGroup, 'generated'>;
// @ts-expect-error Blocked columns cannot also be required.
type BlockedRequired = MySqlEditValues<AdminGroup, 'id', 'id'>;
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
