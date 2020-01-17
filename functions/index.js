const functions = require('firebase-functions')
const admin = require('firebase-admin')
const setupFilters = require('./src/setupFilters')
const _ = require('lodash')

admin.initializeApp()


exports.setTripFilters = functions.firestore.document('trips/{tripId}').onWrite((change, context) => setupFilters(['from', 'to'], change))
exports.setContactFilters = functions.firestore.document('users/{userId}').onWrite((change, context) => setupFilters(['firstname', 'lastname', 'username'], change))


/**
 * Triggers when a user sends an alert
 *
 * Users save their device notification tokens to `TBS/AllCampus/AllEvent/{eventId}/notificationTokens/{notificationToken}`.
 */
exports.sendNotifications = functions.firestore
  .document('TBS/AllCampus/AllEvents/{eventId}/Alert/{userId}')
  .onCreate(async (snap, context) => {

    console.log('We have a new alert. from user:', snap.id, ' and event: ', context.params.eventId);

    // Get the list of device notification tokens.
    const tokensSnapshot = await admin.firestore()
      .collection(`TBS/AllCampus/AllEvents/${context.params.eventId}/NotificationTokens`)
      .get()

    // Check if there are any device tokens.
    if (tokensSnapshot.empty) {
      return console.log('There are no notification tokens to send to.');
    }
    console.log('There are', tokensSnapshot.size, 'tokens to send notifications to.');

    // Notification details.
    const payload = {
      notification: {
        title: 'You have a new alert !',
        body: `Quelqu'un is in trouble.`
      }
    };

    // Listing all tokens as an array.
    let tokens = _.map(tokensSnapshot.docs, doc => doc.id);
    console.log(tokens)
    // Send notifications to all tokens.
    const response = await admin.messaging().sendToDevice(tokens, payload);
    // For each message check if there was an error.
    const tokensToRemove = [];
    response.results.forEach((result, index) => {
      const error = result.error;
      if (error) {
        console.error('Failure sending notification to', tokens[index], error);
        // Cleanup the tokens who are not registered anymore.
        if (error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered') {
          tokensToRemove.push(tokensSnapshot.ref.child(tokens[index]).remove());
        }
      }
    });
    return Promise.all(tokensToRemove);
  });