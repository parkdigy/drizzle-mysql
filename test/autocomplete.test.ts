import ts from 'typescript';
import path from 'node:path';

test.each(['../src/index', '../dist/index'])(
  '%s: 200개 테이블에서도 자동완성과 JOIN 결과 타입을 유지한다',
  (entry) => {
    const file = path.resolve('test/__autocomplete_fixture.ts');
    const wideColumns = Array.from({ length: 200 }, (_, i) => `extra${i}: int('extra${i}')`).join(',');
    const tables = Array.from(
      { length: 200 },
      (_, i) =>
        `const table${i} = mysqlTable('table${i}', { id: int('id').notNull().primaryKey(), name: varchar('name', {length: 100}), ${i === 199 ? wideColumns : ''} });`
    ).join('\n');
    const marked = `
    import { drizzleMySql, mysqlTable, int, varchar } from '${entry}';
    ${tables}
    const db = drizzleMySql({ url: '', getTimestamp: () => 0, schema: {
      ${Array.from({ length: 200 }, (_, i) => `table${i}`).join(',')}
    }});
    drizzleMySql({ host: 'localhost', user: 'test', database: 'example', schema: { table199 } });
    drizzleMySql({ url: 'mysql://localhost/example', connectionLimit: 5, schema: { table199 } });
    const a = db.a.table199('a');
    db./*members*/s;
    db.a./*aliases*/table199;
    // @ts-expect-error 자동완성용 미완성 컬럼명
    db.columns(a, '/*columns*/');
    // @ts-expect-error 자동완성용 미완성 컬럼명
    db.query(a).columns('/*query*/');
    db.eq(a, { /*condition*/ });
    db.eq('table199', { /*namedCondition*/ });
    // @ts-expect-error 연결 별칭 선택의 자동완성용 미완성 컬럼명
    db.select(a, ['/*directFirst*/']);
    // @ts-expect-error 연결 별칭 선택의 자동완성용 미완성 컬럼명
    db.select(a, ['id', '/*directNext*/']);
    // @ts-expect-error 테이블 이름 선택의 자동완성용 미완성 컬럼명
    db.select('table199', ['/*directNamedFirst*/']);
    // @ts-expect-error 테이블 이름 선택의 자동완성용 미완성 컬럼명
    db.select('table199', ['id', '/*directNamedNext*/']);
    const directAliasArray = db.select(a, ['id', 'extra199']);
    type DirectAliasRow = Awaited<typeof directAliasArray>[number];
    const validDirectAliasRow: DirectAliasRow = { id: 1, extra199: null };
    // @ts-expect-error 선택하지 않은 컬럼은 포함하지 않는다
    const invalidDirectAliasRow: DirectAliasRow = { id: 1, extra199: null, name: 'Ada' };
    // @ts-expect-error 선택한 컬럼의 타입을 유지한다
    const invalidDirectAliasValue: DirectAliasRow = { id: 'wrong', extra199: null };
    void [validDirectAliasRow, invalidDirectAliasRow, invalidDirectAliasValue];
    const directSelected = db.select('table199', ['id', 'name']);
    const directAlias = db.select(a, (q) => q.columns('id', 'name'));
    const directRow: { id: number; name: string | null } = {} as Awaited<typeof directSelected>[number];
    const directAliasRow: { id: number; name: string | null } = {} as Awaited<typeof directAlias>[number];
    // @ts-expect-error 선택하지 않은 컬럼은 포함하지 않는다
    ({} as Awaited<typeof directSelected>[number]).extra0;
    void [directRow, directAliasRow];
    const b = db.a.table199('b');
    const c = db.a.table199('c');
    const d = db.a.table199('d');
    const e = db.a.table199('e');
    const joined = db.query(table199).select(a, [
      db.columns(b, 'id'), { second: c.id }, { third: d.id }, { fourth: e.id },
    ]).innerJoin(b, db.eq(a.id, b.id))
      .innerJoin(c, db.eq(b.id, c.id))
      .innerJoin(d, db.eq(c.id, d.id))
      .innerJoin(e, db.eq(d.id, e.id))
      .where(db.eq(a.id, 0));
    type JoinedRow = Awaited<typeof joined>[number];
    const joinedRow: JoinedRow = { id: 1, second: 2, third: 3, fourth: 4 };
    // @ts-expect-error JOIN 후에도 컬럼 타입을 유지한다
    const invalidJoinedRow: JoinedRow = { id: 'wrong', second: 2, third: 3, fourth: 4 };
    const outer = db.query(table199).select(a, [{ base: a.id }, { left: b.id }, { inner: c.id }])
      .leftJoin(b, db.eq(a.id, b.id)).innerJoin(c, db.eq(a.id, c.id));
    type OuterRow = Awaited<typeof outer>[number];
    const outerRow: OuterRow = { base: 1, left: null, inner: 3 };
    // @ts-expect-error INNER JOIN은 앞선 LEFT JOIN의 null 허용 상태를 유지한다
    const invalidOuterRow: OuterRow = { base: null, left: 2, inner: 3 };
    const right = db.query(table199).select(a, [{ base: a.id }, { first: b.id }, { last: c.id }])
      .innerJoin(b, db.eq(a.id, b.id)).rightJoin(c, db.eq(a.id, c.id));
    const rightRow: Awaited<typeof right>[number] = { base: null, first: null, last: 1 };
    void [joinedRow, invalidJoinedRow, outerRow, invalidOuterRow, rightRow];
    const query = db.query(table199);
    // @ts-expect-error 자동완성용 미완성 조건 키
    query.eq({ i/*queryEq*/ });
    // @ts-expect-error and 객체 안에 and를 다시 넣을 수 없다
    query.and({ and: {} });
    // @ts-expect-error or 객체 안에 or를 다시 넣을 수 없다
    query.or({ or: {} });
    query.select().where((q) => {
      // @ts-expect-error q.and 객체 안에 and를 다시 넣을 수 없다
      return q.and({ and: {} });
    });
    query.select().where((q) => {
      // @ts-expect-error q.or 객체 안에 or를 다시 넣을 수 없다
      return q.or({ or: {} });
    });
    const j = query.select(['id', 'name']).limit(1).orderBy(query.desc('id')).as('j');
    // @ts-expect-error 서브쿼리 선택 콜백의 자동완성용 미완성 컬럼명
    db.select(j, (q) => q.columns('id', '/*subquerySelect*/'));
    // @ts-expect-error 서브쿼리 첫 컬럼의 자동완성용 미완성 컬럼명
    db.columns(j, '/*subqueryFirst*/');
    // @ts-expect-error 서브쿼리 다음 컬럼의 자동완성용 미완성 컬럼명
    db.columns(j, 'id', '/*subqueryNext*/');
    // @ts-expect-error 서브쿼리 추가 컬럼의 자동완성용 미완성 컬럼명
    db.columns(j, 'id', 'name', '/*subqueryThird*/');
    const subqueryFields = db.columns(j, 'id');
    const subqueryBoth = db.columns(j, 'id', 'name');
    const subqueryId: typeof j.id = subqueryFields.id;
    const subqueryName: typeof j.name = subqueryBoth.name;
    // @ts-expect-error 선택하지 않은 서브쿼리 컬럼은 반환되지 않는다
    subqueryFields.name;
    // @ts-expect-error 선택되지 않은 서브쿼리 컬럼은 허용하지 않는다
    db.columns(j, 'extra0');
    const selected = query.select({ renamed: 'id' });
    const merged = query.select([query.columns('id'), { label: table199.name }]);
    const aliased = query.select(a, ['id', 'name as displayName']);
    const found = query.find({ renamed: 'id' });
    // @ts-expect-error 자동완성용 미완성 조건 키
    query.find({ idLabel: 'id', nameLabel: 'name' }, q => q.eq({ i/*findCondition*/ }));
    query.find({ idLabel: 'id' }, q => q.eq('id', 1));
    // @ts-expect-error edit의 자동완성용 미완성 조건 키
    query.edit({ name: 'Ada' }, q => q.eq({ i/*editCondition*/ }));
    const foundByKey = query.findByPrimaryKey({ renamed: 'id' }, 1);
    type Row = Awaited<typeof selected>[number];
    const row: Row = { renamed: 1 };
    // @ts-expect-error 선택 결과는 숫자 타입을 유지한다
    const invalidRow: Row = { renamed: 'wrong' };
    // @ts-expect-error 존재하지 않는 컬럼은 허용하지 않는다
    query.select(['missing']);
    void [merged, aliased, found, foundByKey, row, invalidRow, subqueryId, subqueryName];
    const fields = db.columns(a, 'id', 'name as displayName');
    db.current().select(fields).from(a).then((rows: {id: number; displayName: string | null}[]) => {
      const row: {id: number; displayName: string | null} = rows[0]!;
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
    noUncheckedIndexedAccess: true,
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
        directNamedFirst: ['id', 'name', 'extra0', 'extra199'],
        directNamedNext: ['id', 'name', 'extra0', 'extra199'],
        directFirst: ['id', 'name', 'extra0', 'extra199'],
        directNext: ['id', 'name', 'extra0', 'extra199'],
        members: ['columns', 'query', 'current', 'eq'],
        aliases: ['table0', 'table199'],
        columns: ['id', 'name'],
        subquerySelect: ['id', 'name'],
        subqueryFirst: ['id', 'name'],
        subqueryNext: ['id', 'name'],
        subqueryThird: ['id', 'name'],
        query: ['id', 'name'],
        condition: ['id', 'name'],
        queryEq: ['id'],
        namedCondition: ['id', 'name'],
        findCondition: ['id'],
        editCondition: ['id'],
      })) {
        const entries = service.getCompletionsAtPosition(file, positions[name]!, {})?.entries.map((entry) => entry.name);
        expect({ name, entries }).toEqual({ name, entries: expect.arrayContaining(expected) });
      }
      const diagnostics = service.getSemanticDiagnostics(file);
      expect(diagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'))).toEqual([]);
    } finally {
      service.dispose();
    }
  },
  30000
);
