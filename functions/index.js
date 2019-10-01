const functions = require('firebase-functions');

exports.helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from Firebase!");
});

exports.setTripFilters = functions.firestore
  .document('trips/{tripId}').onWrite((change, context) => {
    console.log(change.after.data());
    if (change.before.data().from !== change.after.data().from
    || change.before.data().to !== change.after.data().to)
      return change.after.ref.set({
        filters: "filtered"
      }, {merge: true});
    return null;
  });

