import * as native from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
type AggregateDecoder = Parameters<SQL<string | null>['mapWith']>[0];
/** 합계를 지정한 매퍼로 변환한다. SQL NULL은 유지된다. */
export declare function sum<TDecoder extends AggregateDecoder>(expression: Parameters<typeof native.sum>[0], decoder: TDecoder): native.SQL<native.GetDecoderResult<TDecoder> | null>;
/** 중복을 제외한 합계를 지정한 매퍼로 변환한다. SQL NULL은 유지된다. */
export declare function sumDistinct<TDecoder extends AggregateDecoder>(expression: Parameters<typeof native.sumDistinct>[0], decoder: TDecoder): native.SQL<native.GetDecoderResult<TDecoder> | null>;
/** 평균을 지정한 매퍼로 변환한다. SQL NULL은 유지된다. */
export declare function avg<TDecoder extends AggregateDecoder>(expression: Parameters<typeof native.avg>[0], decoder: TDecoder): native.SQL<native.GetDecoderResult<TDecoder> | null>;
/** 중복을 제외한 평균을 지정한 매퍼로 변환한다. SQL NULL은 유지된다. */
export declare function avgDistinct<TDecoder extends AggregateDecoder>(expression: Parameters<typeof native.avgDistinct>[0], decoder: TDecoder): native.SQL<native.GetDecoderResult<TDecoder> | null>;
export {};
