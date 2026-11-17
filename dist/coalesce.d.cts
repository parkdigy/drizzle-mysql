import { type AnyColumn, type GetColumnData, type SQL, type SQLWrapper, type GetDecoderResult } from 'drizzle-orm';
type CoalesceValue = SQLWrapper | string | number | bigint | boolean | Date | null;
type ValueData<T> = T extends AnyColumn ? GetColumnData<T> : T extends SQL<infer D> | SQL.Aliased<infer D> ? D : T extends SQLWrapper ? unknown : T;
export type CoalesceResult<TFirst, TSecond> = Exclude<ValueData<TFirst>, null> | ValueData<TSecond>;
export type CoalesceDecoder = Parameters<SQL<any>['mapWith']>[0];
export type CoalesceOutput<TFirst, TSecond, TDecoder> = TDecoder extends undefined ? CoalesceResult<TFirst, TSecond> : GetDecoderResult<TDecoder> | (unknown extends CoalesceResult<TFirst, TSecond> ? never : null extends CoalesceResult<TFirst, TSecond> ? null : never);
export declare function coalesce<TFirst extends CoalesceValue, TSecond extends CoalesceValue, TDecoder extends CoalesceDecoder | undefined = undefined>(first: TFirst, second: TSecond, decoder?: TDecoder): SQL<CoalesceOutput<TFirst, TSecond, TDecoder>>;
export {};
