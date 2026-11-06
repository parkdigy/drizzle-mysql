import * as native from 'drizzle-orm';
import { MySqlTable } from 'drizzle-orm/mysql-core';
import type { Column, SQL } from 'drizzle-orm';
import type { MySqlColumnName, MySqlConditions, MySqlNullConditionInput } from './@types/index.cjs';
export declare function createConditions<TSchema extends Record<string, MySqlTable>>(schema: TSchema): {
    eq: {
        <T extends (keyof TSchema & string) | MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>(table: T, values: import("./index.cjs").MySqlCompareValues<T extends keyof TSchema & string ? TSchema[T] : Extract<T, MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>> | undefined): SQL | undefined;
        <T extends MySqlTable>(table: T, values: import("./index.cjs").MySqlCompareValues<T> | undefined): SQL | undefined;
    } & {
        <TColumn extends Column>(left: TColumn, right: native.GetColumnData<TColumn, "raw"> | native.SQLWrapper): SQL;
        <T>(left: SQL.Aliased<T>, right: T | native.SQLWrapper): SQL;
        <T extends native.SQLWrapper>(left: Exclude<T, MySqlTable>, right: unknown): SQL;
    };
    ne: {
        <T extends (keyof TSchema & string) | MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>(table: T, values: import("./index.cjs").MySqlCompareValues<T extends keyof TSchema & string ? TSchema[T] : Extract<T, MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>> | undefined): SQL | undefined;
        <T extends MySqlTable>(table: T, values: import("./index.cjs").MySqlCompareValues<T> | undefined): SQL | undefined;
    } & {
        <TColumn extends Column>(left: TColumn, right: native.GetColumnData<TColumn, "raw"> | native.SQLWrapper): SQL;
        <T>(left: SQL.Aliased<T>, right: T | native.SQLWrapper): SQL;
        <T extends native.SQLWrapper>(left: Exclude<T, MySqlTable>, right: unknown): SQL;
    };
    gt: {
        <T extends (keyof TSchema & string) | MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>(table: T, values: import("./index.cjs").MySqlCompareValues<T extends keyof TSchema & string ? TSchema[T] : Extract<T, MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>> | undefined): SQL | undefined;
        <T extends MySqlTable>(table: T, values: import("./index.cjs").MySqlCompareValues<T> | undefined): SQL | undefined;
    } & {
        <TColumn extends Column>(left: TColumn, right: native.GetColumnData<TColumn, "raw"> | native.SQLWrapper): SQL;
        <T>(left: SQL.Aliased<T>, right: T | native.SQLWrapper): SQL;
        <T extends native.SQLWrapper>(left: Exclude<T, MySqlTable>, right: unknown): SQL;
    };
    gte: {
        <T extends (keyof TSchema & string) | MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>(table: T, values: import("./index.cjs").MySqlCompareValues<T extends keyof TSchema & string ? TSchema[T] : Extract<T, MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>> | undefined): SQL | undefined;
        <T extends MySqlTable>(table: T, values: import("./index.cjs").MySqlCompareValues<T> | undefined): SQL | undefined;
    } & {
        <TColumn extends Column>(left: TColumn, right: native.GetColumnData<TColumn, "raw"> | native.SQLWrapper): SQL;
        <T>(left: SQL.Aliased<T>, right: T | native.SQLWrapper): SQL;
        <T extends native.SQLWrapper>(left: Exclude<T, MySqlTable>, right: unknown): SQL;
    };
    lt: {
        <T extends (keyof TSchema & string) | MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>(table: T, values: import("./index.cjs").MySqlCompareValues<T extends keyof TSchema & string ? TSchema[T] : Extract<T, MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>> | undefined): SQL | undefined;
        <T extends MySqlTable>(table: T, values: import("./index.cjs").MySqlCompareValues<T> | undefined): SQL | undefined;
    } & {
        <TColumn extends Column>(left: TColumn, right: native.GetColumnData<TColumn, "raw"> | native.SQLWrapper): SQL;
        <T>(left: SQL.Aliased<T>, right: T | native.SQLWrapper): SQL;
        <T extends native.SQLWrapper>(left: Exclude<T, MySqlTable>, right: unknown): SQL;
    };
    lte: {
        <T extends (keyof TSchema & string) | MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>(table: T, values: import("./index.cjs").MySqlCompareValues<T extends keyof TSchema & string ? TSchema[T] : Extract<T, MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>> | undefined): SQL | undefined;
        <T extends MySqlTable>(table: T, values: import("./index.cjs").MySqlCompareValues<T> | undefined): SQL | undefined;
    } & {
        <TColumn extends Column>(left: TColumn, right: native.GetColumnData<TColumn, "raw"> | native.SQLWrapper): SQL;
        <T>(left: SQL.Aliased<T>, right: T | native.SQLWrapper): SQL;
        <T extends native.SQLWrapper>(left: Exclude<T, MySqlTable>, right: unknown): SQL;
    };
    inArray: {
        <T extends (keyof TSchema & string) | MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>(table: T, values: import("./index.cjs").MySqlArrayCompareValues<T extends keyof TSchema & string ? TSchema[T] : Extract<T, MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>> | undefined): SQL | undefined;
        <T extends MySqlTable>(table: T, values: import("./index.cjs").MySqlArrayCompareValues<T> | undefined): SQL | undefined;
    } & typeof native.inArray;
    notInArray: {
        <T extends (keyof TSchema & string) | MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>(table: T, values: import("./index.cjs").MySqlArrayCompareValues<T extends keyof TSchema & string ? TSchema[T] : Extract<T, MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>> | undefined): SQL | undefined;
        <T extends MySqlTable>(table: T, values: import("./index.cjs").MySqlArrayCompareValues<T> | undefined): SQL | undefined;
    } & typeof native.notInArray;
    between: {
        <T extends (keyof TSchema & string) | MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>(table: T, values: import("./index.cjs").MySqlRangeCompareValues<T extends keyof TSchema & string ? TSchema[T] : Extract<T, MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>> | undefined): SQL | undefined;
        <T extends MySqlTable>(table: T, values: import("./index.cjs").MySqlRangeCompareValues<T> | undefined): SQL | undefined;
    } & typeof native.between;
    notBetween: {
        <T extends (keyof TSchema & string) | MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>(table: T, values: import("./index.cjs").MySqlRangeCompareValues<T extends keyof TSchema & string ? TSchema[T] : Extract<T, MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>> | undefined): SQL | undefined;
        <T extends MySqlTable>(table: T, values: import("./index.cjs").MySqlRangeCompareValues<T> | undefined): SQL | undefined;
    } & typeof native.notBetween;
    like: {
        <T extends (keyof TSchema & string) | MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>(table: T, values: import("./index.cjs").MySqlPatternCompareValues<T extends keyof TSchema & string ? TSchema[T] : Extract<T, MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>> | undefined): SQL | undefined;
        <T extends MySqlTable>(table: T, values: import("./index.cjs").MySqlPatternCompareValues<T> | undefined): SQL | undefined;
    } & typeof native.like;
    notLike: {
        <T extends (keyof TSchema & string) | MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>(table: T, values: import("./index.cjs").MySqlPatternCompareValues<T extends keyof TSchema & string ? TSchema[T] : Extract<T, MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>> | undefined): SQL | undefined;
        <T extends MySqlTable>(table: T, values: import("./index.cjs").MySqlPatternCompareValues<T> | undefined): SQL | undefined;
    } & typeof native.notLike;
    ilike: {
        <T extends (keyof TSchema & string) | MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>(table: T, values: import("./index.cjs").MySqlPatternCompareValues<T extends keyof TSchema & string ? TSchema[T] : Extract<T, MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>> | undefined): SQL | undefined;
        <T extends MySqlTable>(table: T, values: import("./index.cjs").MySqlPatternCompareValues<T> | undefined): SQL | undefined;
    } & typeof native.ilike;
    notIlike: {
        <T extends (keyof TSchema & string) | MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>(table: T, values: import("./index.cjs").MySqlPatternCompareValues<T extends keyof TSchema & string ? TSchema[T] : Extract<T, MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>> | undefined): SQL | undefined;
        <T extends MySqlTable>(table: T, values: import("./index.cjs").MySqlPatternCompareValues<T> | undefined): SQL | undefined;
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
    and: {
        <T extends (keyof TSchema & string) | MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>(table: T, options: MySqlConditions<T extends keyof TSchema & string ? TSchema[T] : Extract<T, MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>>): SQL | undefined;
        <T extends MySqlTable>(table: T, options: MySqlConditions<T>): SQL | undefined;
    } & ((...conditions: (native.SQLWrapper | false | undefined)[]) => SQL | undefined);
    or: {
        <T extends (keyof TSchema & string) | MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>(table: T, options: MySqlConditions<T extends keyof TSchema & string ? TSchema[T] : Extract<T, MySqlTable<import("drizzle-orm/mysql-core").TableConfig>>>): SQL | undefined;
        <T extends MySqlTable>(table: T, options: MySqlConditions<T>): SQL | undefined;
    } & ((...conditions: (native.SQLWrapper | false | undefined)[]) => SQL | undefined);
};
