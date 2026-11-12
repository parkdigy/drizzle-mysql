import { MySqlQuery } from './MySqlQuery';
import db from '../mysql';

export class TestData extends MySqlQuery<'testData'> {
  constructor() {
    super('testData');
  }

  /********************************************************************************************************************
   * selectTest
   * ******************************************************************************************************************/
  async selectTest() {
    console.log('::::: TestData::selectTest() :::::');

    console.log(await this.select(['id', 'name', 'email']));

    console.log(await this.select({ id_2: 'id', name_2: 'name', email_2: 'email' }));

    console.log(await this.select({ min_id: this.min('id'), max_id: this.max('id') }));

    console.log(await this.select((q) => q.columns('id', 'name')));

    console.log(
      await this.select((q) => [
        q.columns('id', 'name'),
        {
          email: q.t.email,
        },
      ])
    );

    console.log(await this.select().orderBy(this.desc('id')));

    console.log(await this.select().orderBy(this.asc('id')));

    console.log(await this.select(['id']).orderBy((q) => q.desc('id', 'name')));

    const td1 = this.alias('td1');
    const td2 = this.alias('td2');
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

    const td = this.alias('td');
    this.select(td).orderBy(db.asc(td.id), db.asc(td.name), db.desc(td.email));

    this.select(td).orderBy(db.asc(td.id, td.name), db.desc(td.email, td.is_lock));
    this.select(td).orderBy(db.asc(td, 'id', 'name'), db.desc(td, 'email', 'is_lock'));
    this.select().orderBy((q) => q.asc('id', 'name'));
    this.select().orderBy((q) => [q.asc('id', 'name'), q.desc('email', 'is_lock')]);

    console.log(await this.select(['id']).orderBy((q) => q.asc('id')));

    console.log(await this.select(['id']).orderBy((q) => [q.asc('name'), q.asc('id')]));

    console.log(await this.select(['id']).orderBy((q) => db.desc(q.t.id)));

    this.select().where((q) =>
      q.and(q.and({ eq: { is_lock: true }, gt: { id: 0 } }), q.or({ isNull: 'email', eq: { name: 'Ada' } }))
    );
  }

  /********************************************************************************************************************
   * selectColumnsTest
   * ******************************************************************************************************************/
  async selectColumnsTest() {
    console.log('::::: TestData::selectColumnsTest() :::::');

    console.log(await this.select([this.columns('id', 'name', 'email')]));

    console.log(await this.select({ min_id: this.min('id'), max_id: this.max('id') }));
  }

  /********************************************************************************************************************
   * aliasSelectTest
   * ******************************************************************************************************************/
  async aliasSelectTest() {
    console.log('::::: TestData::aliasSelectTest() :::::');

    const td = db.a.testData('td');

    console.log(await this.select(td, { id: td.id, name: td.name }));

    console.log(await this.select(td, ['id', 'name']));

    console.log(await this.select(td, ['id', 'name as as_name', 'email AS as_email']));

    console.log(await this.select(td).orderBy(this.desc(td, 'id')));

    console.log(await this.select(td).orderBy(this.asc(td, 'id')));

    console.log(await this.select(td, ['id']).orderBy((q) => q.desc('id')));

    console.log(await this.select(td, ['id']).orderBy((q) => db.asc(q.t.id)));
  }

  /********************************************************************************************************************
   * subQueryTest
   * ******************************************************************************************************************/
  async subQueryTest() {
    console.log('::::: TestData::subQueryTest() :::::');

    {
      const builder = this.select(['id']).orderBy(this.desc('id'));

      console.log(await this.select({ id: 'id', sub_query_value: builder }).where(this.eq('id', 2)));

      console.log(await this.select().where(this.eq('id', builder)));

      const j = builder.as('j');
      console.log(await this.select([this.columns('name'), db.columns(j, 'id')]).innerJoin(j, db.eq(j.id, this.t.id)));
      console.log(await this.select().innerJoin(j, (q) => q.eq({ id: q.t.id })));

      const td = db.a.testData('td');
      const td2 = db.a.testData('td2');
      console.log(await this.select().where((q) => q.eq({ id: 1 })));
      console.log(
        await this.select([this.columns('id', 'name'), db.columns(td, 'id as td_id'), db.columns(td2, 'id as td2_id')])
          .innerJoin(td, db.eq(td.id, this.t.id))
          .innerJoin(td2, db.eq(td2.id, this.t.id))
          .where((q) => q.eq({ id: 2 }))
          .orderBy((q) => q.desc('name'))
      );
      console.log(await this.select().innerJoin(td, (q) => q.eq({ id: q.t.id })));
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
      console.log(await this.select(ac2, ['id', 'name', { app_info: appInfoBuilder }]));
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
    console.log('::::: TestData::findTest() :::::');

    console.log(await this.find(['id', 'name', 'email']));

    console.log(await this.find(['id', 'name', 'email'], this.eq({ id: 2 })));

    console.log(await this.find({ id_2: 'id', name_2: 'name', email_2: 'email' }));

    console.log(await this.find({ id_2: 'id', name_2: 'name', email_2: 'email' }, this.eq({ id: 2 })));

    console.log(await this.find({ id_2: 'id', name_2: 'name', email_2: 'email' }, (q) => q.eq({ id: 2 })));

    console.log(await this.find({ min_id: this.min('id'), max_id: this.max('id') }));

    console.log(await this.findByPrimaryKey(['id', 'name', 'email'], 2));

    console.log(await this.findByPrimaryKey({ id_2: 'id' }, 2));

    console.log(await this.findByPrimaryKey({ min_id: this.min('id'), max_id: this.max('id') }, 2));
  }

  /********************************************************************************************************************
   * conditionTest
   * ******************************************************************************************************************/
  async conditionTest() {
    console.log('::::: TestData::conditionTest() :::::');

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
    console.log('::::: TestData::selectConditionTest() :::::');

    console.log(await this.select().where(this.eq({ id: 1 })));

    console.log(
      await this.select().where(
        this.and({
          eq: { id: 1 },
          like: { name: '%name%' },
        })
      )
    );

    console.log(await this.select(['id']).where((q) => q.eq({ name: 'name' })));
    console.log(await this.select(['id']).where((q) => db.eq(q.t.name, 'name')));

    const td = db.a.testData('td');
    console.log(await this.select(td, ['id']).where((q) => q.eq({ name: 'name' })));
    console.log(await this.select(td, ['id']).where((q) => db.eq(q.t.name, 'name')));
  }

  /********************************************************************************************************************
   * addTest
   * ******************************************************************************************************************/
  async addTest() {
    console.log('::::: TestData::addTest() :::::');

    const dt = new Date().toISOString();
    console.log(
      await this.add({
        name: `name ${dt}`,
        email: `email${dt}@test.com`,
      })
    );
  }

  /********************************************************************************************************************
   * addValuesTest
   * ******************************************************************************************************************/
  async addValuesTest() {
    console.log('::::: TestData::addValuesTest() :::::');

    const dt = new Date().toISOString();
    const addValues = this.addValues({
      name: `name ${dt}`,
      email: `email${dt}@test.com`,
    });
    console.log(await this.add(addValues));
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
    console.log('::::: TestData::editTest() :::::');

    console.log(await this.edit({ is_lock: true }, this.eq({ id: 1 })));

    console.log(await this.edit({ is_lock: true }, (q) => q.eq({ id: 1 })));
  }

  /********************************************************************************************************************
   * editByPrimaryKeyTest
   * ******************************************************************************************************************/
  async editByPrimaryKeyTest() {
    console.log('::::: TestData::editByPrimaryKeyTest() :::::');

    console.log(await this.editByPrimaryKey({ is_lock: true }, 1));
  }

  /********************************************************************************************************************
   * editValuesTest
   * ******************************************************************************************************************/
  async editValuesTest() {
    console.log('::::: TestData::editValuesTest() :::::');

    const editValues = this.editValues({
      is_lock: true,
    });
    console.log(await this.editByPrimaryKey(editValues, 1));
  }

  /********************************************************************************************************************
   * removeTest
   * ******************************************************************************************************************/
  async removeTest() {
    console.log('::::: TestData::removeTest() :::::');

    console.log(await this.remove(this.eq({ id: 1 })));
  }

  /********************************************************************************************************************
   * removeByPrimaryKeyTest
   * ******************************************************************************************************************/
  async removeByPrimaryKeyTest() {
    console.log('::::: TestData::removeByPrimaryKeyTest() :::::');

    console.log(await this.removeByPrimaryKey(1));
  }

  /********************************************************************************************************************
   * paginateTest
   * ******************************************************************************************************************/
  async paginateTest() {
    console.log('::::: TestData::paginateTest() :::::');

    const builder = this.select().orderBy(this.desc('id'));
    console.log(await db.paginate(builder, 1, 2));
    console.log(await db.paginate(builder, 2, 2));
  }

  /********************************************************************************************************************
   * otherTest
   * ******************************************************************************************************************/
  async otherTest() {
    //
  }
}

export const testData = new TestData();
