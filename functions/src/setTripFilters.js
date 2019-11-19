const functions = require('firebase-functions');
const _ = require('lodash')

module.exports = functions.firestore
  .document('trips/{tripId}').onWrite((change, context) => {
    console.log(change.after.data());
    let changes = {};
    if (change.before.data().from !== change.after.data().from)
      changes.from_filters = getSubstrings(change.after.data().from)

    if (change.before.data().to !== change.after.data().to)
      changes.to_filters = getSubstrings(change.after.data().to)

    return change.after.ref.set(changes, {merge: true});
  });


function getSubstrings (str) {
  return _.reduce(
    _.tail(str.split('')),
    (acc, val) => {
      acc.push(acc[acc.length - 1] + val);
      return acc
    },
    [str.split('')[0]]
  )
}
