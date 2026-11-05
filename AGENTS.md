# 에이전트 코딩 가이드

## 프로젝트

`@pdg/drizzle-mysql`은 Drizzle ORM과 `mysql2`를 사용하는 Node.js용 TypeScript 라이브러리다. MySQL용 쿼리 편의 API를 제공하는 npm 패키지이며, 웹 앱이나 서비스 서버를 만드는 프로젝트가 아니다.

- 공개 진입점과 재수출: `src/index.ts`
- 조건 생성: `src/conditions.ts`
- 테이블 컬럼·별칭: `src/columns.ts`, `src/alias.ts`
- 테이블 쿼리 API: `src/MySqlQuery.ts`
- 연결·트랜잭션·페이지네이션: `src/drizzleMySql.ts`
- 공개 타입: `src/@types/`
- 테스트: `test/`
- 실행 예제: `examples/`
- 프로젝트 구조·설정 참고: `docs/agents/project.md`
- 반복 개발 절차: `.agents/skills/npm-package-development/SKILL.md`

## 작업 원칙

1. 작업을 시작할 때 `git status --short`와 관련 소스·설정·문서를 확인한다. 기존 staged, unstaged, untracked 변경을 보존하고 요청 범위와 무관한 파일은 수정하거나 되돌리지 않는다.
2. 공개 API를 변경할 때 `src/index.ts` 재수출, 생성되는 타입 선언, README 사용법 및 관련 테스트를 함께 확인한다. 타입 전용 재수출은 `export type` 또는 타입 재수출 구문을 사용한다.
3. 실제 구현과 `package.json`, Rollup 설정을 기준으로 문서를 작성한다. 식별자와 명령은 원래 표기를 사용하고, 설명과 작업 보고는 한글로 작성한다.
4. `dist/`는 빌드 생성물이다. 직접 편집하지 않는다. 빌드 실행으로 생성되거나 정리될 수 있으므로 기존 `dist/`의 작업 트리 상태를 먼저 확인한다.
5. 커밋·푸시·게시 명령은 명시적으로 요청된 경우에만 실행한다. 특히 `npm run pub`는 npm에 실제 게시한다. `npm run git:commit`은 전체 변경을 스테이징할 수 있으므로 임의로 실행하지 않는다.

## 검증

`.nvmrc`에 지정된 Node 버전과 저장소의 설치 의존성을 사용한다. 개발 의존성이 설치되지 않았을 때만 루트에서 `npm install`을 실행한다. `examples/`는 별도 npm 프로젝트이며 루트 패키지와 workspace로 연결되어 있지 않다.

일반적인 소스 검증:

```sh
npm run tsc
npm run lint
npm test -- --runInBand --watchman=false
```

- 타입 검사는 루트 `tsconfig.json`에 따라 `src/`를 대상으로 한다. 테스트 설정은 `tsconfig.test.json`과 Jest를 사용한다.
- `npm run lint`는 `src/**/*.ts`만 검사한다.
- MySQL 통합 테스트는 기본 테스트에서 건너뛴다. 실행하려면 테스트 전용 DB URL이 설정된 `.env`와 DB 테이블 생성·삭제 및 데이터 읽기·쓰기 권한이 필요하다. `MYSQL_INTEGRATION=1 node --env-file=.env ./node_modules/jest/bin/jest.js --runInBand --watchman=false test/mysql.test.ts`를 사용하고, 운영 DB에는 실행하지 않는다.
- 빌드 설정, 공개 진입점 또는 선언 출력 변경 시 Rollup 빌드와 `npm pack --dry-run`을 확인한다. `npm run build`는 Watchman 재등록, Jest, Rollup 순서로 실행된다. Watchman 접근 오류가 나면 타입 검사·lint·Watchman 비활성화 테스트와 `./node_modules/.bin/rollup -c --bundleConfigAsCjs`를 각각 실행하고, 표준 빌드 전체 성공으로 보고하지 않는다.
- 배포 경로 변경 시 패키지에 포함되는 파일 및 ESM/CJS의 런타임·타입 해석을 가능한 소비 환경에서 확인한다. 선언 파일 생성만으로 소비자 타입 해석이 확인된 것은 아니다.
- 문서만 수정할 때는 경로·링크·명령·API 이름이 현재 저장소와 일치하는지 확인한다. 문서 검증기가 없으면 전체 테스트를 실행하지 않아도 된다.

실패는 코드 문제, 기존 결함, 환경 제약을 구분해 기록한다. 실패를 숨기기 위해 설정이나 검사를 완화하지 않는다. 완료 보고에는 변경 범위와 실행한 검증 결과, 남은 미확인 사항을 간단히 남긴다.
