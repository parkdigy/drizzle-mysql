import { MySqlQuery as BaseQuery } from '../../../src';
import mysql from './../mysql';
import * as schema from '../schema';

export abstract class MySqlQuery<K extends keyof typeof schema> extends BaseQuery<(typeof schema)[K]> {
  constructor(table: K) {
    super(schema[table], mysql.current);
  }
}
