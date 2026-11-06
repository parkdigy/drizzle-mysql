import { boolean, datetime, drizzleMySql, int, MySqlQuery as BaseQuery, mysqlTable, varchar } from '../../src';

const adminUser = mysqlTable('admin_user', {
  id: int({ unsigned: true }).autoincrement().primaryKey(),
  name: varchar({ length: 50 }).notNull(),
  email: varchar({ length: 50 }).notNull(),
  password: varchar({ length: 255 }).notNull(),
  tel: varchar({ length: 20 }).notNull(),
  must_password_change: boolean().default(true).notNull().insertBlocked(),
  is_lock: boolean().default(false).notNull().insertBlocked(),
  login_fail_count: int().default(0).notNull().insertBlocked(),
  remember_token: varchar({ length: 100 }).insertBlocked(),
  create_date: datetime({ mode: 'string' }).notNull().createdAt(),
  update_date: datetime({ mode: 'string' }).notNull().updatedAt(),
});

const schema = { adminUser };

const mysql = drizzleMySql({
  url: '',
  schema,
  getTimestamp: () => new Date().toISOString().slice(0, 19).replace('T', ' '),
});

abstract class MySqlQuery<K extends keyof typeof schema> extends BaseQuery<(typeof schema)[K]> {
  constructor(table: K) {
    super(schema[table], mysql.current);
  }
}

export class AdminUser extends MySqlQuery<'adminUser'> {
  constructor() {
    super('adminUser');
  }

  async selectTest() {
    await this.select(['id', 'name', 'email']);
  }

  async selectColumnsTest() {
    await this.select(this.columns('id', 'name', 'email'));
  }

  async aliasSelectTest() {
    const au = mysql.a.adminUser('au');
    await this.select(au);
    await this.select(au, { id: au.id, name: au.name });
    await this.select(au, ['id', 'name']);
    await this.select(au, ['id', 'name as as_name', 'email AS as_email', 'tel As as_tel']);
  }

  async conditionTest() {
    this.eq({ id: 1, name: 'name' });
    this.ne({ id: 1, name: 'name' });
    this.and({
      eq: { id: 1 },
      like: { name: '%name%' },
    });
  }

  async selectConditionTest() {
    await this.select().where(this.eq({ id: 1 }));
    await this.select().where(
      this.and({
        eq: { id: 1 },
        like: { name: '%name%' },
      })
    );
  }

  async addTest() {
    const insertValues = this.insertValues({
      name: 'name',
      email: 'email',
      password: 'password',
      tel: 'tel',
    });

    await this.add(insertValues);
  }

  async editTest() {
    const editValues = this.updateValues({
      is_lock: true,
    });

    await this.editByPrimaryKey(editValues, 1);
  }
}
