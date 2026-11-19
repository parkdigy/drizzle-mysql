import { MySqlQuery } from './MySqlQuery';
import db from '../mysql';

const ll = console.log;

export class TestData extends MySqlQuery<'testData'> {
  constructor() {
    super('testData');
  }

  /********************************************************************************************************************
   * selectTest
   * ******************************************************************************************************************/
  async selectTest() {
    ll('::::: TestData::selectTest() :::::');

    ll(await this.select(['id', 'name', 'email']));

    ll(await this.select({ id_2: 'id', name_2: 'name', email_2: 'email' }));

    ll(await this.select({ min_id: this.min('id'), max_id: this.max('id') }));

    ll(await this.select((q) => q.columns('id', 'name')));

    ll(
      await this.select((q) => [
        q.columns('id', 'name'),
        {
          email: q.t.email,
        },
      ])
    );

    ll(await this.select().orderBy(this.desc('id')));

    const isOrderByName = false;
    ll(
      await this.select().orderBy(
        this.desc('id'),
        isOrderByName && this.asc('name'),
        isOrderByName ? this.asc('name') : undefined
      )
    );
    ll(
      await this.select().orderBy((q) => [
        q.desc('id'),
        isOrderByName && q.asc('name'),
        isOrderByName ? q.asc('name') : undefined,
      ])
    );

    ll(await this.select().orderBy(this.asc('id')));

    ll(await this.select(['id']).orderBy((q) => q.desc('id', 'name')));

    const td1 = this.alias('td1');
    const td2 = this.alias('td2');
    ll(
      await this.select(td1, ['id'])
        .crossJoin(td2)
        .orderBy((q) => q.desc('id'))
        .groupBy((t) => [t.id])
    );

    ll(
      await this.select(['id'])
        .having(this.eq('id', 1))
        .orderBy((q) => q.desc('id'))
        .groupBy((t) => [t.id])
    );

    ll(
      await this.select(['id'])
        .groupBy((t) => [t.id])
        .orderBy((q) => q.desc('id'))
    );

    ll(
      await this.select(['id'])
        .$dynamic()
        .orderBy((q) => q.desc('id'))
        .groupBy((t) => [t.id])
    );

    ll(
      await this.select(['id'])
        .union(this.select(['id']))
        .orderBy((q) => q.desc('id'))
    );

    ll(
      await this.select(['id'])
        .unionAll(this.select(['id']))
        .orderBy((q) => q.desc('id'))
    );

    ll(
      await this.select(['id'])
        .intersect(this.select(['id']))
        .orderBy((q) => q.desc('id'))
    );

    ll(
      await this.select(['id'])
        .except(this.select(['id']))
        .orderBy((q) => q.desc('id'))
    );

    ll(
      await this.select(['id'])
        .groupBy((t) => [t.id])
        .orderBy((q) => q.desc('id'))
    );

    const td = this.alias('td');
    this.select(td).orderBy(db.asc(td.id), db.asc(td.name), db.desc(td.email));

    this.select(td).orderBy(db.asc(td.id, td.name), db.desc(td.email, td.is_lock));
    this.select(td).orderBy(db.asc(td, 'id', 'name'), db.desc(td, 'email', 'is_lock'));
    this.select().orderBy((q) => q.asc('id', 'name'));
    this.select().orderBy((q) => [q.asc('id', 'name'), q.desc('email', 'is_lock')]);

    ll(await this.select(['id']).orderBy((q) => q.asc('id')));

    ll(await this.select(['id']).orderBy((q) => [q.asc('name'), q.asc('id')]));

    ll(await this.select(['id']).orderBy((q) => db.desc(q.t.id)));

    this.select().where((q) =>
      q.and(q.and({ eq: { is_lock: true }, gt: { id: 0 } }), q.or({ isNull: 'email', eq: { name: 'Ada' } }))
    );
  }

  /********************************************************************************************************************
   * selectColumnsTest
   * ******************************************************************************************************************/
  async selectColumnsTest() {
    ll('::::: TestData::selectColumnsTest() :::::');

    ll(await this.select([this.columns('id', 'name', 'email')]));

    ll(await this.select({ min_id: this.min('id'), max_id: this.max('id') }));
  }

  /********************************************************************************************************************
   * aliasSelectTest
   * ******************************************************************************************************************/
  async aliasSelectTest() {
    ll('::::: TestData::aliasSelectTest() :::::');

    const td = db.a.testData('td');

    ll(await this.select(td, { id: td.id, name: td.name }));

    ll(await this.select(td, ['id', 'name']));

    ll(await this.select(td, ['id', 'name as as_name', 'email AS as_email']));

    ll(await this.select(td).orderBy(this.desc(td, 'id')));

    ll(await this.select(td).orderBy(this.asc(td, 'id')));

    ll(await this.select(td, ['id']).orderBy((q) => q.desc('id')));

    ll(await this.select(td, ['id']).orderBy((q) => db.asc(q.t.id)));
  }

  /********************************************************************************************************************
   * subQueryTest
   * ******************************************************************************************************************/
  async subQueryTest() {
    ll('::::: TestData::subQueryTest() :::::');

    {
      const builder = this.select(['id']).orderBy(this.desc('id'));

      ll(await this.select({ id: 'id', sub_query_value: builder }).where(this.eq('id', 2)));

      ll(await this.select().where(this.eq('id', builder)));

      const j = builder.as('j');
      ll(await this.select([this.columns('name'), db.columns(j, 'id')]).innerJoin(j, db.eq(j.id, this.t.id)));
      ll(await this.select().innerJoin(j, (q) => q.eq({ id: q.t.id })));

      const td = db.a.testData('td');
      const td2 = db.a.testData('td2');
      ll(await this.select().where((q) => q.eq({ id: 1 })));
      ll(
        await this.select([this.columns('id', 'name'), db.columns(td, 'id as td_id'), db.columns(td2, 'id as td2_id')])
          .innerJoin(td, db.eq(td.id, this.t.id))
          .innerJoin(td2, db.eq(td2.id, this.t.id))
          .where((q) => q.eq({ id: 2 }))
          .orderBy((q) => q.desc('name'))
      );
      ll(await this.select().innerJoin(td, (q) => q.eq({ id: q.t.id })));
    }

    {
      const builder = this.select(['id', 'name']).orderBy(this.desc('id')).limit(1);
      const j = builder.as('j');
      db.columns(j, 'id', 'name');
    }

    {
      const ac2 = db.a.testData('ac2');
      const appInfoBuilder = this.select({
        app_info: db.sqlString(''),
      }).where((q) =>
        q.and({
          eq: { id: ac2.id },
        })
      );
      ll(await this.select(ac2, ['id', 'name', { app_info: appInfoBuilder }]));
    }
  }

  /********************************************************************************************************************
   * selectDistinctTest
   * ******************************************************************************************************************/
  async selectDistinctTest() {
    ll(await this.selectDistinct(['name']));
  }

  /********************************************************************************************************************
   * findTest
   * ******************************************************************************************************************/
  async findTest() {
    ll('::::: TestData::findTest() :::::');

    ll(await this.find(['id', 'name', 'email']));

    ll(await this.find(['id', 'name', 'email'], this.eq({ id: 2 })));

    ll(await this.find({ id_2: 'id', name_2: 'name', email_2: 'email' }));

    ll(await this.find({ id_2: 'id', name_2: 'name', email_2: 'email' }, this.eq({ id: 2 })));

    ll(await this.find({ id_2: 'id', name_2: 'name', email_2: 'email' }, (q) => q.eq({ id: 2 })));

    ll(await this.find({ min_id: this.min('id'), max_id: this.max('id') }));

    ll(await this.findByPrimaryKey(['id', 'name', 'email'], 2));

    ll(await this.findByPrimaryKey({ id_2: 'id' }, 2));

    ll(await this.findByPrimaryKey({ min_id: this.min('id'), max_id: this.max('id') }, 2));
  }

  /********************************************************************************************************************
   * conditionTest
   * ******************************************************************************************************************/
  async conditionTest() {
    ll('::::: TestData::conditionTest() :::::');

    this.eq({ id: 1, name: 'name' });

    this.ne({ id: 1, name: 'name' });

    this.and({
      eq: { id: 1, name: 'name' },
      like: { name: '%name%' },
    });

    this.select().where((q) =>
      q.and(
        q.and({
          eq: { id: 1 },
        }),
        q.or({ eq: { id: 1, name: 'name' } })
      )
    );

    this.and({
      eq: { id: 1 },
      or: {
        eq: { name: 'name' },
        ne: { name: 'name2' },
      },
    });

    this.select().where((q) =>
      q.and({
        eq: { id: 1 },
        or: {
          eq: { name: 'name' },
          ne: { name: 'name2' },
        },
      })
    );

    this.or({
      eq: { id: 1 },
      and: {
        eq: { name: 'name' },
        ne: { name: 'name2' },
      },
    });

    this.select().where((q) =>
      q.or({
        eq: { id: 1 },
        and: {
          eq: { name: 'name' },
          ne: { name: 'name2' },
        },
      })
    );

    this.orGt({ id: 1, name: 'name' });
    this.orInArray({ id: [1, 2], name: ['name'] });
    this.orBetween({ id: [1, 10], name: ['a', 'z'] });
    this.orIsNull(['name', 'email']);

    const td = db.a.testData('td');
    db.orLike(td, { name: '%name%', email: '%example.com' });

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
    ll('::::: TestData::selectConditionTest() :::::');

    ll(await this.select().where(this.eq({ id: 1 })));

    ll(
      await this.select().where(
        this.and({
          eq: { id: 1 },
          like: { name: '%name%' },
        })
      )
    );

    ll(await this.select(['id']).where((q) => q.eq({ name: 'name' })));
    ll(await this.select(['id']).where((q) => db.eq(q.t.name, 'name')));

    const td = db.a.testData('td');
    ll(await this.select(td, ['id']).where((q) => q.eq({ name: 'name' })));
    ll(await this.select(td, ['id']).where((q) => db.eq(q.t.name, 'name')));
  }

  /********************************************************************************************************************
   * addTest
   * ******************************************************************************************************************/
  async addTest() {
    ll('::::: TestData::addTest() :::::');

    const dt = new Date().toISOString();
    ll(
      await this.add({
        name: `name ${dt}`,
        email: `email${dt}@test.com`,
      })
    );
  }

  /********************************************************************************************************************
   * addDataTest
   * ******************************************************************************************************************/
  async addDataTest() {
    ll('::::: TestData::addDataTest() :::::');

    const dt = new Date().toISOString();
    const addData = this.addData({
      name: `name ${dt}`,
      email: `email${dt}@test.com`,
    });
    ll(await this.add(addData));
  }

  /********************************************************************************************************************
   * addBySelectTest
   * ******************************************************************************************************************/
  async addBySelectTest() {
    ll('::::: TestData::addBySelectTest() :::::');

    const builder = this.select({
      name: 'name',
      email: 'email',
      is_lock: this.t.is_lock,
    }).where(this.eq({ id: 2 }));
    ll(await this.add(builder));
  }

  /********************************************************************************************************************
   * editTest
   * ******************************************************************************************************************/
  async editTest() {
    ll('::::: TestData::editTest() :::::');

    ll(await this.edit({ is_lock: true }, this.eq({ id: 1 })));

    ll(await this.edit({ is_lock: true }, (q) => q.eq({ id: 1 })));
  }

  /********************************************************************************************************************
   * editByPrimaryKeyTest
   * ******************************************************************************************************************/
  async editByPrimaryKeyTest() {
    ll('::::: TestData::editByPrimaryKeyTest() :::::');

    ll(await this.editByPrimaryKey({ is_lock: true }, 1));
  }

  /********************************************************************************************************************
   * editDataTest
   * ******************************************************************************************************************/
  async editDataTest() {
    ll('::::: TestData::editDataTest() :::::');

    const editData = this.editData({
      is_lock: true,
    });
    ll(await this.editByPrimaryKey(editData, 1));
  }

  /********************************************************************************************************************
   * removeTest
   * ******************************************************************************************************************/
  async removeTest() {
    ll('::::: TestData::removeTest() :::::');

    ll(await this.remove(this.eq({ id: 1 })));
  }

  /********************************************************************************************************************
   * removeByPrimaryKeyTest
   * ******************************************************************************************************************/
  async removeByPrimaryKeyTest() {
    ll('::::: TestData::removeByPrimaryKeyTest() :::::');

    ll(await this.removeByPrimaryKey(1));
  }

  /********************************************************************************************************************
   * paginateTest
   * ******************************************************************************************************************/
  async paginateTest() {
    ll('::::: TestData::paginateTest() :::::');

    const builder = this.select().orderBy(this.desc('id'));
    ll(await db.paginate(builder, 1, 2));
    ll(await db.paginate(builder, 2, 2));
  }

  /********************************************************************************************************************
   * otherTest
   * ******************************************************************************************************************/
  async otherTest() {
    ll('::::: TestData::otherTest() :::::');
  }
}

export const testData = new TestData();
