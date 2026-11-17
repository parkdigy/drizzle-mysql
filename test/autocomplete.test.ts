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
    import { drizzleMySql, mysqlTable, int, varchar, datetime, min, max, sum, sumDistinct, coalesce, coalesceNumber, coalesceString, coalesceBoolean, sumNumber, sumBoolean, sumString, sumDistinctNumber, sumDistinctBoolean, sumDistinctString, avgNumber, avgBoolean, avgString, avgDistinctNumber, avgDistinctBoolean, avgDistinctString } from '${entry}';
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
    const dateTable = mysqlTable('date_test', { updated: datetime('updated', { mode: 'date' }) });
    const dateQuery = db.query(dateTable);
    const dateExtrema = dateQuery.select({
      min_val: dateQuery.min<Date>('updated'), max_val: dateQuery.max<Date>('updated'),
      db_min_val: db.min<Date>(dateTable.updated), db_max_val: db.max<Date>(dateTable.updated),
      importedMin: min<Date>(dateTable.updated), importedMax: max<Date>(dateTable.updated),
      inferredMin: dateQuery.min('updated'), inferredMax: db.max(dateTable.updated),
    });
    type ExtremaRow = Awaited<typeof dateExtrema>[number];
    const extremaRow: ExtremaRow = {min_val:new Date(),max_val:new Date(),db_min_val:new Date(),db_max_val:new Date(),importedMin:new Date(),importedMax:new Date(),inferredMin:null,inferredMax:null};
    // @ts-expect-error 명시한 Date 타입을 유지한다
    const invalidExtremaDate: ExtremaRow['min_val'] = '2026-01-01';
    // @ts-expect-error 타입을 생략해도 컬럼의 Date 타입을 유지한다
    const invalidInferredExtrema: ExtremaRow['inferredMax'] = 'wrong';
    // @ts-expect-error 명시한 타입에 null을 자동으로 추가하지 않는다
    const invalidExtremaNull: ExtremaRow['db_max_val'] = null;
    // @ts-expect-error 타입을 지정해도 없는 컬럼은 허용하지 않는다
    dateQuery.min<Date>('missing');
    // @ts-expect-error 타입을 지정해도 없는 컬럼은 허용하지 않는다
    dateQuery.max<Date>('missing');
    const callbackExtrema = dateQuery.select(q => ({low:q.min<Date>('updated'), high:q.max<Date>(q.t.updated)}));
    const subDates = dateQuery.select().as('dates');
    db.select(subDates,q => ({low:q.min<Date>('updated'), high:q.max<Date>('updated')}));
    void [extremaRow,invalidExtremaDate,invalidExtremaNull,invalidInferredExtrema,callbackExtrema];


    query.select().where(false);
    query.select().where(undefined);
    query.select().where(() => false);
    query.select().where(() => undefined);
    const searchName = '';
    query.select().where(q => !!searchName && q.eq({name:searchName}));
    query.select(a).where(q => false as false | undefined);
    query.select().limit(1).where(() => false);
    query.select().innerJoin(b, db.eq(b.id,table199.id)).where(() => false);
    query.select().$dynamic().where(q => q.eq({id:1})).where(() => false).where(undefined);
    db.select('table199').where(false);
    // @ts-expect-error true는 조건으로 허용하지 않는다
    query.select().where(true);
    // @ts-expect-error true를 반환하는 콜백은 허용하지 않는다
    query.select().where(() => true);


    const autoCoalesces = query.select(() => ({
      n: query.coalesceNumber('id', 0), s: query.coalesceString('id', 0), b: query.coalesceBoolean('id', 0),
      explicit: query.coalesceNumber<0 | 1 | 2>('id', 0),
      dbN: db.coalesceNumber<number>(table199.id, 0), dbS: db.coalesceString<string>(table199.id, 0), dbB: db.coalesceBoolean<boolean>(table199.id, 0),
      importedN: coalesceNumber(table199.id, 0), importedS: coalesceString(table199.id, 0), importedB: coalesceBoolean(table199.id, 0),
      nullable: query.coalesceNumber('name', a.name),
    }));
    type AutoCoalesceRow = Awaited<typeof autoCoalesces>[number];
    const autoCoalesceRow: AutoCoalesceRow = {n:1,s:'1',b:true,explicit:2,dbN:1,dbS:'1',dbB:false,importedN:2,importedS:'2',importedB:true,nullable:null};
    // @ts-expect-error 자동 Number 변환 결과는 number다
    const invalidAutoN: AutoCoalesceRow['n'] = '1';
    // @ts-expect-error 자동 String 변환 결과는 string이다
    const invalidAutoS: AutoCoalesceRow['s'] = 1;
    // @ts-expect-error 자동 Boolean 변환 결과는 boolean이다
    const invalidAutoB: AutoCoalesceRow['b'] = 1;
    // @ts-expect-error 지정한 타입을 유지한다
    const invalidAutoUnion: AutoCoalesceRow['explicit'] = 3;
    // @ts-expect-error 기본 값이 있으면 null을 제외한다
    const invalidAutoNull: AutoCoalesceRow['n'] = null;
    // @ts-expect-error 타입을 지정해도 잘못된 컬럼은 허용하지 않는다
    query.coalesceString<string>('missing', 0);
    void [autoCoalesceRow,invalidAutoN,invalidAutoS,invalidAutoB,invalidAutoUnion,invalidAutoNull];

    const explicitTypedSums = query.select(() => ({
      numeric: query.sumNumber<0 | 1 | 2>('id'),
      boolean: query.sumBoolean<true>('id'),
      text: query.sumString<'value'>('id'),
      directNumber: db.sumNumber<number>(table199.id),
      directBoolean: db.sumBoolean<boolean>(table199.id),
      directString: db.sumString<string>(table199.id),
      namedNumber: sumNumber<number | null>(table199.id),
      namedBoolean: sumBoolean<boolean | null>(table199.id),
      namedString: sumString<string | null>(table199.id),
    }));
    type ExplicitTypedSumRow = Awaited<typeof explicitTypedSums>[number];
    const explicitTypedSumRow: ExplicitTypedSumRow = { numeric: 2, boolean: true, text: 'value', directNumber: 1, directBoolean: false, directString: 'x', namedNumber: null, namedBoolean: null, namedString: null };
    // @ts-expect-error 명시한 유니언을 유지한다
    const invalidTypedSumNumber: ExplicitTypedSumRow['numeric'] = 3;
    // @ts-expect-error 명시한 리터럴 타입을 유지한다
    const invalidTypedSumBoolean: ExplicitTypedSumRow['boolean'] = false;
    // @ts-expect-error 명시한 리터럴 타입을 유지한다
    const invalidTypedSumString: ExplicitTypedSumRow['text'] = 'other';
    // @ts-expect-error 명시한 타입에 null을 자동으로 추가하지 않는다
    const invalidTypedSumNull: ExplicitTypedSumRow['directNumber'] = null;
    // @ts-expect-error 타입을 지정해도 존재하지 않는 컬럼은 허용하지 않는다
    query.sumNumber<number>('missing');
    void [explicitTypedSumRow, invalidTypedSumNumber, invalidTypedSumBoolean, invalidTypedSumString, invalidTypedSumNull];

    const typedSums = query.select(() => ({
      numeric: query.sumNumber('id'), boolean: query.sumBoolean('id'), text: query.sumString('id'),
      directNumber: db.sumNumber(table199.id), directBoolean: db.sumBoolean(table199.id), directString: db.sumString(table199.id),
      namedNumber: sumNumber(table199.id), namedBoolean: sumBoolean(table199.id), namedString: sumString(table199.id),
    }));
    type TypedSumRow = Awaited<typeof typedSums>[number];
    const typedSumRow: TypedSumRow = { numeric: 1, boolean: true, text: '1', directNumber: 2, directBoolean: false, directString: '2', namedNumber: null, namedBoolean: null, namedString: null };
    // @ts-expect-error sumNumber는 number로 매핑한다
    const invalidNumberSum: TypedSumRow['numeric'] = '1';
    // @ts-expect-error sumBoolean는 boolean으로 매핑한다
    const invalidBooleanSum: TypedSumRow['boolean'] = 1;
    // @ts-expect-error sumString는 string으로 매핑한다
    const invalidStringSum: TypedSumRow['text'] = 1;
    // @ts-expect-error 존재하지 않는 컬럼은 허용하지 않는다
    query.sumNumber('missing');
    void [typedSumRow, invalidNumberSum, invalidBooleanSum, invalidStringSum];

    const explicitTypedDistinctSums = query.select(() => ({
      numeric: query.sumDistinctNumber<0 | 1 | 2>('id'),
      boolean: query.sumDistinctBoolean<true>('id'),
      text: query.sumDistinctString<'value'>('id'),
      directNumber: db.sumDistinctNumber<number>(table199.id),
      directBoolean: db.sumDistinctBoolean<boolean>(table199.id),
      directString: db.sumDistinctString<string>(table199.id),
      namedNumber: sumDistinctNumber<number | null>(table199.id),
      namedBoolean: sumDistinctBoolean<boolean | null>(table199.id),
      namedString: sumDistinctString<string | null>(table199.id),
    }));
    type ExplicitTypedDistinctSumRow = Awaited<typeof explicitTypedDistinctSums>[number];
    const explicitTypedDistinctSumRow: ExplicitTypedDistinctSumRow = { numeric: 2, boolean: true, text: 'value', directNumber: 1, directBoolean: false, directString: 'x', namedNumber: null, namedBoolean: null, namedString: null };
    // @ts-expect-error 명시한 유니언을 유지한다
    const invalidTypedDistinctSumNumber: ExplicitTypedDistinctSumRow['numeric'] = 3;
    // @ts-expect-error 명시한 리터럴 타입을 유지한다
    const invalidTypedDistinctSumBoolean: ExplicitTypedDistinctSumRow['boolean'] = false;
    // @ts-expect-error 명시한 리터럴 타입을 유지한다
    const invalidTypedDistinctSumString: ExplicitTypedDistinctSumRow['text'] = 'other';
    // @ts-expect-error 명시한 타입에 null을 자동으로 추가하지 않는다
    const invalidTypedDistinctSumNull: ExplicitTypedDistinctSumRow['directNumber'] = null;
    // @ts-expect-error 타입을 지정해도 존재하지 않는 컬럼은 허용하지 않는다
    query.sumDistinctNumber<number>('missing');
    void [explicitTypedDistinctSumRow, invalidTypedDistinctSumNumber, invalidTypedDistinctSumBoolean, invalidTypedDistinctSumString, invalidTypedDistinctSumNull];

    const typedDistinctSums = query.select(() => ({
      numeric: query.sumDistinctNumber('id'), boolean: query.sumDistinctBoolean('id'), text: query.sumDistinctString('id'),
      directNumber: db.sumDistinctNumber(table199.id), directBoolean: db.sumDistinctBoolean(table199.id), directString: db.sumDistinctString(table199.id),
      namedNumber: sumDistinctNumber(table199.id), namedBoolean: sumDistinctBoolean(table199.id), namedString: sumDistinctString(table199.id),
    }));
    type TypedDistinctSumRow = Awaited<typeof typedDistinctSums>[number];
    const typedDistinctSumRow: TypedDistinctSumRow = { numeric: 1, boolean: true, text: '1', directNumber: 2, directBoolean: false, directString: '2', namedNumber: null, namedBoolean: null, namedString: null };
    // @ts-expect-error sumDistinctNumber는 number로 매핑한다
    const invalidNumberDistinctSum: TypedDistinctSumRow['numeric'] = '1';
    // @ts-expect-error sumDistinctBoolean는 boolean으로 매핑한다
    const invalidBooleanDistinctSum: TypedDistinctSumRow['boolean'] = 1;
    // @ts-expect-error sumDistinctString는 string으로 매핑한다
    const invalidStringDistinctSum: TypedDistinctSumRow['text'] = 1;
    // @ts-expect-error 존재하지 않는 컬럼은 허용하지 않는다
    query.sumDistinctNumber('missing');
    void [typedDistinctSumRow, invalidNumberDistinctSum, invalidBooleanDistinctSum, invalidStringDistinctSum];


    const explicitSums = query.select({
      numeric: db.sum<number>(table199.id, Number),
      union: db.sum<0 | 1 | 2>(table199.id, Number),
      nullable: sum<number | null>(table199.id, Number),
      text: sum<string>(table199.id, { mapFromDriverValue: (value: string) => value }),
    });
    type ExplicitSumRow = Awaited<typeof explicitSums>[number];
    const explicitSumRow: ExplicitSumRow = { numeric: 1, union: 2, nullable: null, text: '1' };
    // @ts-expect-error 지정한 결과 타입을 유지한다
    const invalidExplicitSum: ExplicitSumRow['numeric'] = '1';
    // @ts-expect-error 유니언에 없는 값은 허용하지 않는다
    const invalidExplicitSumUnion: ExplicitSumRow['union'] = 3;
    // @ts-expect-error 명시한 타입에 null을 자동 추가하지 않는다
    const invalidExplicitSumNull: ExplicitSumRow['numeric'] = null;
    // @ts-expect-error 결과 타입을 지정해도 decoder는 필수다
    db.sum<number>(table199.id);
    // @ts-expect-error 직접 가져온 함수도 decoder는 필수다
    sum<number>(table199.id);
    void [explicitSumRow, invalidExplicitSum, invalidExplicitSumUnion, invalidExplicitSumNull];

    const explicitDistinctSums = query.select({
      numeric: db.sumDistinct<number>(table199.id, Number),
      union: db.sumDistinct<0 | 1 | 2>(table199.id, Number),
      nullable: sumDistinct<number | null>(table199.id, Number),
      text: sumDistinct<string>(table199.id, { mapFromDriverValue: (value: string) => value }),
    });
    type ExplicitDistinctSumRow = Awaited<typeof explicitDistinctSums>[number];
    const explicitDistinctSumRow: ExplicitDistinctSumRow = { numeric: 1, union: 2, nullable: null, text: '1' };
    // @ts-expect-error 지정한 결과 타입을 유지한다
    const invalidExplicitDistinctSum: ExplicitDistinctSumRow['numeric'] = '1';
    // @ts-expect-error 유니언에 없는 값은 허용하지 않는다
    const invalidExplicitDistinctSumUnion: ExplicitDistinctSumRow['union'] = 3;
    // @ts-expect-error 명시한 타입에 null을 자동 추가하지 않는다
    const invalidExplicitDistinctSumNull: ExplicitDistinctSumRow['numeric'] = null;
    // @ts-expect-error 결과 타입을 지정해도 decoder는 필수다
    db.sumDistinct<number>(table199.id);
    // @ts-expect-error 직접 가져온 함수도 decoder는 필수다
    sumDistinct<number>(table199.id);
    void [explicitDistinctSumRow, invalidExplicitDistinctSum, invalidExplicitDistinctSumUnion, invalidExplicitDistinctSumNull];

    const explicitTypedAvgs = query.select(() => ({
      numeric: query.avgNumber<0 | 1 | 2>('id'),
      boolean: query.avgBoolean<true>('id'),
      text: query.avgString<'value'>('id'),
      directNumber: db.avgNumber<number>(table199.id),
      directBoolean: db.avgBoolean<boolean>(table199.id),
      directString: db.avgString<string>(table199.id),
      namedNumber: avgNumber<number | null>(table199.id),
      namedBoolean: avgBoolean<boolean | null>(table199.id),
      namedString: avgString<string | null>(table199.id),
    }));
    type ExplicitTypedAvgRow = Awaited<typeof explicitTypedAvgs>[number];
    const explicitTypedAvgRow: ExplicitTypedAvgRow = { numeric: 2, boolean: true, text: 'value', directNumber: 1, directBoolean: false, directString: 'x', namedNumber: null, namedBoolean: null, namedString: null };
    // @ts-expect-error 명시한 유니언을 유지한다
    const invalidTypedAvgNumber: ExplicitTypedAvgRow['numeric'] = 3;
    // @ts-expect-error 명시한 리터럴 타입을 유지한다
    const invalidTypedAvgBoolean: ExplicitTypedAvgRow['boolean'] = false;
    // @ts-expect-error 명시한 리터럴 타입을 유지한다
    const invalidTypedAvgString: ExplicitTypedAvgRow['text'] = 'other';
    // @ts-expect-error 명시한 타입에 null을 자동으로 추가하지 않는다
    const invalidTypedAvgNull: ExplicitTypedAvgRow['directNumber'] = null;
    // @ts-expect-error 타입을 지정해도 존재하지 않는 컬럼은 허용하지 않는다
    query.avgNumber<number>('missing');
    void [explicitTypedAvgRow, invalidTypedAvgNumber, invalidTypedAvgBoolean, invalidTypedAvgString, invalidTypedAvgNull];

    const typedAvgs = query.select(() => ({
      numeric: query.avgNumber('id'), boolean: query.avgBoolean('id'), text: query.avgString('id'),
      directNumber: db.avgNumber(table199.id), directBoolean: db.avgBoolean(table199.id), directString: db.avgString(table199.id),
      namedNumber: avgNumber(table199.id), namedBoolean: avgBoolean(table199.id), namedString: avgString(table199.id),
    }));
    type TypedAvgRow = Awaited<typeof typedAvgs>[number];
    const typedAvgRow: TypedAvgRow = { numeric: 1, boolean: true, text: '1', directNumber: 2, directBoolean: false, directString: '2', namedNumber: null, namedBoolean: null, namedString: null };
    // @ts-expect-error avgNumber는 number로 매핑한다
    const invalidNumberAvg: TypedAvgRow['numeric'] = '1';
    // @ts-expect-error avgBoolean는 boolean으로 매핑한다
    const invalidBooleanAvg: TypedAvgRow['boolean'] = 1;
    // @ts-expect-error avgString는 string으로 매핑한다
    const invalidStringAvg: TypedAvgRow['text'] = 1;
    // @ts-expect-error 존재하지 않는 컬럼은 허용하지 않는다
    query.avgNumber('missing');
    void [typedAvgRow, invalidNumberAvg, invalidBooleanAvg, invalidStringAvg];

    const explicitTypedDistinctAvgs = query.select(() => ({
      numeric: query.avgDistinctNumber<0 | 1 | 2>('id'),
      boolean: query.avgDistinctBoolean<true>('id'),
      text: query.avgDistinctString<'value'>('id'),
      directNumber: db.avgDistinctNumber<number>(table199.id),
      directBoolean: db.avgDistinctBoolean<boolean>(table199.id),
      directString: db.avgDistinctString<string>(table199.id),
      namedNumber: avgDistinctNumber<number | null>(table199.id),
      namedBoolean: avgDistinctBoolean<boolean | null>(table199.id),
      namedString: avgDistinctString<string | null>(table199.id),
    }));
    type ExplicitTypedDistinctAvgRow = Awaited<typeof explicitTypedDistinctAvgs>[number];
    const explicitTypedDistinctAvgRow: ExplicitTypedDistinctAvgRow = { numeric: 2, boolean: true, text: 'value', directNumber: 1, directBoolean: false, directString: 'x', namedNumber: null, namedBoolean: null, namedString: null };
    // @ts-expect-error 명시한 유니언을 유지한다
    const invalidTypedDistinctAvgNumber: ExplicitTypedDistinctAvgRow['numeric'] = 3;
    // @ts-expect-error 명시한 리터럴 타입을 유지한다
    const invalidTypedDistinctAvgBoolean: ExplicitTypedDistinctAvgRow['boolean'] = false;
    // @ts-expect-error 명시한 리터럴 타입을 유지한다
    const invalidTypedDistinctAvgString: ExplicitTypedDistinctAvgRow['text'] = 'other';
    // @ts-expect-error 명시한 타입에 null을 자동으로 추가하지 않는다
    const invalidTypedDistinctAvgNull: ExplicitTypedDistinctAvgRow['directNumber'] = null;
    // @ts-expect-error 타입을 지정해도 존재하지 않는 컬럼은 허용하지 않는다
    query.avgDistinctNumber<number>('missing');
    void [explicitTypedDistinctAvgRow, invalidTypedDistinctAvgNumber, invalidTypedDistinctAvgBoolean, invalidTypedDistinctAvgString, invalidTypedDistinctAvgNull];

    const typedDistinctAvgs = query.select(() => ({
      numeric: query.avgDistinctNumber('id'), boolean: query.avgDistinctBoolean('id'), text: query.avgDistinctString('id'),
      directNumber: db.avgDistinctNumber(table199.id), directBoolean: db.avgDistinctBoolean(table199.id), directString: db.avgDistinctString(table199.id),
      namedNumber: avgDistinctNumber(table199.id), namedBoolean: avgDistinctBoolean(table199.id), namedString: avgDistinctString(table199.id),
    }));
    type TypedDistinctAvgRow = Awaited<typeof typedDistinctAvgs>[number];
    const typedDistinctAvgRow: TypedDistinctAvgRow = { numeric: 1, boolean: true, text: '1', directNumber: 2, directBoolean: false, directString: '2', namedNumber: null, namedBoolean: null, namedString: null };
    // @ts-expect-error avgDistinctNumber는 number로 매핑한다
    const invalidNumberDistinctAvg: TypedDistinctAvgRow['numeric'] = '1';
    // @ts-expect-error avgDistinctBoolean는 boolean으로 매핑한다
    const invalidBooleanDistinctAvg: TypedDistinctAvgRow['boolean'] = 1;
    // @ts-expect-error avgDistinctString는 string으로 매핑한다
    const invalidStringDistinctAvg: TypedDistinctAvgRow['text'] = 1;
    // @ts-expect-error 존재하지 않는 컬럼은 허용하지 않는다
    query.avgDistinctNumber('missing');
    void [typedDistinctAvgRow, invalidNumberDistinctAvg, invalidBooleanDistinctAvg, invalidStringDistinctAvg];

    const methodSums = query.select(q => ({
      val3: query.sum('id', Number),
      val4: query.sumDistinct('id', Number),
      explicit: query.sum<0 | 1 | 2>('id', Number),
      explicitDistinct: query.sumDistinct<number>('id', Number),
      expression: query.sum(q.t.id, { mapFromDriverValue: (value: string) => String(value) }),
    }));
    type MethodSumRow = Awaited<typeof methodSums>[number];
    const methodSumRow: MethodSumRow = { val3: null, val4: 1, explicit: 2, explicitDistinct: 3, expression: '4' };
    // @ts-expect-error decoder로 추론한 결과 타입은 유지한다
    const invalidMethodSum: MethodSumRow['val4'] = '1';
    // @ts-expect-error 명시한 타입에 없는 값은 허용하지 않는다
    const invalidMethodSumUnion: MethodSumRow['explicit'] = 3;
    // @ts-expect-error 존재하지 않는 컬럼은 허용하지 않는다
    query.sum('missing', Number);
    // @ts-expect-error 존재하지 않는 컬럼은 허용하지 않는다
    query.sumDistinct('missing', Number);
    // @ts-expect-error decoder는 필수다
    query.sum('id');
    // @ts-expect-error 결과 타입을 지정해도 decoder는 필수다
    query.sumDistinct<number>('id');
    void [methodSumRow, invalidMethodSum, invalidMethodSumUnion];

    const explicitCoalesced = query.select({
      direct: db.coalesce<0 | 1 | 2>(table199.id, 0),
      named: query.coalesce<0 | 1 | 2>('id', 0),
      mapped: db.coalesce<0 | 1 | 2>(db.sql\`\${table199.id}\`, 0, Number),
      expression: query.coalesce<0 | 1 | 2>(db.sql\`\${table199.id}\`, 0, Number),
      standalone: coalesce<0 | 1 | 2>(table199.id, 0),
      nullable: query.coalesce<0 | 1 | 2 | null>('extra0', null),
    });
    type ExplicitCoalesced = Awaited<typeof explicitCoalesced>[number];
    const explicitCoalescedRow: ExplicitCoalesced = { direct: 0, named: 1, mapped: 2, expression: 0, standalone: 1, nullable: null };
    // @ts-expect-error 지정한 결과 타입에 포함되지 않은 값이다
    const invalidExplicitCoalesced: ExplicitCoalesced['mapped'] = 3;
    // @ts-expect-error 결과 타입을 지정해도 잘못된 컬럼명은 허용하지 않는다
    query.coalesce<0 | 1 | 2>('missing', 0);
    void [explicitCoalescedRow, invalidExplicitCoalesced];


    const tagged = query.select({
      val1: db.sqlNumber\`\${table199.id} + 1\`,
      val2: db.sqlBoolean\`\${table199.id}\`,
      val3: db.sqlString\`\${table199.id}\`,
    });
    type TaggedRow = Awaited<typeof tagged>[number];
    const taggedRow: TaggedRow = { val1: 1, val2: true, val3: '1' };
    // @ts-expect-error sqlNumber 태그 결과는 number다
    const invalidTaggedNumber: TaggedRow['val1'] = '1';
    // @ts-expect-error sqlBoolean 태그 결과는 boolean이다
    const invalidTaggedBoolean: TaggedRow['val2'] = 1;
    // @ts-expect-error sqlString 태그 결과는 string이다
    const invalidTaggedString: TaggedRow['val3'] = 1;
    void [taggedRow, invalidTaggedNumber, invalidTaggedBoolean, invalidTaggedString];


    const coalesced = query.select({
      val1: db.coalesce(table199.name, 'no email'),
      val2: db.coalesce(table199.id, 0),
      val3: db.coalesce(table199.name, a.name),
      val4: db.coalesce(db.sql\`cast(\${table199.id} as signed)\`, db.sql\`\${table199.id} * 100\`),
      val5: query.coalesce('name', 'no email'),
      val6: query.coalesce('id', 0),
      val7: query.coalesce('name', a.name),
      val8: query.coalesce(db.sql\`cast(\${table199.id} as signed)\`, db.sql\`\${table199.id} * 100\`),
    });
    type CoalescedRow = Awaited<typeof coalesced>[number];
    const coalescedRow: CoalescedRow = { val1: 'a', val2: 1, val3: null, val4: 1n, val5: 'b', val6: 2, val7: null, val8: 2n };
    // @ts-expect-error 문자열 컬럼과 기본 값의 결과는 문자열이다
    const invalidCoalescedValue: CoalescedRow['val1'] = 1;
    // @ts-expect-error 기본 값이 있으면 nullable 컬럼의 null을 제거한다
    const invalidCoalescedNull: CoalescedRow['val5'] = null;
    // @ts-expect-error 존재하지 않는 컬럼명은 허용하지 않는다
    query.coalesce('missing', 0);
    // @ts-expect-error 기본 값은 필수다
    db.coalesce(table199.id);
    void [coalescedRow, invalidCoalescedValue, invalidCoalescedNull];

    const mappedCoalesced = query.select({
      numeric: db.coalesce(db.sql\`cast(\${table199.id} as signed)\`, db.sql\`\${table199.id} * 100\`, Number),
      shorthand: query.coalesce(db.sql\`cast(\${table199.id} as signed)\`, db.sql\`\${table199.id} * 100\`, Number),
      named: query.coalesce('id', 0, Number),
      nullable: db.coalesce(table199.name, a.name, Number),
      text: query.coalesce('id', 0, { mapFromDriverValue: (value: number) => String(value) }),
      unchanged: query.coalesce('name', 'fallback', undefined),
    });
    type MappedCoalescedRow = Awaited<typeof mappedCoalesced>[number];
    const mappedCoalescedRow: MappedCoalescedRow = { numeric: 1, shorthand: 2, named: 3, nullable: null, text: '4', unchanged: 'x' };
    // @ts-expect-error Number로 변환한 결과는 문자열이 아니다
    const invalidMappedCoalesced: MappedCoalescedRow['numeric'] = '1';
    // @ts-expect-error 알려진 not-null 결과의 null은 허용하지 않는다
    const invalidMappedNamed: MappedCoalescedRow['named'] = null;
    void [mappedCoalescedRow, invalidMappedCoalesced, invalidMappedNamed];


    // @ts-expect-error MySQL에서 지원하지 않는 연산자
    db.ilike;
    // @ts-expect-error MySQL에서 지원하지 않는 연산자
    query.ilike;
    // @ts-expect-error MySQL에서 지원하지 않는 연산자
    db.notIlike;
    // @ts-expect-error MySQL에서 지원하지 않는 연산자
    query.notIlike;
    // @ts-expect-error MySQL에서 지원하지 않는 연산자
    db.orIlike;
    // @ts-expect-error MySQL에서 지원하지 않는 연산자
    query.orIlike;
    // @ts-expect-error MySQL에서 지원하지 않는 연산자
    db.orNotIlike;
    // @ts-expect-error MySQL에서 지원하지 않는 연산자
    query.orNotIlike;
    // @ts-expect-error MySQL 객체 조건에서 지원하지 않는 연산자
    query.and({ ilike: { name: 'A%' } });

    const isOrderByName = false;
    query.select().orderBy(query.desc('id'), isOrderByName && query.asc('name'), isOrderByName ? query.asc('name') : undefined);
    query.select().orderBy(q => [q.desc('id'), isOrderByName && q.asc('name'), isOrderByName ? q.asc('name') : undefined]);
    query.select().innerJoin(b, db.eq(table199.id, b.id)).orderBy(q => [q.desc('id'), false, undefined]);
    query.select().limit(1).orderBy(false, undefined);
    query.select().$dynamic().orderBy(q => [q.desc('id'), false, undefined]);
    query.select(['id']).union(query.select(['id'])).orderBy(q => [q.desc('id'), false, undefined]);


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
