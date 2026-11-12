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

  /********************************************************************************************************************
   * selectTest
   * ******************************************************************************************************************/
  async selectTest() {
    console.log(await this.select(['id', 'name', 'email']));

    console.log(await this.select({ id_2: 'id', name_2: 'name', email_2: 'email' }));

    console.log(await this.select({ min_id: this.min('id'), max_id: this.max('id') }));

    console.log(await this.select().orderBy(this.desc('id')));

    console.log(await this.select().orderBy(this.asc('id')));

    const td1 = mysql.a.adminUser('td1');
    const td2 = mysql.a.adminUser('td2');
    console.log(
      await this.select(td1, ['id'])
        .crossJoin(td2)
        .orderBy((q) => q.desc('id'))
        .groupBy((t) => [t.id])
    );

    console.log(
      await this.select(['id'])
        .having(this.eq('id', 1))
        .orderBy((q) => q.desc('id'))
        .groupBy((t) => [t.id])
    );

    console.log(
      await this.select(['id'])
        .orderBy((q) => q.desc('id'))
        .groupBy((t) => [t.id])
        .orderBy((q) => q.desc('id'))
    );

    console.log(
      await this.select(['id'])
        .groupBy((t) => [t.id])
        .orderBy((q) => q.desc('id'))
    );

    console.log(
      await this.select(['id'])
        .$dynamic()
        .orderBy((q) => q.desc('id'))
        .groupBy((t) => [t.id])
    );

    console.log(
      await this.select(['id'])
        .union(this.select(['id']))
        .orderBy((q) => q.desc('id'))
    );

    console.log(
      await this.select(['id'])
        .unionAll(this.select(['id']))
        .orderBy((q) => q.desc('id'))
    );

    console.log(
      await this.select(['id'])
        .intersect(this.select(['id']))
        .orderBy((q) => q.desc('id'))
    );

    console.log(
      await this.select(['id'])
        .except(this.select(['id']))
        .orderBy((q) => q.desc('id'))
    );

    console.log(
      await this.select(['id'])
        .groupBy((t) => [t.id])
        .orderBy((q) => q.desc('id'))
    );

    console.log(await this.select(['id']).orderBy((q) => q.desc('id')));

    console.log(await this.select(['id']).orderBy((q) => q.asc('id')));

    console.log(await this.select(['id']).orderBy((q) => mysql.asc(q.t.id)));
  }

  /********************************************************************************************************************
   * selectColumnsTest
   * ******************************************************************************************************************/
  async selectColumnsTest() {
    await this.select([this.columns('id', 'name', 'email'), { min_id: this.min('id'), max_id: this.max('id') }]);
  }

  /********************************************************************************************************************
   * aliasSelectTest
   * ******************************************************************************************************************/
  async aliasSelectTest() {
    const au = mysql.a.adminUser('au');

    console.log(await this.select(au, { id: au.id, name: au.name }));

    console.log(await this.select(au, ['id', 'name']));

    console.log(await this.select(au, ['id', 'name as as_name', 'email AS as_email', 'tel As as_tel']));
  }

  /********************************************************************************************************************
   * subQueryTest
   * ******************************************************************************************************************/
  async subQueryTest() {
    console.log('::::: TestData::subQueryTest() :::::');

    {
      const builder = this.select(['id']).orderBy(this.desc('id')).limit(1);

      console.log(await this.select({ id: 'id', sub_query_value: builder }).where(this.eq('id', 2)));

      console.log(await this.select().where(this.eq('id', builder)));

      const j = builder.as('j');
      console.log(
        await this.select([this.columns('name'), mysql.columns(j, 'id')]).innerJoin(j, mysql.eq(j.id, this.t.id))
      );
      console.log(await this.select().innerJoin(j, (q) => q.eq({ id: q.t.id })));

      const ud = mysql.a.adminUser('ud');
      const ud2 = mysql.a.adminUser('ud2');
      console.log(await this.select().where((q) => q.eq({ id: 1 })));
      console.log(
        await this.select([
          this.columns('id', 'name'),
          mysql.columns(ud, 'id as ud_id'),
          mysql.columns(ud2, 'id as ud2_id'),
        ])
          .innerJoin(ud, mysql.eq(ud.id, this.t.id))
          .innerJoin(ud2, mysql.eq(ud2.id, this.t.id))
          .where((q) => q.eq({ id: 1 }))
          .orderBy((q) => q.desc('name'))
      );
      console.log(await this.select().innerJoin(ud, (q) => q.eq({ id: q.t.id })));
    }

    {
      const builder = this.select(['id', 'name']).orderBy(this.desc('id')).limit(1);
      const j = builder.as('j');
      mysql.columns(j, 'id', 'name');
    }

    {
      const ac2 = mysql.a.adminUser('ac2');
      const appInfoBuilder = this.select({
        app_info: mysql.sqlString(''),
      }).where((q) =>
        q.and({
          eq: { id: ac2.id },
        })
      );
      this.select(ac2, ['id', 'name', { app_info: appInfoBuilder }]);
    }
  }

  /********************************************************************************************************************
   * selectDistinctTest
   * ******************************************************************************************************************/
  async selectDistinctTest() {
    console.log(await this.selectDistinct(['name']));
  }

  /********************************************************************************************************************
   * findTest
   * ******************************************************************************************************************/
  async findTest() {
    console.log(await this.find(['id', 'name', 'email']));

    console.log(await this.find(['id', 'name', 'email'], this.eq({ name: 'name' })));

    console.log(await this.find({ id_2: 'id', name_2: 'name', email_2: 'email' }));

    console.log(await this.find({ id_2: 'id', name_2: 'name', email_2: 'email' }, this.eq({ name: 'name' })));

    console.log(await this.find({ id_2: 'id', name_2: 'name', email_2: 'email' }, (q) => q.eq({ id: 1 })));

    console.log(await this.find({ min_id: this.min('id'), max_id: this.max('id') }));

    console.log(await this.findByPrimaryKey(['id', 'name', 'email'], 1));

    console.log(await this.findByPrimaryKey({ id_2: 'id' }, 1));

    console.log(await this.findByPrimaryKey({ min_id: this.min('id'), max_id: this.max('id') }, 1));
  }

  /********************************************************************************************************************
   * conditionTest
   * ******************************************************************************************************************/
  async conditionTest() {
    this.eq({ id: 1, name: 'name' });
    this.ne({ id: 1, name: 'name' });
    this.and({
      eq: { id: 1, name: 'name' },
      like: { name: '%name%' },
    });

    this.orEq({ id: 1, name: 'name' });
    this.and({
      eq: { email: 'email' },
      orEq: { id: 1, name: 'name' },
    });

    this.select().where((q) =>
      q.and(
        q.and({
          eq: { id: 1 },
        }),
        q.or({
          eq: { id: 1, name: 'name' },
        })
      )
    );

    const oneRowBuilder = this.select(['id'])
      .where((q) => q.lt({ id: 1 }))
      .limit(1);
    const multiRowBuilder = this.select(['id']).where((q) => q.lt({ id: 10 }));
    this.and({
      inArray: { id: multiRowBuilder },
      notInArray: { id: multiRowBuilder },
      between: { id: [oneRowBuilder, oneRowBuilder] },
    });
  }

  /********************************************************************************************************************
   * selectConditionTest
   * ******************************************************************************************************************/
  async selectConditionTest() {
    await this.select().where(this.eq({ id: 1 }));
    await this.select().where(
      this.and({
        eq: { id: 1 },
        like: { name: '%name%' },
      })
    );

    console.log(await this.select(['id']).where((q) => q.eq({ name: 'name' })));
    console.log(await this.select(['id']).where((q) => mysql.eq(q.t.name, 'name')));

    const au = mysql.a.adminUser('au');
    console.log(await this.select(au, ['id']).where((q) => q.eq({ name: 'name' })));
    console.log(await this.select(au, ['id']).where((q) => mysql.eq(q.t.name, 'name')));
  }

  /********************************************************************************************************************
   * orderByTest
   * ******************************************************************************************************************/
  async orderByTest() {
    await this.select().orderBy(this.desc('id'));
    await this.select().orderBy(this.asc('id'));
    await this.select(['id']).orderBy((q) => q.desc('id'));
    await this.select(['id']).orderBy((q) => q.asc('id'));
    await this.select(['id']).orderBy((q) => mysql.desc(q.t.id));

    const au = mysql.a.adminUser('au');
    await this.select(au, ['id']).orderBy((q) => q.desc('id'));
    await this.select(au, ['id']).orderBy((q) => mysql.asc(q.t.id));
  }

  async joinTest() {
    const au = mysql.alias(this.t, 'au');
    const au2 = mysql.alias(this.t, 'au2');
    await this.select().innerJoin(au, (q) => q.eq({ id: q.t.id }));
    await this.select()
      .innerJoin(au, mysql.eq(au.id, this.t.id))
      .innerJoin(au2, mysql.eq(au2.id, this.t.id))
      .where((q) => q.eq({ id: 1 }))
      .orderBy((q) => q.desc('name'));

    const recent = this.select(['id']).limit(1).orderBy(this.desc('id')).as('recent');
    await this.select().innerJoin(recent, (q) => q.eq({ id: q.t.id }));
  }

  async addTest() {
    await this.add({
      name: 'name',
      email: 'email',
      password: 'password',
      tel: 'tel',
    });
  }

  /********************************************************************************************************************
   * addValuesTest
   * ******************************************************************************************************************/
  async addValuesTest() {
    const addValues = this.addValues({
      name: 'name',
      email: 'email',
      password: 'password',
      tel: 'tel',
    });

    await this.add(addValues);
  }

  /********************************************************************************************************************
   * addBySelectTest
   * ******************************************************************************************************************/
  async addBySelectTest() {
    console.log('::::: TestData::addBySelectTest() :::::');

    const builder = this.select({
      name: 'name',
      email: 'email',
      is_lock: this.t.is_lock,
    }).where(this.eq({ id: 2 }));
    console.log(await this.add(builder));
  }

  /********************************************************************************************************************
   * editTest
   * ******************************************************************************************************************/
  async editTest() {
    await this.edit({ is_lock: true }, this.eq({ id: 1 }));
  }

  /********************************************************************************************************************
   * editByPrimaryKeyTest
   * ******************************************************************************************************************/
  async editByPrimaryKeyTest() {
    await this.editByPrimaryKey({ is_lock: true }, 1);
  }

  /********************************************************************************************************************
   * editValuesTest
   * ******************************************************************************************************************/
  async editValuesTest() {
    const editValues = this.editValues({
      is_lock: true,
    });
    await this.editByPrimaryKey(editValues, 1);
  }

  /********************************************************************************************************************
   * removeTest
   * ******************************************************************************************************************/
  async removeTest() {
    await this.remove(this.eq({ id: 1 }));
  }

  /********************************************************************************************************************
   * removeByPrimaryKeyTest
   * ******************************************************************************************************************/
  async removeByPrimaryKeyTest() {
    await this.removeByPrimaryKey(1);
  }

  /********************************************************************************************************************
   * paginateTest
   * ******************************************************************************************************************/
  async paginateTest() {
    await mysql.paginate(this.select(), 1, 10);
  }
}
