# @pdg/drizzle-mysql

Drizzle ORM과 mysql2를 사용하는 Node.js용 MySQL 보조 라이브러리입니다. `drizzle-orm@1.0.0-rc.5`를 기준으로 합니다.

## 설치

```sh
npm install @pdg/drizzle-mysql drizzle-orm@1.0.0-rc.5 mysql2
```

## 사용

### 연결과 스키마

테이블 정의에는 Drizzle의 MySQL 스키마 API를 패키지 루트에서 가져올 수 있습니다. 연결은 `drizzleMySql`에 MySQL 연결 URL 또는 `mysql2` 연결 옵션과 스키마를 전달해 만듭니다.

```ts
import {
  drizzleMySql,
  int,
  mysqlTable,
  varchar,
} from '@pdg/drizzle-mysql';

const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }),
  created_at: varchar('created_at', { length: 30 }),
  updated_at: varchar('updated_at', { length: 30 }),
});
const posts = mysqlTable('posts', {
  id: int('id').autoincrement().primaryKey(),
  user_id: int('user_id').notNull(),
  title: varchar('title', { length: 200 }).notNull(),
});

const db = drizzleMySql({
  url: process.env.DATABASE_URL!,
  schema: { users, posts },
  getTimestamp: () => new Date().toISOString(),
});
const user = db.query(users);
```

URL 없이 `mysql2`의 연결 옵션을 직접 전달할 수도 있습니다. URL과 함께 `connectionLimit` 같은 풀 옵션도 지정할 수 있습니다.

```ts
const db = drizzleMySql({
  host: process.env.DB_HOST!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
  connectionLimit: 10,
  schema: { users, posts },
});
```

스키마 타입은 `schema`에 전달한 객체에서 추론됩니다. 테이블명과 컬럼명의 자동완성을 유지하려면 스키마를 넓은 `Record<string, MySqlTable>` 타입으로 지정하지 않고 구체적인 타입을 유지하세요.

반환 타입 `DrizzleMySql<typeof schema>`와 `MySqlAliases`, `MySqlSchemaConditions`를 공개합니다. 연결 타입과 테이블별 보조 함수 타입을 분리하며, `query(table)`은 전달받은 테이블만으로 타입을 추론합니다. 등록된 테이블 외에도 별칭 테이블이나 직접 가져온 테이블을 전달할 수 있습니다.

```ts
const u = db.a.users('u');
const fields = db.columns(u, 'id', 'name as displayName');
const query = db.query(u);
```

200개 테이블에 대한 자동완성 후보를 TypeScript Language Service 테스트로 검증합니다. IDE 자체의 자동완성 동작은 사용하는 TypeScript 엔진과 설정에 따라서도 달라질 수 있습니다.

`drizzleMySql`에는 `url` 또는 `mysql2` 연결 옵션과 `schema`가 필요합니다. `getTimestamp`는 선택 사항이며, 생략하면 `new Date()`를 기본 시각으로 사용합니다. `timezone: 'local'`을 지정하면 `createdAt()` / `updatedAt()`의 자동 시각을 실행 PC의 현지 시간(Node.js의 `TZ` 설정 포함)으로 입력합니다. 예를 들어 `drizzleMySql({ url, schema, timezone: 'local' })`처럼 설정합니다. 이 경우 날짜를 SQL 매개변수 문자열로 전달하여 Drizzle의 UTC 변환을 피합니다. 사용자 정의 `getTimestamp`가 `Date`를 반환할 때도 현지 시간으로 변환합니다. 직접 지정한 컬럼 값과 `getTimestamp`가 반환한 문자열·SQL 표현식은 그대로 사용합니다. 이 옵션은 MySQL 서버의 세션 시간대를 변경하지 않습니다. `db.query(table)`은 해당 테이블에 맞춰 타입이 지정된 쿼리 객체를 반환합니다. `new MySqlQuery(table, db.current, getTimestamp?)`의 세 번째 인자는 선택 사항이며, 생략하면 해당 `drizzleMySql`에 설정한 생성 함수를 사용합니다. 명시하면 그 쿼리 객체에서만 해당 함수를 우선 사용합니다. 연결을 다 사용한 뒤 `await db.close()`로 커넥션 풀을 닫습니다.

연결 객체의 `select(table, fields?)`에서도 같은 선택 기능을 사용할 수 있습니다. 첫 인자는 등록된 스키마의 테이블명 또는 alias 테이블이며, 이후 선택 인자와 반환 빌더는 `MySqlQuery.select`와 동일합니다.

```ts
const rows = await db.select('users', ['id', 'name']).where((q) => q.gt({ id: 0 }));
const u = db.a.users('u');
const aliasedRows = await db.select(u, (q) => q.columns('id', 'name as displayName'));
```

`select`의 첫 인자로 `.as()`가 반환한 서브쿼리도 전달할 수 있습니다. 서브쿼리에서 선택한 컬럼만 외부 조회에 사용할 수 있습니다.

```ts
const aa = db.select('users', ['id', 'name']).where((q) => q.eq({ id: 1 })).as('aa');
const rows = await db.select(aa, (q) => q.columns('id', 'name'));
```

### 데이터 추가·수정·삭제

입력값을 변수로 준비할 때는 `addValues` / `editValues` 헬퍼를 사용하면 스키마 제네릭을 반복해서 지정하지 않아도 됩니다. 해당 쿼리의 입력 타입과 컬럼 정책으로 검사하며, 전달한 객체 또는 배열을 그대로 반환합니다. 헬퍼 자체는 DB 쿼리, 런타임 정책 검사, 기본 시각 생성을 실행하지 않습니다. 런타임 처리는 `add` / `edit`에서 수행합니다.

```ts
const addValues = user.addValues({ name: '홍길동' });
const id = await user.add(addValues);
const editValues = user.editValues({ name: '김민수' });
await user.editByPrimaryKey(editValues, id);

const rows = user.addValues([{ name: '사용자1' }, { name: '사용자2' }]);
await user.add(rows);
```

자동 증가 기본 키가 있는 테이블에서 `add`는 생성된 키를 반환합니다. 여러 행을 넣으면 키 배열을 반환합니다.

```ts
const id = await user.add({ name: '홍길동', email: 'hong@example.com' });
const ids = await user.add([
  { name: '김민수', email: 'minsu@example.com' },
  { name: '이서연', email: 'seoyeon@example.com' },
]);

const source = db.query(users).select({ name: 'name' }).where((q) => q.gt({ id: 0 }));
const copiedIds = await db.query(users).add(source);

await user.editByPrimaryKey({ name: '김민수' }, id);
await user.removeByPrimaryKey(id);
```

조건으로 수정·삭제할 때는 반드시 SQL 조건을 전달해야 합니다. 실수로 테이블 전체를 갱신하거나 삭제하지 않도록 조건이 없으면 오류가 발생합니다.

```ts
await user.edit({ name: '수정된 이름' }, user.eq({ id }));
await user.remove(user.eq({ id }));
```

복합 기본 키 테이블은 기본 키 컬럼명을 모두 포함한 객체를 사용합니다. 단일 기본 키는 값 하나 또는 기본 키 객체를 전달할 수 있습니다.

```ts
const found = await user.findByPrimaryKey(id);
const exists = await user.existsByPrimaryKey(id);
const missing = await user.notExistsByPrimaryKey(id);

const foundWithAlias = await user.find({ id_2: 'id' }, user.eq({ id }));
const foundByPrimaryKeyWithAlias = await user.findByPrimaryKey({ id_2: 'id' }, id);
```

### 조회와 컬럼 선택

`select`는 Drizzle 조회 빌더를 반환하므로 `where`, `orderBy`, `limit` 등 Drizzle의 빌더 메서드를 이어서 사용할 수 있습니다. `find`는 한 행을 조회하며, 결과가 없으면 `undefined`를 반환합니다.

`MySqlQuery`의 `asc`와 `desc`는 스키마 속성명으로 정렬 표현식을 만듭니다. 별칭 테이블을 사용할 때는 별칭 테이블과 속성명을 함께 전달할 수 있습니다.
`orderBy` 콜백에서는 현재 테이블에 연결된 `q.asc`, `q.desc`, `q.t`를 사용할 수 있으며, 선택 필드가 일부 컬럼으로 제한되어도 전체 테이블과 별칭 컬럼을 참조합니다.

```ts
const rows = await user
  .select(['id', 'name'])
  .where(user.gt({ id: 0 }))
  .orderBy(user.asc('id'))
  .limit(20);

const newest = user.select().orderBy(user.desc('created_at'));
const newestSelected = user.select(['id']).orderBy((q) => q.desc('created_at'));
const u = db.a.users('u');
const byAlias = user.select(u).orderBy(user.asc(u, 'name'));
const byAliasCallback = user.select(u, ['id']).orderBy((q) => q.asc('name'));

const found = await user.find(['id', 'name'], user.eq({ id }));
const count = await user.count(user.isNotNull('email'));
const exists = await user.exists(user.eq({ email: 'hong@example.com' }));
```

`innerJoin`, `leftJoin`, `rightJoin`의 콜백에는 조인 테이블 기준 조건 헬퍼와 현재 테이블을 나타내는 `q.t`가 제공됩니다. `db.alias(table, name)`으로 테이블 별칭을 만들 수 있으며, 서브쿼리도 조인할 수 있습니다. `db.columns(subquery, ...names)`로 조인된 서브쿼리의 선택 컬럼을 가져올 수 있습니다.

```ts
const joined = user.select().innerJoin(db.alias(users, 'u'), (q) => q.eq({ id: q.t.id }));
const recentUsers = user.select(['id']).limit(1).as('recent');
const recent = user.select().innerJoin(recentUsers, (q) => q.eq({ id: q.t.id }));
const recentId = user.select(db.columns(recentUsers, 'id')).innerJoin(recentUsers, db.eq(recentUsers.id, users.id));
```

`min`과 `max`는 컬럼 객체 또는 스키마 속성명으로 집계 필드를 만듭니다. `select`와 `find`의 선택 객체에서 사용할 수 있습니다.

```ts
const maxIdRows = await user.select({ max_id: user.max(user.t.id) });
const found = await user.find({ min_id: user.min('id') }, user.eq({ id }));
```

문자열 컬럼 매핑 객체로 결과 별칭을 지정할 수도 있습니다. 객체 키가 결과 키가 되고 값에는 스키마 속성명을 지정합니다.

```ts
const rows = await user.select({ id_2: 'id', name_2: 'name', email_2: 'email' });
```

컬럼 선택에는 컬럼명 배열, Drizzle 선택 객체, 또는 `columns()`를 사용하는 콜백을 사용할 수 있습니다. `columns()`는 전체 컬럼 또는 지정한 컬럼만 가져오며, `as`로 결과 키를 지정할 수 있습니다.

```ts
const allColumns = user.columns();
const selectedColumns = user.columns('id', 'name as displayName');

const projected = await user.find(
  (query) => [query.columns('id', 'name as displayName')],
  user.eq({ id })
);
```

문자열 컬럼 선택의 별칭 키워드는 대소문자를 구분하지 않습니다. `name as displayName`, `name AS displayName`, `name As displayName`, `name aS displayName`을 모두 사용할 수 있으며, 결과 키의 대소문자는 지정한 별칭 그대로 유지됩니다. `select`, `find`, `columns`에서 동일하게 적용됩니다.

테이블의 TypeScript 속성명과 SQL 컬럼명을 다르게 지정하면 기본 전체 조회 결과 키와 추론된 타입이 달라질 수 있습니다. 기본 컬럼 선택을 사용할 경우 스키마 속성명과 SQL 컬럼명을 같게 작성하는 것을 권장합니다. 이름이 다르면 필요한 컬럼을 명시적으로 선택하고 별칭을 지정하세요.

### 조건식

조건 함수는 `db` 연결 객체나 `db.query(table)`이 반환한 쿼리 객체에서 사용할 수 있습니다. 쿼리 객체 메서드는 해당 테이블의 컬럼을 기준으로 타입을 검사하고, `db` 메서드는 테이블 객체 또는 연결 스키마에 등록된 스키마 키를 함께 받습니다.

```ts
const byName = user.eq({ name: '홍길동' });
const bySchemaKey = db.eq('users', { name: '홍길동' });
const byTable = db.eq(users, { name: '홍길동' });
```

`createConditions(schema)`를 직접 호출해도 같은 조건 함수를 만들 수 있습니다. 독립된 조건 빌더가 필요할 때 사용하며, 반환된 함수는 생성할 때 전달한 스키마의 키와 테이블을 기준으로 동작합니다.

```ts
import { createConditions } from '@pdg/drizzle-mysql';

const condition = createConditions({ users });
const where = condition.and('users', {
  gte: { id: 1 },
  isNotNull: 'email',
});
const rows = await user.select().where(where);
```

#### 비교 연산자

`eq`, `ne`, `gt`, `gte`, `lt`, `lte`는 컬럼과 값을 비교합니다. 하나의 값 객체에 여러 컬럼을 넣으면 각 비교가 `AND`로 묶입니다. `undefined` 값은 생략되므로 선택적 검색 조건을 만들 때 유용합니다.

```ts
const filters = {
  name: searchName,
  email: searchEmail,
};

const rows = await user.find((query) =>
  query.eq({
    name: filters.name,
    email: filters.email,
  })
);

const changedIds = await user
  .select(['id'])
  .where(user.and({
    gte: { id: 10 },
    lte: { id: 50 },
  }));
```

`eq({ email: null })`은 `IS NULL`, `ne({ email: null })`은 `IS NOT NULL`로 변환됩니다. `gt` 등의 비교 연산자에는 `null`을 전달할 수 없습니다.

#### 배열과 범위

`inArray`와 `notInArray`는 컬럼별 허용·제외 값 배열을 받고, `between`과 `notBetween`은 `[시작, 끝]` 튜플을 받습니다. 한 객체에 여러 컬럼을 지정하면 각각의 조건은 `AND`로 결합됩니다.

배열 원소에는 해당 컬럼의 일반 값과 컬럼 또는 SQL 표현식을 함께 넣을 수 있습니다. 예를 들어 `inArray: { id: [0, query.t.id] }`처럼 다른 컬럼의 값과 비교할 수 있습니다.

```ts
const selected = await user.find((query) =>
  query.and({
    inArray: { id: [1, 3, 5, 7] },
    notInArray: { name: ['차단 사용자', '삭제 사용자'] },
    between: { id: [1, 100] },
  })
);

const recentIds = await user
  .select(['id'])
  .where(user.notBetween({ id: [1, 10] }));
```

범위 양 끝은 `null`이나 `undefined`가 아닌 값이어야 합니다. `inArray`와 `notInArray`의 값은 배열이어야 합니다.

#### 문자열 패턴

`like`, `notLike`, `ilike`, `notIlike`는 문자열 컬럼에 SQL 패턴을 적용합니다. `%`는 임의 길이 문자열, `_`는 한 문자에 대응합니다. `ilike` 계열은 대소문자를 구분하지 않는 `ILIKE` 연산자를 생성하지만, MySQL은 `ILIKE` 문법을 지원하지 않으므로 MySQL 쿼리에서는 사용하지 마세요. MySQL의 `LIKE` 대소문자 구분 여부는 컬럼 collation 설정에 따릅니다.

```ts
const matchingUsers = await user.find((query) =>
  query.or({
    like: { email: '%@example.com' },
    eq: { name: 'Kim' },
  })
);

const excludedNames = await user
  .select()
  .where(user.notLike({ name: '테스트_%' }));
```

패턴 연산은 문자열 컬럼에만 사용할 수 있으며, 값은 `%홍길동%`처럼 SQL 패턴 문자열로 전달합니다. `ilike` / `notIlike`는 패키지의 조건 함수 목록에는 있지만 MySQL에서는 실행할 수 없습니다.

#### NULL 검사

`isNull`과 `isNotNull`은 컬럼명 하나 또는 컬럼명 배열을 받습니다. 배열 안의 컬럼 검사는 `AND`로 결합됩니다. 검색 조건에 따라 컬럼 검사를 생략하려면 `undefined`를 전달할 수 있습니다.

```ts
const noEmail = await user.find((query) => query.isNull('email'));
const hasNameAndEmail = await user.find((query) =>
  query.isNotNull(['name', 'email'])
);
const optionalNullCheck = user.isNull(shouldCheckEmail ? 'email' : undefined);
```

#### AND·OR 조합

`query.and({ ... })`와 `query.or({ ... })`는 여러 연산자 그룹을 객체로 구성합니다. 한 연산자 아래의 컬럼 비교는 먼저 `AND`로 묶이고, 바깥 함수가 각 연산자 그룹을 `AND` 또는 `OR`로 결합합니다. `and` / `or` 객체는 조건 그룹이며, 그 안에 다시 `and` / `or`를 중첩하는 형식은 지원하지 않습니다.

```ts
const usersMatchingEither = await user.find((query) =>
  query.or({
    eq: { name: '홍길동' },
    like: { email: '%@example.com' },
  })
);

const activeCandidates = await user.find((query) =>
  query.and({
    isNotNull: 'email',
    ne: { name: '탈퇴 사용자' },
  })
);
```

여러 조건을 임의로 중첩하거나 이미 만든 SQL 조건을 결합할 때는 `db.and(...)` / `db.or(...)`의 Drizzle 호환 오버로드를 사용합니다. 이 형식에서는 함수 호출 인자로 SQL 조건을 직접 조합할 수 있습니다.

```ts
const nameOrEmail = db.or(
  user.eq({ name: '홍길동' }),
  user.like({ email: '%@example.com' }),
);
const condition = db.and(
  nameOrEmail,
  db.isNotNull(users.email),
);

const matchingUsers = await user.select().where(condition);
```

같은 함수는 테이블 객체와 조건 객체를 받아 그룹 조건을 만들 수도 있습니다.

```ts
const groupedCondition = db.and(users, {
  gte: { id: 1 },
  isNotNull: ['name', 'email'],
});
const groupedUsers = await user.select().where(groupedCondition);
```

`or` 접두사 조건은 객체 안의 컬럼 비교를 `OR`로 결합합니다. 기존 조건과 마찬가지로 `undefined` 값은 생략하고, 빈 객체나 빈 컬럼 배열은 `undefined`를 반환합니다. `orEq`와 `orNe`의 `null` 값은 각각 `IS NULL`과 `IS NOT NULL`로 변환됩니다.

```ts
user.orEq({ id: 1, name: '홍길동' });
user.orNe({ id: 1, name: '홍길동' });
const u = db.a.users('u');
db.orEq(u, { id: 1, name: '홍길동' });
db.orNe('users', { id: 1, name: '홍길동' });
user.select().where((q) => q.orLike({ name: '%홍%', email: '%example.com' }));
user.and({ orEq: { id: 1, name: '홍길동' }, gt: { age: 20 } });
```

지원하는 OR 조건은 `orEq`, `orNe`, `orGt`, `orGte`, `orLt`, `orLte`, `orInArray`, `orNotInArray`, `orBetween`, `orNotBetween`, `orLike`, `orNotLike`, `orIlike`, `orNotIlike`, `orIsNull`, `orIsNotNull`입니다. 각 함수는 대응하는 일반 조건과 같은 입력 및 검증 규칙을 사용하며, `orBetween`은 각 컬럼의 두 경계 비교를 `AND`로 유지한 채 컬럼 그룹 사이를 `OR`로 결합합니다. `and`와 `or` 조건 객체 안에서도 사용할 수 있습니다.

#### Drizzle 컬럼 연산자와 함께 사용

`db`의 조건 함수는 테이블/객체 형식 외에도 Drizzle의 컬럼 기반 연산자 오버로드를 그대로 사용할 수 있습니다. `SQL` 조건은 래퍼 조회 메서드에 전달하거나 Drizzle 조회 빌더에서 조합할 수 있습니다.

```ts
const columnCondition = db.and(
  db.eq(users.name, '홍길동'),
  db.isNotNull(users.email),
);

const rows = await user.select().where(columnCondition);
const count = await user.count(columnCondition);
```

지원하는 객체 조건 함수는 `eq`, `ne`, `orEq`, `orNe`, `gt`, `gte`, `lt`, `lte`, `inArray`, `notInArray`, `between`, `notBetween`, `like`, `notLike`, `ilike`, `notIlike`, `isNull`, `isNotNull`, `orGt`, `orGte`, `orLt`, `orLte`, `orInArray`, `orNotInArray`, `orBetween`, `orNotBetween`, `orLike`, `orNotLike`, `orIlike`, `orNotIlike`, `orIsNull`, `orIsNotNull`, `and`, `or`입니다. 존재하지 않는 스키마 키나 컬럼, 잘못된 값 형식은 조건을 조용히 생략하지 않고 오류로 처리합니다.

### 별칭과 조인

`db.a`는 연결에 전달한 스키마의 테이블별 별칭 생성 함수입니다. 별칭 테이블은 선택 및 조건식에 사용할 수 있습니다. `select`가 반환하는 Drizzle 빌더에서 조인을 이어서 작성할 수 있습니다.

```ts
const u = db.a.users('u');
const rows = await user
  .select(u, ['id', 'name'])
  .where(db.eq(u, { name: '홍길동' }));

const userPosts = await user
  .select()
  .leftJoin(posts, db.eq(users.id, posts.user_id));
```

기본 별칭은 스키마 키의 첫 글자와 대문자 위치를 기준으로 만듭니다. 예를 들어 `userProfile`의 기본 별칭은 `up`이며, `db.a.userProfile('profile')`처럼 직접 지정할 수도 있습니다.

### 페이지네이션

`db.paginate(builder, page, limit)`은 조회 데이터와 페이지 정보를 함께 반환합니다. 페이지와 페이지 크기는 양의 정수여야 합니다. 페이지네이션에 전달하는 빌더는 사용할 트랜잭션 안에서 생성해야 합니다.

```ts
const page = await db.paginate(
  user.select().where(user.isNotNull('email')).orderBy(user.t.id),
  1,
  20,
);

console.log(page.data);
console.log(page.paging); // current_page, per_page, last_page, total, from, to
```

### 트랜잭션과 원본 Drizzle API

`db.trans` 콜백 안의 쿼리 객체는 현재 트랜잭션을 자동으로 사용합니다. 중첩된 `db.trans`는 savepoint로 동작합니다. 트랜잭션 안에서 시작한 비동기 작업은 트랜잭션이 끝나기 전에 모두 `await`해야 합니다.

```ts
await db.trans(async () => {
  const id = await user.add({ name: '트랜잭션 사용자' });
  await user.editByPrimaryKey({ name: '이름 변경' }, id);

  // 같은 트랜잭션을 사용하는 원본 Drizzle API
  await db.current().select().from(users);

  await db.trans(async () => {
    await user.removeByPrimaryKey(id);
  });
});
```

`db.current()`는 현재 문맥의 Drizzle 데이터베이스 인스턴스를 반환합니다. 래퍼가 제공하지 않는 Drizzle 기능은 이 API로 직접 사용할 수 있습니다.

### 테이블 수정·삭제 금지

이 패키지의 `mysqlTable`에 `{ updateBlocked: true, deleteBlocked: true }`를 전달하면 등록과 조회는 유지하면서 테이블 전체의 수정·삭제를 금지합니다. 정책은 세 번째 인자에 전달하거나, 인덱스·제약조건 설정 콜백을 사용하는 경우 네 번째 인자에 전달합니다. 각 옵션을 생략하거나 `false`로 지정하면 해당 작업은 기존처럼 허용됩니다. 별도로 선언하는 정책 객체에는 `as const` 또는 `satisfies TablePolicy`를 사용해 `true` 리터럴 타입을 유지하면 타입 검사에서도 차단됩니다.

```ts
import { mysqlTable, int, varchar, index } from '@pdg/drizzle-mysql';

const logs = mysqlTable(
  'logs',
  {
    id: int().autoincrement().primaryKey(),
    message: varchar({ length: 100 }).notNull(),
  },
  { updateBlocked: true, deleteBlocked: true },
);

const indexedLogs = mysqlTable(
  'indexed_logs',
  {
    id: int().autoincrement().primaryKey(),
    message: varchar({ length: 100 }).notNull(),
  },
  (t) => [index('indexed_logs_message_idx').on(t.message)],
  { updateBlocked: true, deleteBlocked: true },
);
```

`updateBlocked`는 `MySqlQuery.edit`와 `editByPrimaryKey`, `deleteBlocked`는 `remove`와 `removeByPrimaryKey` 호출을 TypeScript에서 차단합니다. 타입 정보가 사라지거나 JavaScript에서 호출하더라도 조건 콜백과 DB 접근 전에 명시적인 오류가 발생합니다. 테이블 수정 금지는 컬럼의 `updateAllowed()`보다 우선합니다. 정책은 `db.query(table)`과 직접 생성한 `MySqlQuery` 모두에 적용되지만, 원본 Drizzle 쿼리나 직접 실행한 SQL에는 적용되지 않습니다. DB 수준의 제한이 필요하면 별도로 `UPDATE`·`DELETE` 권한을 제한해야 합니다.

### 생성·수정 시각

컬럼 정책은 이 패키지에서 가져온 `mysqlTable`에 선언합니다. 자동 증가 컬럼은 기본적으로 등록과 수정이 금지되며, 각각 `insertAllowed()`와 `updateAllowed()`로 허용할 수 있습니다. `primaryKey()`로 지정한 컬럼도 기본적으로 수정이 금지되며, `updateAllowed()`를 명시해야 수정할 수 있습니다. 다른 컬럼은 `insertBlocked()`와 `updateBlocked()`로 금지하거나 `updateRequired()`로 수정 시 필수로 지정합니다. 금지된 값을 전달하거나 필수 수정 값을 누락하면 런타임에도 오류가 발생합니다.

금지 컬럼은 `MySqlAddValues` / `MySqlEditValues`의 키에서 제외됩니다. 따라서 타입이 지정된 객체 리터럴에는 `undefined`로도 지정할 수 없습니다. TypeScript의 구조적 타입 검사로 인해 추가 속성이 있는 기존 변수를 전달하는 경우에는 컴파일을 통과할 수 있지만, 런타임에서는 금지 컬럼 키가 있으면 값이 `undefined`여도 오류가 발생합니다.

```ts
import { drizzleMySql, mysqlTable, int, varchar, datetime } from '@pdg/drizzle-mysql';

const users = mysqlTable('users', {
  id: int().autoincrement().primaryKey(),
  name: varchar({ length: 50 }).notNull(),
  locked: int().default(0).notNull().updateBlocked(),
  created_at: datetime({ mode: 'string' }).notNull().createdAt(),
  updated_at: datetime({ mode: 'string' }).notNull().updatedAt(),
});
const db = drizzleMySql({ url: process.env.DATABASE_URL!, schema: { users }, getTimestamp: () => new Date().toISOString() });
const usersQuery = db.query(users);
const id = await usersQuery.add({ name: '사용자' });
await usersQuery.editByPrimaryKey({ name: '수정' }, id);
```

`createdAt()`과 `updatedAt()` 컬럼은 `add` 시 직접 값을 지정할 수 있습니다. 생략하거나 `undefined`를 전달한 컬럼만 `getTimestamp` 생성 함수의 기본값으로 채우며, 한 행에서 생성한 값은 누락된 시각 컬럼들이 공유합니다. `getTimestamp`를 지정하지 않으면 기본적으로 `new Date()`를 사용하며, `timezone: 'local'`이면 실행 PC의 현지 시간을 사용합니다. `edit` 시에는 `createdAt()`의 직접 입력을 금지하고 기존 값을 유지합니다. `updatedAt()`은 직접 지정한 값을 사용하며, 생략하거나 `undefined`이면 기본 시각으로 갱신합니다. 명시적인 `updateBlocked()` 정책은 계속 적용되며, `updatedAt().updateRequired()`는 생략 시 기본 시각을 사용합니다. 직접 지정하는 값과 생성 함수의 반환값은 컬럼의 데이터 형식에 맞아야 합니다. `MySqlQuery`에 `db.current`가 아닌 연결 함수를 직접 전달하는 경우에는 기본 시각이 필요한 작업을 위해 세 번째 인자로 시각 생성 함수도 지정해야 하며, 생성 함수 없이 기본 시각이 필요한 작업을 실행하면 오류가 발생합니다. 정책은 `MySqlQuery`에만 적용되며 `db.current()`의 원본 Drizzle 쿼리에는 적용되지 않습니다. `mysqlTableCreator`, `mysqlSchema` 또는 Drizzle에서 직접 가져온 `mysqlTable`은 컬럼 정책을 수집하지 않으므로 정책이 필요한 테이블에는 이 패키지의 `mysqlTable`을 사용합니다.

```ts
await usersQuery.add({ name: '사용자', created_at: '2026-01-01 00:00:00' });
// created_at은 지정한 값을 유지하고 updated_at은 getTimestamp의 값을 사용합니다.
await usersQuery.editByPrimaryKey({ updated_at: '2026-01-02 00:00:00' }, id);
// updated_at은 지정한 값을 사용합니다.
```

### 집계·SQL 표현식

`db` 인스턴스는 `asc`, `desc`, `count`, `countDistinct`, `avg`, `avgDistinct`, `sum`, `sumDistinct`, `max`, `min`, `not`, `exists`, `notExists`, `arrayContains`, `arrayContained`, `arrayOverlaps` 등 Drizzle 함수를 제공합니다. `db.sqlNumber`, `db.sqlString`, `db.sqlBoolean`은 SQL 표현식 또는 기본 값을 해당 타입으로 매핑하는 표현식을 만듭니다.

```ts
const [summary] = await db.current()
  .select({ total: db.count() })
  .from(users);

const numericExpression = db.sqlNumber(db.sql`1`);
```

### 공개 타입과 스키마 API

스키마 정의에 필요한 다음 API를 `@pdg/drizzle-mysql`에서 직접 가져올 수 있습니다.

| 구분 | 내보내기 |
| --- | --- |
| 테이블·스키마·뷰 | `mysqlTable`, `mysqlTableCreator`, `mysqlSchema`, `mysqlDatabase`, `mysqlView` |
| 정수·실수 | `tinyint`, `smallint`, `mediumint`, `int`, `bigint`, `serial`, `float`, `double`, `real`, `decimal` |
| 문자열 | `char`, `varchar`, `tinytext`, `text`, `mediumtext`, `longtext`, `mysqlEnum` |
| 날짜·시간 | `date`, `datetime`, `time`, `timestamp`, `year` |
| 바이너리 | `binary`, `varbinary`, `tinyblob`, `blob`, `mediumblob`, `longblob` |
| 기타 컬럼 | `boolean`, `json`, `customType` |
| 인덱스·제약조건 | `index`, `uniqueIndex`, `primaryKey`, `foreignKey`, `unique`, `check` |
| 타입 (`import type`) | `InferColumnsDataTypes`, `MySqlConditions`, `MySqlAddValues`, `MySqlEditValues`, `MySqlAliasTable`, `MySqlSelectedColumns`, `MySqlSelectedTableColumns`, `MySqlColumnSelectionName`, `MySqlSelectedNamedColumnUnion`, `MySqlSelectedNamedColumns`, `MySqlCompareValues`, `MySqlColumnName`, `MySqlArrayCompareValues`, `MySqlRangeCompareValues`, `MySqlPatternCompareValues`, `MySqlNullConditionInput` |

`check`나 SQL 표현식 기반 기본값에 사용하는 `sql`은 `drizzle-orm`에서 가져옵니다. Drizzle의 `MySqlTable` 등 직접 필요한 타입도 `drizzle-orm/mysql-core`에서 가져올 수 있습니다.

## 라이선스

이 프로젝트는 [MIT 라이선스](https://opensource.org/licenses/MIT)에 따라 배포됩니다.
