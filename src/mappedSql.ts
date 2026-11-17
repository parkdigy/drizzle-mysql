import { is, SQL, sql } from 'drizzle-orm';

type MappedSql<TValue> = {
  (strings: TemplateStringsArray, ...values: unknown[]): SQL<TValue>;
  (value: SQL | TValue): SQL<TValue>;
};

function createMappedSql<TValue>(decoder: (value: unknown) => TValue): MappedSql<TValue> {
  return (first: TemplateStringsArray | SQL | TValue, ...values: unknown[]): SQL<TValue> => {
    const expression = Array.isArray(first)
      ? sql(first as unknown as TemplateStringsArray, ...values)
      : is(first, SQL)
        ? first
        : sql`${first}`;
    return expression.mapWith(decoder);
  };
}

export const sqlNumber = createMappedSql(Number);
export const sqlString = createMappedSql(String);
export const sqlBoolean = createMappedSql((value) => value === true || value === 1);
