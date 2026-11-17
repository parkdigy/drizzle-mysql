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
