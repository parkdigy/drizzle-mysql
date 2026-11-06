# 프로젝트 구조와 개발 참고

## 프로젝트 개요

`@pdg/drizzle-mysql`은 Drizzle ORM `1.0.0-rc.5`와 `mysql2`를 사용하는 Node.js용 TypeScript npm 라이브러리다. 연결별 쿼리 객체, 조건 생성, 컬럼·별칭 도구, 트랜잭션 및 페이지네이션을 제공한다. 서버 애플리케이션이나 브라우저용 패키지가 아니다.

실제 구현과 설정이 이 문서보다 우선한다. 설정이나 공개 동작을 변경하면 관련 설명도 함께 갱신한다.

## 주요 파일

| 경로 | 책임 |
| --- | --- |
| `src/index.ts` | npm 공개 진입점. 라이브러리 API, 타입 및 일부 Drizzle MySQL 스키마 API를 재수출 |
| `src/drizzleMySql.ts` | mysql2 풀 및 Drizzle 연결 생성, 쿼리 팩토리, 별칭·조건 함수, 현재 연결, 트랜잭션, 페이지네이션, SQL 값 매퍼 |
| `src/MySqlQuery.ts` | 단일 테이블 조회·삽입·수정·삭제, 기본 키 헬퍼, 조건·컬럼 선택 API |
| `src/conditions.ts` | Drizzle 조건 연산자 확장: 테이블/스키마 키와 값 객체 형식 및 네이티브 SQL 연산자 형식 |
| `src/columns.ts` | 컬럼 선택·결과 별칭, 테이블·컬럼 그룹과 관련 타입 |
| `src/alias.ts` | 스키마 테이블 별칭 팩토리 |
| `src/@types/` | 조건·입력 값과 공통 타입, 타입 배럴 |
| `test/library.test.ts` | DB 접속 없이 공개 API와 SQL 생성 동작을 검증 |
| `test/schema.test.ts` | 재수출한 MySQL 컬럼·테이블·제약조건 스키마 API 검증 |
| `test/mysql.test.ts` | 환경 변수로 활성화하는 MySQL CRUD·조건·페이지네이션·트랜잭션 통합 테스트 |
| `test/template.test.ts` | 기본 Jest 예제 |
| `examples/src/example.ts` | 별도 예제 프로젝트의 실행 파일 |
| `package.json` | 패키지 진입점·배포 파일·의존성과 명령 |
| `rollup.config.js` | CJS/ESM 번들과 선언 생성 및 선언 경로 변환 |
| `tsconfig.json` | `src/` 타입 검사 및 선언 설정 |
| `tsconfig.test.json`, `jest.config.ts` | 테스트 타입 설정, ts-jest와 Node 실행 환경 |
| `eslint.config.js`, `.prettierrc.cjs` | ESLint 및 Prettier 설정 |
| `.nvmrc` | Node `24.22.1` |
| `.npmignore`, `package.json`의 `files` | npm 게시물 파일 범위 |

## API와 동작 경계

- `drizzleMySql({ url, schema, timestamp? })`는 연결 풀과 편의 API를 만든다. `db.query(table)`은 해당 테이블용 `MySqlQuery` 인스턴스를 반환한다. `db.current()`는 비동기 실행 문맥의 트랜잭션 또는 기본 Drizzle 연결을 반환한다.
- `db.trans(callback)`은 현재 연결의 트랜잭션을 실행하고 중첩 호출은 savepoint를 사용한다. 콜백의 비동기 작업은 완료 전에 모두 기다려야 한다. 연결 종료에는 `db.close()`를 사용한다.
- `MySqlQuery`는 조회 빌더와 `find`, 기본 키 조회, 존재 여부·개수, CRUD, 컬럼 정책에 따른 생성·수정 시각 자동 입력, 테이블별 조건 메서드를 제공한다. 일반 `edit` / `remove`에는 SQL 조건이 필요하다.
- `db`와 쿼리 객체의 조건 API는 비교, 배열·범위, 패턴, NULL, 그룹 조건을 제공한다. `query.and/or({ ... })`는 객체 그룹 결합이며 같은 객체 안에 and/or 그룹을 재귀 중첩하지 않는다. 함수 오버로드는 Drizzle SQL 조건에도 사용할 수 있다.
- 조건 구현은 `ilike` / `notIlike`도 노출하지만 이들은 `ILIKE` SQL을 생성한다. MySQL은 `ILIKE` 문법을 지원하지 않으므로 MySQL 실행 쿼리에는 사용하지 않는다. `LIKE`의 대소문자 처리는 컬럼 collation에 따른다.
- `db.paginate(builder, page, limit)`는 데이터와 페이지 정보를 반환하고 양의 정수 page/limit를 요구한다. 전달할 query builder는 해당 트랜잭션 문맥 안에서 생성해야 한다.
- 기본 전체 조회 결과는 SQL 컬럼명을 결과 키로 사용한다. Drizzle이 SQL 컬럼명을 모든 TypeScript 추론에서 보존하지 않을 수 있으므로, 스키마 속성명과 SQL 컬럼명을 일치시키거나 컬럼을 명시적으로 선택·별칭 지정한다.
- 공개 타입은 `src/@types/index.ts`와 `src/columns.ts`에서 재수출된다. `src/index.ts`의 상대 디렉터리 재수출은 선언 출력 경로가 배포물 구조와 맞는지 함께 점검한다.
- README에는 지원 사용법과 제한사항을 기록한다. 패키지 루트에서 재수출하지 않은 Drizzle API는 소비자가 `drizzle-orm` 또는 `drizzle-orm/mysql-core`에서 가져온다.

## 빌드와 배포 흐름

```text
src/index.ts
  └─ Rollup + rollup-plugin-typescript2
      ├─ dist/index.cjs       (CommonJS 번들)
      ├─ dist/index.esm.js    (ES module 번들)
      ├─ dist/**/*.d.ts       (ESM 타입 선언)
      └─ dist/**/*.d.cts      (CJS 타입 선언)

test/*.test.ts ─ Jest + ts-jest ─ Node 환경
examples/ ─ 독립 npm 프로젝트
```

- `package.json`의 `exports["."]`는 `import`에 `dist/index.esm.js` / `dist/index.d.ts`, `require`에 `dist/index.cjs` / `dist/index.d.cts`를 연결한다. `main`, `module`, `types`도 패키지 메타데이터에 별도로 선언되어 있다.
- `rollup.config.js`는 `src/index.ts`에서 두 런타임 번들을 만들고 TypeScript 선언을 `dist/`에 출력한다. 생성 선언의 상대 경로에 `.js`를 넣고, CommonJS 선언 복사본의 내부 경로를 `.cjs`로 변환한다. 공개 진입점의 재수출과 실제 선언 경로를 점검한다.
- peer dependency와 그 하위 경로를 Rollup 외부 의존성으로 둔다. 런타임에 필요한 `drizzle-orm`과 `mysql2`는 소비자 프로젝트가 설치해야 한다.
- `package.json`의 `files`는 `dist`, `README.md`를 지정한다. `.npmignore`도 빌드·개발 파일을 제외하므로 배포 변경 시 `npm pack --dry-run`의 실제 파일 목록을 확인한다.
- `dist/`는 생성물이며 Gitignore 설정과 무관하게 직접 수정하지 않는다. `npm run build`와 Rollup은 `dist/*`를 지우고 다시 생성할 수 있으므로, 기존 파일이나 작업 트리를 확인한 뒤 실행한다.
- 예제는 별도 `examples/package.json`을 가지며 루트 패키지 의존성이나 npm workspace가 없다. 현재 예제 실행은 `tsx` 기반이며, 배포된 패키지의 설치 소비 검증을 대신하지 않는다.

## 개발 명령과 주의점

루트에서 실행한다. `.nvmrc` 버전에 맞춘 Node와 설치된 의존성을 사용한다.

| 목적 | 명령 | 참고 |
| --- | --- | --- |
| 타입 검사 | `npm run tsc` | `tsc --noEmit`; `src/` 대상 |
| 소스 lint | `npm run lint` | `src/**/*.ts` 대상 |
| 기본 테스트 | `npm test -- --runInBand --watchman=false` | Jest; MySQL 통합 테스트는 기본 비활성 |
| 통합 테스트 | `MYSQL_INTEGRATION=1 node --env-file=.env ./node_modules/jest/bin/jest.js --runInBand --watchman=false test/mysql.test.ts` | 테스트 DB에서만 실행. 테이블 생성·삭제 및 데이터 읽기·쓰기 권한 필요 |
| 전체 빌드 | `npm run build` | Watchman 재등록 → Jest → Rollup. Watchman 환경에 따라 실패 가능 |
| Rollup만 실행 | `./node_modules/.bin/rollup -c --bundleConfigAsCjs` | 테스트는 별도 실행. `dist/*`를 재생성 |
| 게시 파일 미리보기 | `npm pack --dry-run` | 패키지를 게시하지 않고 포함 파일 표시 |
| 예제 실행 | `npm run dev` | `examples/`의 별도 `tsx` 의존성 설치 필요 |

`npm run pub`는 의존성 설치, 전체 빌드, `npm publish --access=public`을 실행하는 실제 공개 게시 명령이다. 요청이 없는 한 실행하지 않는다. `npm run git:commit`은 `.git-commit.cjs`를 통해 전체 변경을 스테이징할 수 있으므로 임의로 사용하지 않는다. `reinstall:module`은 `node_modules`와 잠금 파일을 삭제하고 재설치하므로 일반 검증 명령이 아니다.
