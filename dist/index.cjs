'use strict';Object.defineProperty(exports,'__esModule',{value:true});var mysql=require('mysql2/promise'),mysql2=require('drizzle-orm/mysql2'),native=require('drizzle-orm'),node_async_hooks=require('node:async_hooks'),alias=require('drizzle-orm/mysql-core/alias'),mysqlCore=require('drizzle-orm/mysql-core'),common=require('drizzle-orm/mysql-core/columns/common');function _interopNamespaceDefault(e){var n=Object.create(null);if(e){Object.keys(e).forEach(function(k){if(k!=='default'){var d=Object.getOwnPropertyDescriptor(e,k);Object.defineProperty(n,k,d.get?d:{enumerable:true,get:function(){return e[k]}});}})}n.default=e;return Object.freeze(n)}var native__namespace=/*#__PURE__*/_interopNamespaceDefault(native);function createAlias(schema) {
    /********************************************************************************************************************
     * getDefaultAlias
     * ******************************************************************************************************************/
    const getDefaultAlias = (tableName) => `${tableName[0]}${(tableName.slice(1).match(/[A-Z]/g) ?? []).join('')}`.toLowerCase();
    /********************************************************************************************************************
     * createAlias
     * ******************************************************************************************************************/
    const createAlias = (tableName) => (alias$1 = getDefaultAlias(tableName)) => alias.alias(schema[tableName], alias$1);
    /********************************************************************************************************************
     * alias
     * ******************************************************************************************************************/
    const alias$1 = Object.fromEntries(Object.keys(schema).map((tableName) => [tableName, createAlias(tableName)]));
    return alias$1;
}function createConditions(schema) {
    const resolveTable = (table) => {
        if (typeof table !== 'string')
            return table;
        if (!Object.hasOwn(schema, table)) {
            throw new Error(`Condition: unknown table "${table}".`);
        }
        return schema[table];
    };
    const getColumn = (table, name) => {
        const columns = native__namespace.getTableColumns(table);
        if (!Object.hasOwn(columns, name)) {
            throw new Error(`Condition: unknown column "${name}".`);
        }
        return columns[name];
    };
    const recordEntries = (values) => {
        if (typeof values !== 'object' || values === null || Array.isArray(values)) {
            throw new Error('Condition: expected a column/value object.');
        }
        return Object.entries(values);
    };
    const compareValue = (column, value, operator) => {
        if (value === null) {
            if (operator === 'eq')
                return native__namespace.isNull(column);
            if (operator === 'ne')
                return native__namespace.isNotNull(column);
            throw new Error(`${operator}: column "${column.name}" must not be null.`);
        }
        switch (operator) {
            case 'eq':
                return native__namespace.eq(column, value);
            case 'ne':
                return native__namespace.ne(column, value);
            case 'gt':
                return native__namespace.gt(column, value);
            case 'gte':
                return native__namespace.gte(column, value);
            case 'lt':
                return native__namespace.lt(column, value);
            case 'lte':
                return native__namespace.lte(column, value);
            case 'inArray':
            case 'notInArray':
                if (!Array.isArray(value))
                    throw new Error(`${operator}: expected an array.`);
                return operator === 'inArray' ? native__namespace.inArray(column, value) : native__namespace.notInArray(column, value);
            case 'between':
            case 'notBetween':
                if (!Array.isArray(value) || value.length !== 2 || value.some((item) => item == null)) {
                    throw new Error(`${operator}: expected two non-null bounds.`);
                }
                return operator === 'between'
                    ? native__namespace.between(column, value[0], value[1])
                    : native__namespace.notBetween(column, value[0], value[1]);
            default:
                if (typeof value !== 'string')
                    throw new Error(`${operator}: expected a string pattern.`);
                return native__namespace[operator](column, value);
        }
    };
    const valueConditions = (table, values, operator) => {
        const conditions = [];
        for (const [name, value] of recordEntries(values)) {
            const column = getColumn(table, name);
            if (value !== undefined)
                conditions.push(compareValue(column, value, operator));
        }
        return conditions;
    };
    function extendOperator(original, objectOperator) {
        return (...args) => {
            if (typeof args[0] === 'string' || native__namespace.is(args[0], mysqlCore.MySqlTable)) {
                const table = typeof args[0] === 'string' ? resolveTable(args[0]) : args[0];
                return objectOperator(table, args[1]);
            }
            return Reflect.apply(original, undefined, args);
        };
    }
    const objectOperator = (operator) => (table, values) => native__namespace.and(...valueConditions(resolveTable(table), values, operator));
    // Tables use object dispatch at runtime, not the native SQLWrapper/unknown overload.
    const binaryOperator = (operator) => extendOperator(native__namespace[operator], objectOperator(operator));
    const nullOperator = (operator) => ((table, input) => {
        const names = typeof input === 'string' ? [input] : input === undefined ? [] : input;
        if (!Array.isArray(names))
            throw new Error(`${operator}: expected column names.`);
        const conditions = [];
        for (const name of names) {
            if (name === undefined)
                continue;
            if (typeof name !== 'string')
                throw new Error(`${operator}: expected a column name.`);
            conditions.push(native__namespace[operator](getColumn(resolveTable(table), name)));
        }
        return native__namespace.and(...conditions);
    });
    const groupOperator = (operator) => (input, options) => {
        const table = resolveTable(input);
        const sqlConditions = [];
        for (const [name, values] of recordEntries(options)) {
            if (!Object.hasOwn(conditions, name) || name === 'and' || name === 'or') {
                throw new Error(`Condition: unknown operator "${name}".`);
            }
            if (values === undefined)
                continue;
            if (name === 'isNull' || name === 'isNotNull') {
                const condition = nullOperator(name)(table, values);
                if (condition !== undefined)
                    sqlConditions.push(condition);
            }
            else {
                const group = native__namespace.and(...valueConditions(table, values, name));
                if (group !== undefined)
                    sqlConditions.push(group);
            }
        }
        return native__namespace[operator](...sqlConditions);
    };
    const logicalOperator = (operator) => extendOperator((...conditions) => native__namespace[operator](...conditions.filter((condition) => condition !== false && condition !== undefined)), groupOperator(operator));
    const conditions = {
        eq: binaryOperator('eq'),
        ne: binaryOperator('ne'),
        gt: binaryOperator('gt'),
        gte: binaryOperator('gte'),
        lt: binaryOperator('lt'),
        lte: binaryOperator('lte'),
        inArray: extendOperator(native__namespace.inArray, objectOperator('inArray')),
        notInArray: extendOperator(native__namespace.notInArray, objectOperator('notInArray')),
        between: extendOperator(native__namespace.between, objectOperator('between')),
        notBetween: extendOperator(native__namespace.notBetween, objectOperator('notBetween')),
        like: extendOperator(native__namespace.like, objectOperator('like')),
        notLike: extendOperator(native__namespace.notLike, objectOperator('notLike')),
        ilike: extendOperator(native__namespace.ilike, objectOperator('ilike')),
        notIlike: extendOperator(native__namespace.notIlike, objectOperator('notIlike')),
        isNull: extendOperator(native__namespace.isNull, nullOperator('isNull')),
        isNotNull: extendOperator(native__namespace.isNotNull, nullOperator('isNotNull')),
        and: logicalOperator('and'),
        or: logicalOperator('or'),
    };
    return conditions;
}function TableColumns(first, ...rest) {
    if (Array.isArray(first) && native.isTable(first[0])) {
        const result = {};
        for (const group of [first, ...rest]) {
            if (!Array.isArray(group) || !native.isTable(group[0])) {
                throw new Error('columns: expected a table/column-name tuple.');
            }
            Object.assign(result, TableColumns(group[0], ...group.slice(1)));
        }
        return result;
    }
    if (native.isTable(first)) {
        const tableColumns = native.getTableColumns(first);
        if (rest.length === 0)
            return Object.fromEntries(Object.values(tableColumns).map((column) => [column.name, column]));
        const selected = {};
        for (const selection of rest) {
            if (typeof selection !== 'string') {
                throw new Error('columns: expected a column name.');
            }
            const match = /^(.+?)\s+as\s+(.+)$/i.exec(selection.trim());
            const name = (match?.[1] ?? selection).trim();
            const alias = match?.[2]?.trim();
            if (!Object.hasOwn(tableColumns, name)) {
                throw new Error(`columns: unknown column "${name}".`);
            }
            if (alias)
                selected[alias] = native.sql `${tableColumns[name]}`.as(alias);
            else
                selected[tableColumns[name].name] = tableColumns[name];
        }
        return selected;
    }
    const columns = (Array.isArray(first) ? first : [first, ...rest]);
    return Object.fromEntries(columns.map((column) => {
        if (typeof column === 'string' || Array.isArray(column))
            throw new Error('columns: expected a column object.');
        return [column.name, column];
    }));
}const policies = new WeakMap();
for (const [method, policy] of Object.entries({
    insertBlocked: { insert: 'blocked' },
    insertAllowed: { insert: 'allowed' },
    updateBlocked: { update: 'blocked' },
    updateAllowed: { update: 'allowed' },
    updateRequired: { update: 'required' },
    createdAt: { timestamp: 'created' },
    updatedAt: { timestamp: 'updated' },
})) {
    Object.defineProperty(common.MySqlColumnBuilder.prototype, method, {
        configurable: true,
        value: function () {
            policies.set(this, { ...policies.get(this), ...policy });
            return this;
        },
    });
}
const tablePolicies = new WeakMap();
const tableMutationPolicies = new WeakMap();
function getColumnPolicies(table) {
    return tablePolicies.get(table) ?? {};
}
function getTablePolicy(table) {
    return tableMutationPolicies.get(table) ?? {};
}
function mysqlTable(name, columns, extraConfigOrPolicy, policy) {
    const extraConfig = typeof extraConfigOrPolicy === 'function' ? extraConfigOrPolicy : undefined;
    const mutationPolicy = typeof extraConfigOrPolicy === 'object' ? extraConfigOrPolicy : policy;
    const nativeExtraConfig = extraConfig
        ? (self) => {
            const config = extraConfig(self);
            return Array.isArray(config) ? config : Object.values(config);
        }
        : undefined;
    let builders = {};
    const table = typeof columns === 'function'
        ? mysqlCore.mysqlTable(name, (types) => (builders = columns(types)), nativeExtraConfig)
        : mysqlCore.mysqlTable(name, (builders = columns), nativeExtraConfig);
    tablePolicies.set(table, Object.fromEntries(Object.entries(builders).map(([key, builder]) => [key, policies.get(builder) ?? {}])));
    tableMutationPolicies.set(table, { ...mutationPolicy });
    return table;
}/********************************************************************************************************************
 * MySqlQuery
 * ******************************************************************************************************************/
class MySqlQuery {
    current;
    getTimestamp;
    // Table
    t;
    /********************************************************************************************************************
     * constructor
     * ******************************************************************************************************************/
    constructor(table, current, getTimestamp) {
        this.current = current;
        this.getTimestamp = getTimestamp;
        this.t = table;
    }
    drizzle = { ...createConditions({}), sqlNumber: (value) => native.sql `${value}`.mapWith(Number) };
    /********************************************************************************************************************
     * (PROTECTED) getTx
     * ******************************************************************************************************************/
    getTx() {
        return this.current();
    }
    columns(...names) {
        const table = this.t;
        return TableColumns(table, ...names);
    }
    min(columnOrName) {
        return native.min(this.resolveAggregateColumn(columnOrName));
    }
    max(columnOrName) {
        return native.max(this.resolveAggregateColumn(columnOrName));
    }
    resolveAggregateColumn(columnOrName) {
        if (typeof columnOrName !== 'string')
            return columnOrName;
        const column = native.getTableColumns(this.t)[columnOrName];
        if (!column)
            throw new Error(`aggregate: unknown column "${columnOrName}".`);
        return column;
    }
    resolveOrderColumn(name, table) {
        if (name === undefined)
            throw new Error('orderBy: column name is required.');
        const columns = native.getTableColumns(table);
        if (!Object.hasOwn(columns, name))
            throw new Error(`orderBy: unknown column "${name}".`);
        return columns[name];
    }
    asc(tableOrName, name) {
        const table = typeof tableOrName === 'string' ? this.t : tableOrName;
        const columnName = typeof tableOrName === 'string' ? tableOrName : name;
        return native.asc(this.resolveOrderColumn(columnName, table));
    }
    desc(tableOrName, name) {
        const table = typeof tableOrName === 'string' ? this.t : tableOrName;
        const columnName = typeof tableOrName === 'string' ? tableOrName : name;
        return native.desc(this.resolveOrderColumn(columnName, table));
    }
    resolveFields(fields, table = this.t) {
        if (Array.isArray(fields) && fields.length > 0 && fields.every((field) => typeof field === 'string')) {
            return TableColumns(table, ...fields);
        }
        if (typeof fields !== 'function')
            return normalizeFields(fields, table);
        const query = {
            t: table,
            columns: (...names) => TableColumns(table, ...names),
        };
        return normalizeFields(fields(query), table);
    }
    select(fieldsOrAlias, fields) {
        const tx = this.getTx();
        const isAlias = native.isTable(fieldsOrAlias);
        const table = isAlias ? fieldsOrAlias : this.t;
        const selectedFields = this.resolveFields(isAlias ? fields : fieldsOrAlias, table);
        return tx.select(selectedFields ?? TableColumns(table)).from(table);
    }
    async find(aliasOrFieldsOrWhere, fieldsOrWhere, where) {
        const hasAlias = native.isTable(aliasOrFieldsOrWhere);
        const fieldsOrCondition = hasAlias ? fieldsOrWhere : aliasOrFieldsOrWhere;
        const hasFields = arguments.length === (hasAlias ? 3 : 2);
        const isCondition = (value) => native.is(value, native.SQL) || typeof value === 'function';
        const table = hasAlias ? aliasOrFieldsOrWhere : this.t;
        const selectedFields = this.resolveFields(!hasFields && isCondition(fieldsOrCondition) ? undefined : fieldsOrCondition, table);
        const conditionInput = !hasFields && isCondition(fieldsOrCondition)
            ? fieldsOrCondition
            : hasAlias
                ? where
                : isCondition(fieldsOrWhere)
                    ? fieldsOrWhere
                    : undefined;
        const condition = typeof conditionInput === 'function' ? conditionInput(this) : conditionInput;
        if (condition !== undefined && !native.is(condition, native.SQL)) {
            throw new Error('find: the where callback must return SQL or undefined.');
        }
        const builder = (() => {
            if (hasAlias) {
                const alias = aliasOrFieldsOrWhere;
                if (selectedFields === undefined) {
                    return this.select(alias);
                }
                return this.select(alias, selectedFields);
            }
            return selectedFields === undefined
                ? this.select()
                : this.select(selectedFields);
        })();
        const [result] = await builder.where(condition).limit(1);
        return result;
    }
    async findByPrimaryKey(fieldsOrKey, key) {
        const hasFields = arguments.length === 2;
        const primaryKeyValue = hasFields ? key : fieldsOrKey;
        const condition = this.primaryKeyCondition(primaryKeyValue, 'findByPrimaryKey');
        if (hasFields) {
            return this.find(this.resolveFields(fieldsOrKey), condition);
        }
        return this.find(condition);
    }
    /********************************************************************************************************************
     * primaryKeyCondition
     * ******************************************************************************************************************/
    primaryKeyCondition(primaryKeyValue, method) {
        // 固定された MySqlTable 型で取得し、ジェネリックによる型の拡大を避ける。
        const table = this.t;
        const config = mysqlCore.getTableConfig(table);
        const columns = native.getTableColumns(table);
        const primaryColumns = new Set(config.columns.filter((column) => column.primary));
        for (const primaryKey of config.primaryKeys) {
            for (const column of primaryKey.columns) {
                primaryColumns.add(column);
            }
        }
        const primaryEntries = Object.entries(columns).filter(([, column]) => primaryColumns.has(column));
        if (primaryEntries.length === 0) {
            throw new Error(`${method}: ${config.name} has no primary key.`);
        }
        const isKeyObject = typeof primaryKeyValue === 'object' && primaryKeyValue !== null && !Array.isArray(primaryKeyValue);
        if (primaryEntries.length > 1 && !isKeyObject) {
            throw new Error(`${method}: ${config.name} requires a composite key object.`);
        }
        const keyObject = isKeyObject ? primaryKeyValue : undefined;
        if (keyObject &&
            Object.keys(keyObject).some((name) => !primaryEntries.some(([primaryName]) => primaryName === name))) {
            throw new Error(`${method}: ${config.name} received an unknown primary key field.`);
        }
        const conditions = primaryEntries.map(([name, column]) => {
            if (keyObject && !Object.hasOwn(keyObject, name)) {
                throw new Error(`${method}: missing primary key field "${name}".`);
            }
            const value = keyObject ? keyObject[name] : primaryKeyValue;
            if (value === undefined || value === null) {
                throw new Error(`${method}: primary key field "${name}" must have a value.`);
            }
            return native.eq(column, value);
        });
        const condition = native.and(...conditions);
        if (!condition) {
            throw new Error(`${method}: failed to build the primary key condition.`);
        }
        return condition;
    }
    /********************************************************************************************************************
     * exists
     * ******************************************************************************************************************/
    async exists(where) {
        const condition = typeof where === 'function' ? where(this) : where;
        if (condition !== undefined && !native.is(condition, native.SQL)) {
            throw new Error('exists: the where callback must return SQL or undefined.');
        }
        const [result] = await this.select({ matched: this.drizzle.sqlNumber(1) })
            .where(condition)
            .limit(1);
        return result !== undefined;
    }
    /********************************************************************************************************************
     * existsByPrimarykey
     * ******************************************************************************************************************/
    async existsByPrimaryKey(key) {
        const result = await this.findByPrimaryKey({ matched: this.drizzle.sqlNumber(1) }, key);
        return result !== undefined;
    }
    /********************************************************************************************************************
     * notExists
     * ******************************************************************************************************************/
    async notExists(where) {
        return !(await this.exists(where));
    }
    /********************************************************************************************************************
     * notExistsByPrimaryKey
     * ******************************************************************************************************************/
    async notExistsByPrimaryKey(key) {
        return !(await this.existsByPrimaryKey(key));
    }
    /********************************************************************************************************************
     * count
     * ******************************************************************************************************************/
    async count(where) {
        const condition = typeof where === 'function' ? where(this) : where;
        if (condition !== undefined && !native.is(condition, native.SQL)) {
            throw new Error('count: the where callback must return SQL or undefined.');
        }
        const [{ cnt }] = await this.select({ cnt: native.count() }).where(condition);
        return cnt;
    }
    prepareValues(input, operation) {
        const values = { ...input };
        const columns = native.getTableColumns(this.t);
        const policies = getColumnPolicies(this.t);
        let timestamp;
        let generated = false;
        for (const [key, column] of Object.entries(columns)) {
            const policy = policies[key] ?? {};
            const auto = 'autoIncrement' in column && column.autoIncrement === true;
            const rule = operation === 'insert' ? policy.insert : policy.update;
            const primary = column.primary;
            const blocked = (operation === 'update' && policy.timestamp === 'created') ||
                rule === 'blocked' ||
                (operation === 'update' && primary && rule !== 'allowed') ||
                (auto && rule !== 'allowed' && rule !== 'required');
            if (blocked && Object.hasOwn(values, key))
                throw new Error(`${operation}: column "${key}" is blocked.`);
            if (operation === 'update' &&
                !blocked &&
                rule === 'required' &&
                policy.timestamp !== 'updated' &&
                values[key] === undefined) {
                throw new Error(`update: column "${key}" is required.`);
            }
            if (policy.timestamp && values[key] === undefined && (operation === 'insert' || policy.timestamp === 'updated')) {
                if (!generated) {
                    const getTimestamp = this.getTimestamp ?? this.current.getTimestamp;
                    if (!getTimestamp)
                        throw new Error('timestamp generator is not configured');
                    timestamp = getTimestamp();
                    generated = true;
                }
                values[key] = timestamp;
            }
        }
        return values;
    }
    /********************************************************************************************************************
     * (PRIVATE) executeInsert
     * ******************************************************************************************************************/
    async executeInsert(value) {
        const tx = this.getTx();
        const autoIncrementColumn = mysqlCore.getTableConfig(this.t).columns.find((column) => 'autoIncrement' in column && column.autoIncrement === true);
        const hasAutoIncrement = !!autoIncrementColumn;
        const autoIncrementKey = autoIncrementColumn &&
            Object.keys(native.getTableColumns(this.t)).find((key) => native.getTableColumns(this.t)[key] === autoIncrementColumn);
        if (hasAutoIncrement) {
            if (Array.isArray(value)) {
                const addedItems = await tx.insert(this.t).values(value).$returningId();
                return addedItems.map((item) => item[autoIncrementKey]);
            }
            else {
                const [item] = await tx.insert(this.t).values(value).$returningId();
                return item[autoIncrementKey];
            }
        }
        else {
            if (Array.isArray(value)) {
                await tx.insert(this.t).values(value);
                return Array(value.length).fill(undefined);
            }
            else {
                await tx.insert(this.t).values(value);
                return undefined;
            }
        }
    }
    addValues(values) {
        return values;
    }
    /********************************************************************************************************************
     * editValues
     * ******************************************************************************************************************/
    editValues(values) {
        return values;
    }
    add(value) {
        const items = Array.isArray(value) ? value : [value];
        const values = items.map((item) => this.prepareValues(item, 'insert'));
        return this.executeInsert((Array.isArray(value) ? values : values[0]));
    }
    /********************************************************************************************************************
     * edit
     * ******************************************************************************************************************/
    edit(set, where) {
        this.assertMutationAllowed('update', 'edit');
        const condition = typeof where === 'function' ? where(this) : where;
        if (!native.is(condition, native.SQL)) {
            throw new Error('edit: a SQL where condition is required.');
        }
        const tx = this.getTx();
        return tx
            .update(this.t)
            .set(this.prepareValues(set, 'update'))
            .where(condition);
    }
    /********************************************************************************************************************
     * editByPrimaryKey
     * ******************************************************************************************************************/
    editByPrimaryKey(set, key) {
        this.assertMutationAllowed('update', 'editByPrimaryKey');
        return this.edit(set, this.primaryKeyCondition(key, 'editByPrimaryKey'));
    }
    /********************************************************************************************************************
     * remove
     * ******************************************************************************************************************/
    remove(where) {
        this.assertMutationAllowed('delete', 'remove');
        const condition = typeof where === 'function' ? where(this) : where;
        if (!native.is(condition, native.SQL)) {
            throw new Error('remove: a SQL where condition is required.');
        }
        const tx = this.getTx();
        return tx.delete(this.t).where(condition);
    }
    /********************************************************************************************************************
     * removeByPrimaryKey
     * ******************************************************************************************************************/
    removeByPrimaryKey(key) {
        this.assertMutationAllowed('delete', 'removeByPrimaryKey');
        return this.remove(this.primaryKeyCondition(key, 'removeByPrimaryKey'));
    }
    assertMutationAllowed(operation, method) {
        const policy = getTablePolicy(this.t);
        if (operation === 'update' ? policy.updateBlocked : policy.deleteBlocked) {
            throw new Error(`${method}: ${operation} is blocked for table "${mysqlCore.getTableConfig(this.t).name}".`);
        }
    }
    /********************************************************************************************************************
     * eq
     * ******************************************************************************************************************/
    eq(values) {
        return this.drizzle.eq(this.t, values);
    }
    /********************************************************************************************************************
     * ne
     * ******************************************************************************************************************/
    ne(values) {
        return this.drizzle.ne(this.t, values);
    }
    /********************************************************************************************************************
     * gt
     * ******************************************************************************************************************/
    gt(values) {
        return this.drizzle.gt(this.t, values);
    }
    /********************************************************************************************************************
     * gte
     * ******************************************************************************************************************/
    gte(values) {
        return this.drizzle.gte(this.t, values);
    }
    /********************************************************************************************************************
     * lt
     * ******************************************************************************************************************/
    lt(values) {
        return this.drizzle.lt(this.t, values);
    }
    /********************************************************************************************************************
     * lte
     * ******************************************************************************************************************/
    lte(values) {
        return this.drizzle.lte(this.t, values);
    }
    /********************************************************************************************************************
     * lte
     * ******************************************************************************************************************/
    inArray(values) {
        return this.drizzle.inArray(this.t, values);
    }
    /********************************************************************************************************************
     * notInArray
     * ******************************************************************************************************************/
    notInArray(values) {
        return this.drizzle.notInArray(this.t, values);
    }
    /********************************************************************************************************************
     * between
     * ******************************************************************************************************************/
    between(values) {
        return this.drizzle.between(this.t, values);
    }
    /********************************************************************************************************************
     * notBetween
     * ******************************************************************************************************************/
    notBetween(values) {
        return this.drizzle.notBetween(this.t, values);
    }
    /********************************************************************************************************************
     * like
     * ******************************************************************************************************************/
    like(values) {
        return this.drizzle.like(this.t, values);
    }
    /********************************************************************************************************************
     * notLike
     * ******************************************************************************************************************/
    notLike(values) {
        return this.drizzle.notLike(this.t, values);
    }
    /********************************************************************************************************************
     * ilike
     * ******************************************************************************************************************/
    ilike(values) {
        return this.drizzle.ilike(this.t, values);
    }
    /********************************************************************************************************************
     * notIlike
     * ******************************************************************************************************************/
    notIlike(values) {
        return this.drizzle.notIlike(this.t, values);
    }
    isNull(names) {
        return this.drizzle.isNull(this.t, names);
    }
    isNotNull(names) {
        return this.drizzle.isNotNull(this.t, names);
    }
    /********************************************************************************************************************
     * and
     * ******************************************************************************************************************/
    and(options) {
        return this.drizzle.and(this.t, options);
    }
    /********************************************************************************************************************
     * or
     * ******************************************************************************************************************/
    or(options) {
        return this.drizzle.or(this.t, options);
    }
}
const normalizeFields = (fields, table) => {
    if (fields === undefined)
        return undefined;
    const groups = Array.isArray(fields) ? fields : [fields];
    const result = {};
    for (const group of groups) {
        if (Array.isArray(fields) && (group === false || group === undefined))
            continue;
        if (typeof group !== 'object' || group === null || Array.isArray(group) || native.isTable(group) || native.is(group, native.SQL)) {
            throw new Error('fields: expected a selection object or an array of selection objects.');
        }
        Object.assign(result, group);
    }
    for (const [name, field] of Object.entries(result)) {
        if (typeof field === 'string') {
            const column = table && native.getTableColumns(table)[field];
            if (!column)
                throw new Error(`select: unknown column "${field}".`);
            result[name] = native.sql `${column}`.mapWith(column).as(name);
            continue;
        }
        if (native.is(field, mysqlCore.MySqlColumn) && field.name !== name) {
            result[name] = native.sql `${field}`.mapWith(field).as(name);
        }
    }
    return result;
};function createConnection(options) {
    const pool = mysql.createPool({ uri: options.url });
    const raw = mysql2.drizzle({ client: pool, relations: native.defineRelations(options.schema) });
    const context = new node_async_hooks.AsyncLocalStorage();
    const current = Object.assign(() => context.getStore() ?? raw, { getTimestamp: options.getTimestamp });
    const trans = (callback) => {
        const parent = context.getStore();
        const execute = (tx) => context.run(tx, callback);
        return parent ? parent.transaction(execute) : raw.transaction(execute);
    };
    const paginate = async (builder, page, limit) => {
        if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1) {
            throw new RangeError('page and limit must be positive integers');
        }
        const offset = (page - 1) * limit;
        const [[{ total }], data] = await Promise.all([
            current().select({ total: native.count() }).from(builder.as('a')),
            builder.limit(limit).offset(offset),
        ]);
        return {
            data,
            paging: {
                current_page: page,
                per_page: limit,
                last_page: Math.ceil(total / limit),
                total,
                from: offset,
                to: offset + data.length,
            },
        };
    };
    return {
        current,
        trans,
        paginate,
        close: () => pool.end(),
    };
}
function drizzleMySql(options) {
    const connection = createConnection(options);
    return {
        asc: native__namespace.asc,
        desc: native__namespace.desc,
        count: native__namespace.count,
        countDistinct: native__namespace.countDistinct,
        avg: native__namespace.avg,
        avgDistinct: native__namespace.avgDistinct,
        sum: native__namespace.sum,
        sumDistinct: native__namespace.sumDistinct,
        max: native__namespace.max,
        min: native__namespace.min,
        not: native__namespace.not,
        exists: native__namespace.exists,
        notExists: native__namespace.notExists,
        arrayContains: native__namespace.arrayContains,
        arrayContained: native__namespace.arrayContained,
        arrayOverlaps: native__namespace.arrayOverlaps,
        s: options.schema,
        a: createAlias(options.schema),
        ...createConditions(options.schema),
        columns: TableColumns,
        sql: native.sql,
        sqlNumber: (value) => (native.is(value, native.SQL) ? value : native.sql `${value}`).mapWith(Number),
        sqlString: (value) => (native.is(value, native.SQL) ? value : native.sql `${value}`).mapWith(String),
        sqlBoolean: (value) => (native.is(value, native.SQL) ? value : native.sql `${value}`).mapWith((v) => v === true || v === 1),
        ...connection,
        query: (table) => new MySqlQuery(table, connection.current),
    };
}Object.defineProperty(exports,"asc",{enumerable:true,get:function(){return native.asc}});Object.defineProperty(exports,"avg",{enumerable:true,get:function(){return native.avg}});Object.defineProperty(exports,"avgDistinct",{enumerable:true,get:function(){return native.avgDistinct}});Object.defineProperty(exports,"count",{enumerable:true,get:function(){return native.count}});Object.defineProperty(exports,"countDistinct",{enumerable:true,get:function(){return native.countDistinct}});Object.defineProperty(exports,"desc",{enumerable:true,get:function(){return native.desc}});Object.defineProperty(exports,"exists",{enumerable:true,get:function(){return native.exists}});Object.defineProperty(exports,"max",{enumerable:true,get:function(){return native.max}});Object.defineProperty(exports,"min",{enumerable:true,get:function(){return native.min}});Object.defineProperty(exports,"not",{enumerable:true,get:function(){return native.not}});Object.defineProperty(exports,"notExists",{enumerable:true,get:function(){return native.notExists}});Object.defineProperty(exports,"sum",{enumerable:true,get:function(){return native.sum}});Object.defineProperty(exports,"sumDistinct",{enumerable:true,get:function(){return native.sumDistinct}});Object.defineProperty(exports,"bigint",{enumerable:true,get:function(){return mysqlCore.bigint}});Object.defineProperty(exports,"binary",{enumerable:true,get:function(){return mysqlCore.binary}});Object.defineProperty(exports,"blob",{enumerable:true,get:function(){return mysqlCore.blob}});Object.defineProperty(exports,"boolean",{enumerable:true,get:function(){return mysqlCore.boolean}});Object.defineProperty(exports,"char",{enumerable:true,get:function(){return mysqlCore.char}});Object.defineProperty(exports,"check",{enumerable:true,get:function(){return mysqlCore.check}});Object.defineProperty(exports,"customType",{enumerable:true,get:function(){return mysqlCore.customType}});Object.defineProperty(exports,"date",{enumerable:true,get:function(){return mysqlCore.date}});Object.defineProperty(exports,"datetime",{enumerable:true,get:function(){return mysqlCore.datetime}});Object.defineProperty(exports,"decimal",{enumerable:true,get:function(){return mysqlCore.decimal}});Object.defineProperty(exports,"double",{enumerable:true,get:function(){return mysqlCore.double}});Object.defineProperty(exports,"float",{enumerable:true,get:function(){return mysqlCore.float}});Object.defineProperty(exports,"foreignKey",{enumerable:true,get:function(){return mysqlCore.foreignKey}});Object.defineProperty(exports,"index",{enumerable:true,get:function(){return mysqlCore.index}});Object.defineProperty(exports,"int",{enumerable:true,get:function(){return mysqlCore.int}});Object.defineProperty(exports,"json",{enumerable:true,get:function(){return mysqlCore.json}});Object.defineProperty(exports,"longblob",{enumerable:true,get:function(){return mysqlCore.longblob}});Object.defineProperty(exports,"longtext",{enumerable:true,get:function(){return mysqlCore.longtext}});Object.defineProperty(exports,"mediumblob",{enumerable:true,get:function(){return mysqlCore.mediumblob}});Object.defineProperty(exports,"mediumint",{enumerable:true,get:function(){return mysqlCore.mediumint}});Object.defineProperty(exports,"mediumtext",{enumerable:true,get:function(){return mysqlCore.mediumtext}});Object.defineProperty(exports,"mysqlDatabase",{enumerable:true,get:function(){return mysqlCore.mysqlDatabase}});Object.defineProperty(exports,"mysqlEnum",{enumerable:true,get:function(){return mysqlCore.mysqlEnum}});Object.defineProperty(exports,"mysqlSchema",{enumerable:true,get:function(){return mysqlCore.mysqlSchema}});Object.defineProperty(exports,"mysqlTableCreator",{enumerable:true,get:function(){return mysqlCore.mysqlTableCreator}});Object.defineProperty(exports,"mysqlView",{enumerable:true,get:function(){return mysqlCore.mysqlView}});Object.defineProperty(exports,"primaryKey",{enumerable:true,get:function(){return mysqlCore.primaryKey}});Object.defineProperty(exports,"real",{enumerable:true,get:function(){return mysqlCore.real}});Object.defineProperty(exports,"serial",{enumerable:true,get:function(){return mysqlCore.serial}});Object.defineProperty(exports,"smallint",{enumerable:true,get:function(){return mysqlCore.smallint}});Object.defineProperty(exports,"text",{enumerable:true,get:function(){return mysqlCore.text}});Object.defineProperty(exports,"time",{enumerable:true,get:function(){return mysqlCore.time}});Object.defineProperty(exports,"timestamp",{enumerable:true,get:function(){return mysqlCore.timestamp}});Object.defineProperty(exports,"tinyblob",{enumerable:true,get:function(){return mysqlCore.tinyblob}});Object.defineProperty(exports,"tinyint",{enumerable:true,get:function(){return mysqlCore.tinyint}});Object.defineProperty(exports,"tinytext",{enumerable:true,get:function(){return mysqlCore.tinytext}});Object.defineProperty(exports,"unique",{enumerable:true,get:function(){return mysqlCore.unique}});Object.defineProperty(exports,"uniqueIndex",{enumerable:true,get:function(){return mysqlCore.uniqueIndex}});Object.defineProperty(exports,"varbinary",{enumerable:true,get:function(){return mysqlCore.varbinary}});Object.defineProperty(exports,"varchar",{enumerable:true,get:function(){return mysqlCore.varchar}});Object.defineProperty(exports,"year",{enumerable:true,get:function(){return mysqlCore.year}});exports.MySqlQuery=MySqlQuery;exports.TableColumns=TableColumns;exports.createConditions=createConditions;exports.default=drizzleMySql;exports.drizzleMySql=drizzleMySql;exports.mysqlTable=mysqlTable;