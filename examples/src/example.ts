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
  create_date: datetime().notNull().createdAt(),
  update_date: datetime().notNull().updatedAt(),
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
    await this.select({ id_2: 'id', name_2: 'name', email_2: 'email' });
    await this.select({ min_id: this.min('id'), max_id: this.max('id') });
  }

  async selectColumnsTest() {
    await this.select([this.columns('id', 'name', 'email'), { min_id: this.min('id'), max_id: this.max('id') }]);
  }

  async aliasSelectTest() {
    const au = mysql.a.adminUser('au');
    await this.select(au);
    await this.select(au, { id: au.id, name: au.name });
    await this.select(au, ['id', 'name']);
    await this.select(au, ['id', 'name as as_name', 'email AS as_email', 'tel As as_tel']);
  }

  async findTest() {
    await this.find(['id', 'name', 'email']);
    await this.find(['id', 'name', 'email'], this.eq({ name: 'name' }));
    await this.find({ id_2: 'id', name_2: 'name', email_2: 'email' });
    await this.find({ id_2: 'id', name_2: 'name', email_2: 'email' }, this.eq({ name: 'name' }));
    await this.find({ min_id: this.min('id'), max_id: this.max('id') });
    await this.findByPrimaryKey(['id', 'name', 'email'], 1);
    await this.findByPrimaryKey({ id_2: 'id' }, 1);
    await this.findByPrimaryKey({ min_id: this.min('id'), max_id: this.max('id') }, 1);
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

  async orderByTest() {
    await this.select().orderBy(this.desc('id'));
    await this.select().orderBy(this.asc('id'));
  }

  async addTest() {
    await this.add({
      name: 'name',
      email: 'email',
      password: 'password',
      tel: 'tel',
    });
  }

  async addValuesTest() {
    const addValues = this.addValues({
      name: 'name',
      email: 'email',
      password: 'password',
      tel: 'tel',
    });

    await this.add(addValues);
  }

  async editTest() {
    await this.edit({ is_lock: true }, this.eq({ id: 1 }));
  }

  async editByPrimaryKeyTest() {
    await this.editByPrimaryKey({ is_lock: true }, 1);
  }

  async editValuesTest() {
    const editValues = this.editValues({
      is_lock: true,
    });
    await this.editByPrimaryKey(editValues, 1);
  }

  async removeTest() {
    await this.remove(this.eq({ id: 1 }));
  }

  async removeByPrimaryKeyTest() {
    await this.removeByPrimaryKey(1);
  }

  async paginateTest() {
    await mysql.paginate(this.select(), 1, 10);
  }
}
