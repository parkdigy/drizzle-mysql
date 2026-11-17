import * as native from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

type AggregateDecoder = Parameters<SQL<string | null>['mapWith']>[0];

/** 합계를 지정한 매퍼로 변환한다. SQL NULL은 유지된다. */
export function sum<TDecoder extends AggregateDecoder>(expression: Parameters<typeof native.sum>[0], decoder: TDecoder) {
  return native.sum(expression).mapWith(decoder);
}

/** 중복을 제외한 합계를 지정한 매퍼로 변환한다. SQL NULL은 유지된다. */
export function sumDistinct<TDecoder extends AggregateDecoder>(
  expression: Parameters<typeof native.sumDistinct>[0],
  decoder: TDecoder
) {
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
