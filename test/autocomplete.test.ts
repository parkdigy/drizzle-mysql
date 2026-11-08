import ts from 'typescript';
import path from 'node:path';

test('200개 테이블에서도 공개 API의 자동완성과 선택 결과 타입을 유지한다', () => {
  const file = path.resolve('test/__autocomplete_fixture.ts');
  const tables = Array.from(
    { length: 200 },
    (_, i) => `const table${i} = mysqlTable('table${i}', { id: int('id').notNull(), name: varchar('name', {length: 100}) });`
  ).join('\n');
  const marked = `
    import { drizzleMySql, mysqlTable, int, varchar } from '../src/index';
    ${tables}
    const db = drizzleMySql({ url: '', getTimestamp: () => 0, schema: {
      ${Array.from({ length: 200 }, (_, i) => `table${i}`).join(',')}
    }});
    const a = db.a.table199('a');
    db./*members*/s;
    db.a./*aliases*/table199;
    // @ts-expect-error 자동완성용 미완성 컬럼명
    db.columns(a, '/*columns*/');
    // @ts-expect-error 자동완성용 미완성 컬럼명
    db.query(a).columns('/*query*/');
    db.eq(a, { /*condition*/ });
    db.eq('table199', { /*namedCondition*/ });
    const fields = db.columns(a, 'id', 'name as displayName');
    db.current().select(fields).from(a).then((rows: {id: number; displayName: string | null}[]) => {
      const row: {id: number; displayName: string | null} = rows[0];
      void row;
    });
    // @ts-expect-error 존재하지 않는 컬럼은 허용하지 않는다
    db.columns(a, 'missing');
  `;
  const positions: Record<string, number> = {};
  let removed = 0;
  const source = marked.replace(/\/\*(\w+)\*\//g, (match, name: string, offset: number) => {
    positions[name] = offset - removed;
    removed += match.length;
    return '';
  });
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
    skipLibCheck: true,
    noEmit: true,
  };
  const host: ts.LanguageServiceHost = {
    getScriptFileNames: () => [file],
    getScriptVersion: () => '1',
    getScriptSnapshot: (name) => {
      const content = name === file ? source : ts.sys.readFile(name);
      return content === undefined ? undefined : ts.ScriptSnapshot.fromString(content);
    },
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getCompilationSettings: () => options,
    getDefaultLibFileName: ts.getDefaultLibFilePath,
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
  };
  const service = ts.createLanguageService(host);
  try {
    for (const [name, expected] of Object.entries({
      members: ['columns', 'query', 'current', 'eq'],
      aliases: ['table0', 'table199'],
      columns: ['id', 'name'],
      query: ['id', 'name'],
      condition: ['id', 'name'],
      namedCondition: ['id', 'name'],
    })) {
      const entries = service.getCompletionsAtPosition(file, positions[name], {})?.entries.map((entry) => entry.name);
      expect({ name, entries }).toEqual({ name, entries: expect.arrayContaining(expected) });
    }
    const diagnostics = service.getSemanticDiagnostics(file);
    expect(diagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'))).toEqual([]);
  } finally {
    service.dispose();
  }
}, 30000);
