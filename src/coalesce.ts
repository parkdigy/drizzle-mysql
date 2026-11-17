import { sql, type AnyColumn, type GetColumnData, type SQL, type SQLWrapper, type GetDecoderResult } from 'drizzle-orm';

type CoalesceValue = SQLWrapper | string | number | bigint | boolean | Date | null;
type ValueData<T> = T extends AnyColumn
  ? GetColumnData<T>
  : T extends SQL<infer D> | SQL.Aliased<infer D>
    ? D
    : T extends SQLWrapper
      ? unknown
      : T;

export type CoalesceResult<TFirst, TSecond> = Exclude<ValueData<TFirst>, null> | ValueData<TSecond>;

export type CoalesceDecoder = Parameters<SQL<any>['mapWith']>[0];
export type CoalesceOutput<TFirst, TSecond, TDecoder> = TDecoder extends undefined
  ? CoalesceResult<TFirst, TSecond>
  : | GetDecoderResult<TDecoder>
    | (unknown extends CoalesceResult<TFirst, TSecond>
        ? never
        : null extends CoalesceResult<TFirst, TSecond>
          ? null
          : never);

export function coalesce<
  TFirst extends CoalesceValue,
  TSecond extends CoalesceValue,
  TDecoder extends CoalesceDecoder | undefined = undefined,
>(first: TFirst, second: TSecond, decoder?: TDecoder): SQL<CoalesceOutput<TFirst, TSecond, TDecoder>>;
export function coalesce<TResult>(first: CoalesceValue, second: CoalesceValue, decoder?: CoalesceDecoder): SQL<TResult>;
export function coalesce(first: CoalesceValue, second: CoalesceValue, decoder?: CoalesceDecoder): SQL {
  const expression = sql`coalesce(${first}, ${second})`;
  return decoder === undefined ? expression : expression.mapWith(decoder);
}

export function coalesceNumber<TFirst extends CoalesceValue, TSecond extends CoalesceValue>(
  first: TFirst,
  second: TSecond
): SQL<CoalesceOutput<TFirst, TSecond, NumberConstructor>>;
export function coalesceNumber<TResult>(first: CoalesceValue, second: CoalesceValue): SQL<TResult>;
export function coalesceNumber(first: CoalesceValue, second: CoalesceValue): SQL {
  return coalesce(first, second, Number);
}

export function coalesceString<TFirst extends CoalesceValue, TSecond extends CoalesceValue>(
  first: TFirst,
  second: TSecond
): SQL<CoalesceOutput<TFirst, TSecond, StringConstructor>>;
export function coalesceString<TResult>(first: CoalesceValue, second: CoalesceValue): SQL<TResult>;
export function coalesceString(first: CoalesceValue, second: CoalesceValue): SQL {
  return coalesce(first, second, String);
}

export function coalesceBoolean<TFirst extends CoalesceValue, TSecond extends CoalesceValue>(
  first: TFirst,
  second: TSecond
): SQL<CoalesceOutput<TFirst, TSecond, BooleanConstructor>>;
export function coalesceBoolean<TResult>(first: CoalesceValue, second: CoalesceValue): SQL<TResult>;
export function coalesceBoolean(first: CoalesceValue, second: CoalesceValue): SQL {
  return coalesce(first, second, Boolean);
}
