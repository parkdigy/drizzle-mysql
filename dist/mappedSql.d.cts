import { SQL } from 'drizzle-orm';
type MappedSql<TValue> = {
    (strings: TemplateStringsArray, ...values: unknown[]): SQL<TValue>;
    (value: SQL | TValue): SQL<TValue>;
};
export declare const sqlNumber: MappedSql<number>;
export declare const sqlString: MappedSql<string>;
export declare const sqlBoolean: MappedSql<boolean>;
export {};
