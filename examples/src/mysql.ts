import { drizzleMySql } from '../../src';
import 'dotenv/config';
import * as schema from './schema';

export const mysql = drizzleMySql({
  url: process.env.DB_URL!,
  host: process.env.DB_HOST!,
  port: Number(process.env.DB_PORT!),
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_DATABASE,
  timezone: 'local',
  schema,
});

export default mysql;
