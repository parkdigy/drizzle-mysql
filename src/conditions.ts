import * as native from 'drizzle-orm';
import { MySqlTable } from 'drizzle-orm/mysql-core';
import type { Column, SQL, SQLWrapper } from 'drizzle-orm';
import type { MySqlColumnName, MySqlConditions, MySqlNullConditionInput } from './@types/index';

export function createConditions<TSchema extends Record<string, MySqlTable>>(schema: TSchema) {
  /********************************************************************************************************************
   * ValueOperators
   * ******************************************************************************************************************/
  type ValueOperators = Exclude<keyof MySqlConditions<MySqlTable>, 'isNull' | 'isNotNull'>;
  type SchemaKey = keyof TSchema & string;
  type TableInput = MySqlTable | SchemaKey;

  const resolveTable = (table: TableInput): MySqlTable => {
    if (typeof table !== 'string') return table;
    if (!Object.hasOwn(schema, table)) {
      throw new Error(`Condition: unknown table "${table}".`);
    }
    return schema[table];
  };

  const getColumn = (table: MySqlTable, name: string): Column => {
    const columns = native.getTableColumns<MySqlTable>(table);
    if (!Object.hasOwn(columns, name)) {
      throw new Error(`Condition: unknown column "${name}".`);
    }
    return columns[name];
  };

  const recordEntries = (values: unknown): [string, unknown][] => {
    if (typeof values !== 'object' || values === null || Array.isArray(values)) {
      throw new Error('Condition: expected a column/value object.');
    }
    return Object.entries(values);
  };

  const isSQLWrapper = (value: unknown): value is SQLWrapper =>
    typeof value === 'object' && value !== null && 'getSQL' in value && typeof value.getSQL === 'function';

  const compareValue = (column: Column, value: unknown, operator: ValueOperators): SQL => {
    if (value === null) {
      if (operator === 'eq') return native.isNull(column);
      if (operator === 'ne') return native.isNotNull(column);
      throw new Error(`${operator}: column "${column.name}" must not be null.`);
    }
    switch (operator) {
      case 'eq':
        return native.eq(column, value);
      case 'ne':
        return native.ne(column, value);
      case 'gt':
        return native.gt(column, value);
      case 'gte':
        return native.gte(column, value);
      case 'lt':
        return native.lt(column, value);
      case 'lte':
        return native.lte(column, value);
      case 'inArray':
      case 'notInArray':
        if (!Array.isArray(value) && !isSQLWrapper(value)) {
          throw new Error(`${operator}: expected an array or a SQL query.`);
        }
        return operator === 'inArray' ? native.inArray(column, value) : native.notInArray(column, value);
      case 'between':
      case 'notBetween':
        if (!Array.isArray(value) || value.length !== 2 || value.some((item) => item == null)) {
          throw new Error(`${operator}: expected two non-null bounds.`);
        }
        return operator === 'between'
          ? native.between(column, value[0], value[1])
          : native.notBetween(column, value[0], value[1]);
      default:
        if (typeof value !== 'string') throw new Error(`${operator}: expected a string pattern.`);
        return native[operator](column, value);
    }
  };

  const valueConditions = (table: MySqlTable, values: unknown, operator: ValueOperators): SQL[] => {
    const conditions: SQL[] = [];
    for (const [name, value] of recordEntries(values)) {
      const column = getColumn(table, name);
      if (value !== undefined) conditions.push(compareValue(column, value, operator));
    }
    return conditions;
  };

  type ObjectOperator<TOperator extends keyof MySqlConditions<MySqlTable>> = {
    <T extends MySqlTable>(table: T, values: MySqlConditions<T>[TOperator]): SQL | undefined;
    <K extends SchemaKey>(table: K, values: MySqlConditions<TSchema[K]>[TOperator]): SQL | undefined;
  };

  // Put table/object overloads first so native SQLWrapper signatures do not swallow object-key completions.
  function extendOperator<
    TNative extends (...args: never[]) => SQL | undefined,
    TObject extends (table: MySqlTable, values: never) => SQL | undefined,
  >(original: TNative, objectOperator: TObject): TObject & TNative;
  function extendOperator(
    original: (...args: never[]) => SQL | undefined,
    objectOperator: (table: MySqlTable, values: never) => SQL | undefined
  ): unknown {
    return (...args: unknown[]): SQL | undefined => {
      if (typeof args[0] === 'string' || native.is(args[0], MySqlTable)) {
        const table = typeof args[0] === 'string' ? resolveTable(args[0] as SchemaKey) : args[0];
        return objectOperator(table, args[1] as never);
      }
      return Reflect.apply(original, undefined, args);
    };
  }

  const objectOperator =
    <TOperator extends ValueOperators>(operator: TOperator): ObjectOperator<TOperator> =>
    (table: TableInput, values: unknown) =>
      native.and(...valueConditions(resolveTable(table), values, operator));

  type NativeBinaryOperator = {
    <TColumn extends Column>(left: TColumn, right: native.GetColumnData<TColumn, 'raw'> | native.SQLWrapper): SQL;
    <T>(left: SQL.Aliased<T>, right: T | native.SQLWrapper): SQL;
    <T extends native.SQLWrapper>(left: Exclude<T, MySqlTable>, right: unknown): SQL;
  };

  // Tables use object dispatch at runtime, not the native SQLWrapper/unknown overload.
  const binaryOperator = <TOperator extends 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte'>(operator: TOperator) =>
    extendOperator<NativeBinaryOperator, ObjectOperator<TOperator>>(native[operator], objectOperator(operator));

  type NullOperator = {
    <T extends MySqlTable>(table: T, name: MySqlColumnName<T>): SQL;
    <T extends MySqlTable>(table: T, names: MySqlNullConditionInput<T>): SQL | undefined;
    <K extends SchemaKey>(table: K, name: MySqlColumnName<(typeof schema)[K]>): SQL;
    <K extends SchemaKey>(table: K, names: MySqlNullConditionInput<(typeof schema)[K]>): SQL | undefined;
  };

  const nullOperator = (operator: 'isNull' | 'isNotNull'): NullOperator =>
    ((table: TableInput, input: unknown): SQL | undefined => {
      const names = typeof input === 'string' ? [input] : input === undefined ? [] : input;
      if (!Array.isArray(names)) throw new Error(`${operator}: expected column names.`);
      const conditions: SQL[] = [];
      for (const name of names) {
        if (name === undefined) continue;
        if (typeof name !== 'string') throw new Error(`${operator}: expected a column name.`);
        conditions.push(native[operator](getColumn(resolveTable(table), name)));
      }
      return native.and(...conditions);
    }) as NullOperator;

  type GroupOperator = {
    <T extends MySqlTable>(table: T, options: MySqlConditions<T>): SQL | undefined;
    <K extends SchemaKey>(table: K, options: MySqlConditions<TSchema[K]>): SQL | undefined;
  };

  const groupOperator =
    (operator: 'and' | 'or'): GroupOperator =>
    (input: TableInput, options: unknown): SQL | undefined => {
      const table = resolveTable(input);
      const sqlConditions: SQL[] = [];
      for (const [name, values] of recordEntries(options)) {
        if (!Object.hasOwn(conditions, name) || name === 'and' || name === 'or') {
          throw new Error(`Condition: unknown operator "${name}".`);
        }
        if (values === undefined) continue;
        if (name === 'isNull' || name === 'isNotNull') {
          const condition = nullOperator(name)(table, values as MySqlNullConditionInput<MySqlTable>);
          if (condition !== undefined) sqlConditions.push(condition);
        } else {
          const group = native.and(...valueConditions(table, values, name as ValueOperators));
          if (group !== undefined) sqlConditions.push(group);
        }
      }
      return native[operator](...sqlConditions);
    };

  const logicalOperator = (operator: 'and' | 'or') =>
    extendOperator(
      (...conditions: (native.SQLWrapper | false | undefined)[]): SQL | undefined =>
        native[operator](...conditions.filter((condition) => condition !== false && condition !== undefined)),
      groupOperator(operator)
    );

  const conditions = {
    eq: binaryOperator('eq'),
    ne: binaryOperator('ne'),
    gt: binaryOperator('gt'),
    gte: binaryOperator('gte'),
    lt: binaryOperator('lt'),
    lte: binaryOperator('lte'),
    inArray: extendOperator(native.inArray, objectOperator('inArray')),
    notInArray: extendOperator(native.notInArray, objectOperator('notInArray')),
    between: extendOperator(native.between, objectOperator('between')),
    notBetween: extendOperator(native.notBetween, objectOperator('notBetween')),
    like: extendOperator(native.like, objectOperator('like')),
    notLike: extendOperator(native.notLike, objectOperator('notLike')),
    ilike: extendOperator(native.ilike, objectOperator('ilike')),
    notIlike: extendOperator(native.notIlike, objectOperator('notIlike')),
    isNull: extendOperator(native.isNull, nullOperator('isNull')),
    isNotNull: extendOperator(native.isNotNull, nullOperator('isNotNull')),
    and: logicalOperator('and'),
    or: logicalOperator('or'),
  };

  return conditions;
}

export type MySqlSchemaConditions<TSchema extends Record<string, MySqlTable>> = ReturnType<
  typeof createConditions<TSchema>
>;
