const { setup, teardown } = require('./helpers');
const { assertFails, assertSucceeds } = require('@firebase/testing');

const mockUser = {
  uid: 'jeffd23'
}

const mockData = {
  'trips/one': {
    from: 'toulouse',
    to: 'marseille'
  }
};


describe('Database rules', () => {
  let db;
  let ref;

  // Applies only to tests in this describe block
  beforeAll(async () => {

    //db = await setup(mockUser, mockData)

    // All paths are secure by default
    //ref = db.collection('trips');

  });

  afterAll(async () => {
    await teardown();
  });

  test('hello', async () => {

    const db = await setup({ uid: 'bob' }, mockData);

    projRef = db.doc('trips/one')
    await projRef.set({from: 'nancy'})
    console.log(await projRef.get('from'))
    expect(await assertSucceeds(projRef.get()))
  });

});