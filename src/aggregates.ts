import * as native from 'drizzle-orm';
import type { SQL, SQLWrapper, GetDecoderResult } from 'drizzle-orm';

export type AggregateDecoder = Parameters<SQL<string | null>['mapWith']>[0];

export function sum<TDecoder extends AggregateDecoder>(
  expression: SQLWrapper,
  decoder: TDecoder
): SQL<GetDecoderResult<TDecoder> | null>;
export function sum<TResult>(expression: SQLWrapper, decoder: AggregateDecoder): SQL<TResult>;
export function sum(expression: SQLWrapper, decoder: AggregateDecoder): SQL {
  return native.sum(expression).mapWith(decoder);
}

export function sumDistinct<TDecoder extends AggregateDecoder>(
  expression: SQLWrapper,
  decoder: TDecoder
): SQL<GetDecoderResult<TDecoder> | null>;
export function sumDistinct<TResult>(expression: SQLWrapper, decoder: AggregateDecoder): SQL<TResult>;
export function sumDistinct(expression: SQLWrapper, decoder: AggregateDecoder): SQL {
  return native.sumDistinct(expression).mapWith(decoder);
}

/** 평균을 지정한 매퍼로 변환한다. SQL NULL은 유지된다. */
export function avg<TDecoder extends AggregateDecoder>(expression: Parameters<typeof native.avg>[0], decoder: TDecoder) {
  return native.avg(expression).mapWith(decoder);
}

/** 중복을 제외한 평균을 지정한 매퍼로 변환한다. SQL NULL은 유지된다. */
export function avgDistinct<TDecoder extends AggregateDecoder>(
  expression: Parameters<typeof native.avgDistinct>[0],
  decoder: TDecoder
) {
  return native.avgDistinct(expression).mapWith(decoder);
}

export function sumNumber(expression: SQLWrapper): SQL<number | null>;
export function sumNumber<TResult>(expression: SQLWrapper): SQL<TResult>;
export function sumNumber(expression: SQLWrapper): SQL {
  return sum(expression, Number);
}

export function sumBoolean(expression: SQLWrapper): SQL<boolean | null>;
export function sumBoolean<TResult>(expression: SQLWrapper): SQL<TResult>;
export function sumBoolean(expression: SQLWrapper): SQL {
  return sum(expression, Boolean);
}

export function sumString(expression: SQLWrapper): SQL<string | null>;
export function sumString<TResult>(expression: SQLWrapper): SQL<TResult>;
export function sumString(expression: SQLWrapper): SQL {
  return sum(expression, String);
}

export function sumDistinctNumber(expression: SQLWrapper): SQL<number | null>;
export function sumDistinctNumber<TResult>(expression: SQLWrapper): SQL<TResult>;
export function sumDistinctNumber(expression: SQLWrapper): SQL {
  return sumDistinct(expression, Number);
}

export function sumDistinctBoolean(expression: SQLWrapper): SQL<boolean | null>;
export function sumDistinctBoolean<TResult>(expression: SQLWrapper): SQL<TResult>;
export function sumDistinctBoolean(expression: SQLWrapper): SQL {
  return sumDistinct(expression, Boolean);
}

export function sumDistinctString(expression: SQLWrapper): SQL<string | null>;
export function sumDistinctString<TResult>(expression: SQLWrapper): SQL<TResult>;
export function sumDistinctString(expression: SQLWrapper): SQL {
  return sumDistinct(expression, String);
}

export function avgNumber(expression: SQLWrapper): SQL<number | null>;
export function avgNumber<TResult>(expression: SQLWrapper): SQL<TResult>;
export function avgNumber(expression: SQLWrapper): SQL {
  return avg(expression, Number);
}

export function avgBoolean(expression: SQLWrapper): SQL<boolean | null>;
export function avgBoolean<TResult>(expression: SQLWrapper): SQL<TResult>;
export function avgBoolean(expression: SQLWrapper): SQL {
  return avg(expression, Boolean);
}

export function avgString(expression: SQLWrapper): SQL<string | null>;
export function avgString<TResult>(expression: SQLWrapper): SQL<TResult>;
export function avgString(expression: SQLWrapper): SQL {
  return avg(expression, String);
}

export function avgDistinctNumber(expression: SQLWrapper): SQL<number | null>;
export function avgDistinctNumber<TResult>(expression: SQLWrapper): SQL<TResult>;
export function avgDistinctNumber(expression: SQLWrapper): SQL {
  return avgDistinct(expression, Number);
}

export function avgDistinctBoolean(expression: SQLWrapper): SQL<boolean | null>;
export function avgDistinctBoolean<TResult>(expression: SQLWrapper): SQL<TResult>;
export function avgDistinctBoolean(expression: SQLWrapper): SQL {
  return avgDistinct(expression, Boolean);
}

export function avgDistinctString(expression: SQLWrapper): SQL<string | null>;
export function avgDistinctString<TResult>(expression: SQLWrapper): SQL<TResult>;
export function avgDistinctString(expression: SQLWrapper): SQL {
  return avgDistinct(expression, String);
}

export function min<TExpression extends SQLWrapper>(
  expression: TExpression
): ReturnType<typeof native.min<TExpression>>;
export function min<TResult>(expression: SQLWrapper): SQL<TResult>;
export function min(expression: SQLWrapper): SQL {
  return native.min(expression);
}

export function max<TExpression extends SQLWrapper>(
  expression: TExpression
): ReturnType<typeof native.max<TExpression>>;
export function max<TResult>(expression: SQLWrapper): SQL<TResult>;
export function max(expression: SQLWrapper): SQL {
  return native.max(expression);
}
