const functions = require('firebase-functions');
const _ = require('lodash')

module.exports = functions.firestore
  .document('trips/{tripId}').onWrite((change, context) => {
    console.log(change.after.data());
    if (change.before.data().from !== change.after.data().from
      || change.before.data().to !== change.after.data().to)
      return change.after.ref.set({
        filters: _.uniq(_.flatten(_.map(
          [change.after.data().from, change.after.data().to] ,
            el => _.reduce(
              _.tail(el.split('')),
              (acc, val) => { acc.push(acc[acc.length-1] + val); return acc },
              [el.split('')[0]]
            )
        )))
      }, {merge: true});
    return null;
  });
