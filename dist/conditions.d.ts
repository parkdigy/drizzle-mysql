import * as native from 'drizzle-orm';
import { MySqlTable } from 'drizzle-orm/mysql-core';
import type { Column, SQL } from 'drizzle-orm';
import type { MySqlAndConditions, MySqlColumnName, MySqlNullConditionInput, MySqlOrConditions } from './@types/index.js';
export declare function createConditions<TSchema extends Record<string, MySqlTable>>(schema: TSchema): {
    eq: {
        <T extends MySqlTable>(table: T, values: import("./index.js").MySqlCompareValues<T> | undefined): SQL | undefined;
        <K extends keyof TSchema & string>(table: K, values: import("./index.js").MySqlCompareValues<TSchema[K]> | undefined): SQL | undefined;
    } & {
        <TColumn extends Column>(left: TColumn, right: native.GetColumnData<TColumn, "raw"> | native.SQLWrapper): SQL;
        <T>(left: SQL.Aliased<T>, right: T | native.SQLWrapper): SQL;
        <T extends native.SQLWrapper>(left: Exclude<T, MySqlTable>, right: unknown): SQL;
    };
    ne: {
        <T extends MySqlTable>(table: T, values: import("./index.js").MySqlCompareValues<T> | undefined): SQL | undefined;
        <K extends keyof TSchema & string>(table: K, values: import("./index.js").MySqlCompareValues<TSchema[K]> | undefined): SQL | undefined;
    } & {
        <TColumn extends Column>(left: TColumn, right: native.GetColumnData<TColumn, "raw"> | native.SQLWrapper): SQL;
        <T>(left: SQL.Aliased<T>, right: T | native.SQLWrapper): SQL;
        <T extends native.SQLWrapper>(left: Exclude<T, MySqlTable>, right: unknown): SQL;
    };
    orEq: {
        <T extends MySqlTable>(table: T, values: import("./index.js").MySqlCompareValues<T> | undefined): SQL | undefined;
        <K extends keyof TSchema & string>(table: K, values: import("./index.js").MySqlCompareValues<TSchema[K]> | undefined): SQL | undefined;
    };
    orNe: {
        <T extends MySqlTable>(table: T, values: import("./index.js").MySqlCompareValues<T> | undefined): SQL | undefined;
        <K extends keyof TSchema & string>(table: K, values: import("./index.js").MySqlCompareValues<TSchema[K]> | undefined): SQL | undefined;
    };
    gt: {
        <T extends MySqlTable>(table: T, values: import("./index.js").MySqlCompareValues<T> | undefined): SQL | undefined;
        <K extends keyof TSchema & string>(table: K, values: import("./index.js").MySqlCompareValues<TSchema[K]> | undefined): SQL | undefined;
    } & {
        <TColumn extends Column>(left: TColumn, right: native.GetColumnData<TColumn, "raw"> | native.SQLWrapper): SQL;
        <T>(left: SQL.Aliased<T>, right: T | native.SQLWrapper): SQL;
        <T extends native.SQLWrapper>(left: Exclude<T, MySqlTable>, right: unknown): SQL;
    };
    gte: {
        <T extends MySqlTable>(table: T, values: import("./index.js").MySqlCompareValues<T> | undefined): SQL | undefined;
        <K extends keyof TSchema & string>(table: K, values: import("./index.js").MySqlCompareValues<TSchema[K]> | undefined): SQL | undefined;
    } & {
        <TColumn extends Column>(left: TColumn, right: native.GetColumnData<TColumn, "raw"> | native.SQLWrapper): SQL;
        <T>(left: SQL.Aliased<T>, right: T | native.SQLWrapper): SQL;
        <T extends native.SQLWrapper>(left: Exclude<T, MySqlTable>, right: unknown): SQL;
    };
    lt: {
        <T extends MySqlTable>(table: T, values: import("./index.js").MySqlCompareValues<T> | undefined): SQL | undefined;
        <K extends keyof TSchema & string>(table: K, values: import("./index.js").MySqlCompareValues<TSchema[K]> | undefined): SQL | undefined;
    } & {
        <TColumn extends Column>(left: TColumn, right: native.GetColumnData<TColumn, "raw"> | native.SQLWrapper): SQL;
        <T>(left: SQL.Aliased<T>, right: T | native.SQLWrapper): SQL;
        <T extends native.SQLWrapper>(left: Exclude<T, MySqlTable>, right: unknown): SQL;
    };
    lte: {
        <T extends MySqlTable>(table: T, values: import("./index.js").MySqlCompareValues<T> | undefined): SQL | undefined;
        <K extends keyof TSchema & string>(table: K, values: import("./index.js").MySqlCompareValues<TSchema[K]> | undefined): SQL | undefined;
    } & {
        <TColumn extends Column>(left: TColumn, right: native.GetColumnData<TColumn, "raw"> | native.SQLWrapper): SQL;
        <T>(left: SQL.Aliased<T>, right: T | native.SQLWrapper): SQL;
        <T extends native.SQLWrapper>(left: Exclude<T, MySqlTable>, right: unknown): SQL;
    };
    inArray: {
        <T extends MySqlTable>(table: T, values: import("./index.js").MySqlArrayCompareValues<T> | undefined): SQL | undefined;
        <K extends keyof TSchema & string>(table: K, values: import("./index.js").MySqlArrayCompareValues<TSchema[K]> | undefined): SQL | undefined;
    } & typeof native.inArray;
    notInArray: {
        <T extends MySqlTable>(table: T, values: import("./index.js").MySqlArrayCompareValues<T> | undefined): SQL | undefined;
        <K extends keyof TSchema & string>(table: K, values: import("./index.js").MySqlArrayCompareValues<TSchema[K]> | undefined): SQL | undefined;
    } & typeof native.notInArray;
    between: {
        <T extends MySqlTable>(table: T, values: import("./index.js").MySqlRangeCompareValues<T> | undefined): SQL | undefined;
        <K extends keyof TSchema & string>(table: K, values: import("./index.js").MySqlRangeCompareValues<TSchema[K]> | undefined): SQL | undefined;
    } & typeof native.between;
    notBetween: {
        <T extends MySqlTable>(table: T, values: import("./index.js").MySqlRangeCompareValues<T> | undefined): SQL | undefined;
        <K extends keyof TSchema & string>(table: K, values: import("./index.js").MySqlRangeCompareValues<TSchema[K]> | undefined): SQL | undefined;
    } & typeof native.notBetween;
    like: {
        <T extends MySqlTable>(table: T, values: import("./index.js").MySqlPatternCompareValues<T> | undefined): SQL | undefined;
        <K extends keyof TSchema & string>(table: K, values: import("./index.js").MySqlPatternCompareValues<TSchema[K]> | undefined): SQL | undefined;
    } & typeof native.like;
    notLike: {
        <T extends MySqlTable>(table: T, values: import("./index.js").MySqlPatternCompareValues<T> | undefined): SQL | undefined;
        <K extends keyof TSchema & string>(table: K, values: import("./index.js").MySqlPatternCompareValues<TSchema[K]> | undefined): SQL | undefined;
    } & typeof native.notLike;
    ilike: {
        <T extends MySqlTable>(table: T, values: import("./index.js").MySqlPatternCompareValues<T> | undefined): SQL | undefined;
        <K extends keyof TSchema & string>(table: K, values: import("./index.js").MySqlPatternCompareValues<TSchema[K]> | undefined): SQL | undefined;
    } & typeof native.ilike;
    notIlike: {
        <T extends MySqlTable>(table: T, values: import("./index.js").MySqlPatternCompareValues<T> | undefined): SQL | undefined;
        <K extends keyof TSchema & string>(table: K, values: import("./index.js").MySqlPatternCompareValues<TSchema[K]> | undefined): SQL | undefined;
    } & typeof native.notIlike;
    isNull: {
        <T extends MySqlTable>(table: T, name: MySqlColumnName<T>): SQL;
        <T extends MySqlTable>(table: T, names: MySqlNullConditionInput<T>): SQL | undefined;
        <K extends keyof TSchema & string>(table: K, name: MySqlColumnName<(typeof schema)[K]>): SQL;
        <K extends keyof TSchema & string>(table: K, names: MySqlNullConditionInput<(typeof schema)[K]>): SQL | undefined;
    } & typeof native.isNull;
    isNotNull: {
        <T extends MySqlTable>(table: T, name: MySqlColumnName<T>): SQL;
        <T extends MySqlTable>(table: T, names: MySqlNullConditionInput<T>): SQL | undefined;
        <K extends keyof TSchema & string>(table: K, name: MySqlColumnName<(typeof schema)[K]>): SQL;
        <K extends keyof TSchema & string>(table: K, names: MySqlNullConditionInput<(typeof schema)[K]>): SQL | undefined;
    } & typeof native.isNotNull;
    orGt: {
        <T extends MySqlTable>(table: T, values: import("./index.js").MySqlCompareValues<T> | undefined): SQL | undefined;
        <K extends keyof TSchema & string>(table: K, values: import("./index.js").MySqlCompareValues<TSchema[K]> | undefined): SQL | undefined;
    };
    orGte: {
        <T extends MySqlTable>(table: T, values: import("./index.js").MySqlCompareValues<T> | undefined): SQL | undefined;
        <K extends keyof TSchema & string>(table: K, values: import("./index.js").MySqlCompareValues<TSchema[K]> | undefined): SQL | undefined;
    };
    orLt: {
        <T extends MySqlTable>(table: T, values: import("./index.js").MySqlCompareValues<T> | undefined): SQL | undefined;
        <K extends keyof TSchema & string>(table: K, values: import("./index.js").MySqlCompareValues<TSchema[K]> | undefined): SQL | undefined;
    };
    orLte: {
        <T extends MySqlTable>(table: T, values: import("./index.js").MySqlCompareValues<T> | undefined): SQL | undefined;
        <K extends keyof TSchema & string>(table: K, values: import("./index.js").MySqlCompareValues<TSchema[K]> | undefined): SQL | undefined;
    };
    orInArray: {
        <T extends MySqlTable>(table: T, values: import("./index.js").MySqlArrayCompareValues<T> | undefined): SQL | undefined;
        <K extends keyof TSchema & string>(table: K, values: import("./index.js").MySqlArrayCompareValues<TSchema[K]> | undefined): SQL | undefined;
    };
    orNotInArray: {
        <T extends MySqlTable>(table: T, values: import("./index.js").MySqlArrayCompareValues<T> | undefined): SQL | undefined;
        <K extends keyof TSchema & string>(table: K, values: import("./index.js").MySqlArrayCompareValues<TSchema[K]> | undefined): SQL | undefined;
    };
    orBetween: {
        <T extends MySqlTable>(table: T, values: import("./index.js").MySqlRangeCompareValues<T> | undefined): SQL | undefined;
        <K extends keyof TSchema & string>(table: K, values: import("./index.js").MySqlRangeCompareValues<TSchema[K]> | undefined): SQL | undefined;
    };
    orNotBetween: {
        <T extends MySqlTable>(table: T, values: import("./index.js").MySqlRangeCompareValues<T> | undefined): SQL | undefined;
        <K extends keyof TSchema & string>(table: K, values: import("./index.js").MySqlRangeCompareValues<TSchema[K]> | undefined): SQL | undefined;
    };
    orLike: {
        <T extends MySqlTable>(table: T, values: import("./index.js").MySqlPatternCompareValues<T> | undefined): SQL | undefined;
        <K extends keyof TSchema & string>(table: K, values: import("./index.js").MySqlPatternCompareValues<TSchema[K]> | undefined): SQL | undefined;
    };
    orNotLike: {
        <T extends MySqlTable>(table: T, values: import("./index.js").MySqlPatternCompareValues<T> | undefined): SQL | undefined;
        <K extends keyof TSchema & string>(table: K, values: import("./index.js").MySqlPatternCompareValues<TSchema[K]> | undefined): SQL | undefined;
    };
    orIlike: {
        <T extends MySqlTable>(table: T, values: import("./index.js").MySqlPatternCompareValues<T> | undefined): SQL | undefined;
        <K extends keyof TSchema & string>(table: K, values: import("./index.js").MySqlPatternCompareValues<TSchema[K]> | undefined): SQL | undefined;
    };
    orNotIlike: {
        <T extends MySqlTable>(table: T, values: import("./index.js").MySqlPatternCompareValues<T> | undefined): SQL | undefined;
        <K extends keyof TSchema & string>(table: K, values: import("./index.js").MySqlPatternCompareValues<TSchema[K]> | undefined): SQL | undefined;
    };
    orIsNull: {
        <T extends MySqlTable>(table: T, name: MySqlColumnName<T>): SQL;
        <T extends MySqlTable>(table: T, names: MySqlNullConditionInput<T>): SQL | undefined;
        <K extends keyof TSchema & string>(table: K, name: MySqlColumnName<(typeof schema)[K]>): SQL;
        <K extends keyof TSchema & string>(table: K, names: MySqlNullConditionInput<(typeof schema)[K]>): SQL | undefined;
    };
    orIsNotNull: {
        <T extends MySqlTable>(table: T, name: MySqlColumnName<T>): SQL;
        <T extends MySqlTable>(table: T, names: MySqlNullConditionInput<T>): SQL | undefined;
        <K extends keyof TSchema & string>(table: K, name: MySqlColumnName<(typeof schema)[K]>): SQL;
        <K extends keyof TSchema & string>(table: K, names: MySqlNullConditionInput<(typeof schema)[K]>): SQL | undefined;
    };
    and: {
        <T extends MySqlTable>(table: T, options: MySqlAndConditions<T> | MySqlOrConditions<T>): SQL | undefined;
        <K extends keyof TSchema & string>(table: K, options: MySqlAndConditions<TSchema[K]> | MySqlOrConditions<TSchema[K]>): SQL | undefined;
    } & ((...conditions: (native.SQLWrapper | false | undefined)[]) => SQL | undefined);
    or: {
        <T extends MySqlTable>(table: T, options: MySqlAndConditions<T> | MySqlOrConditions<T>): SQL | undefined;
        <K extends keyof TSchema & string>(table: K, options: MySqlAndConditions<TSchema[K]> | MySqlOrConditions<TSchema[K]>): SQL | undefined;
    } & ((...conditions: (native.SQLWrapper | false | undefined)[]) => SQL | undefined);
};
export type MySqlSchemaConditions<TSchema extends Record<string, MySqlTable>> = ReturnType<typeof createConditions<TSchema>>;
