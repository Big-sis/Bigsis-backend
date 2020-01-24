const functions = require('firebase-functions')
const admin = require('firebase-admin')
const setupFilters = require('./src/setupFilters')
const _ = require('lodash')

admin.initializeApp()


exports.setTripFilters = functions.firestore.document('trips/{tripId}').onWrite((change, context) => setupFilters(['from', 'to'], change))
exports.setContactFilters = functions.firestore.document('USERS/{userId}').onWrite((change, context) => setupFilters(['firstname', 'lastname', 'username'], change))


/**
 * Send Notification to admins of a given event when a user rise an alert
 *
 * Triggerd on alert created
 *
 * Users save their device notification tokens to `TBS/AllCampus/AllEvent/{eventId}/notificationTokens/{notificationToken}`.
 */
exports.sendAlertNotification = functions.firestore
  .document('TBS/AllCampus/AllCampus/{campus}/Events/{eventId}/Alert/{userId}')
  .onCreate(async (snap, context) => {

    console.log('We have a new alert. In campus : ', context.params.campus, 'from user:', snap.id, ' and event: ', context.params.eventId);

    // Add alert to unread alerts
    const event = await admin.firestore()
      .doc(`TBS/AllCampus/AllCampus/{campus}/Events/${context.params.eventId}`)
      .get()
    console.log(event)
    const adminIds = await admin.firestore()
      .collection(`TBS/AllCampus/AllCampus/${context.params.campus}/Users`)
      .where('admin', '==', true)
      .get()
    console.log("Admins : ", adminIds.size)
    adminIds.forEach(doc =>
      admin.firestore()
        .collection(`USERS/${doc.id}/UnreadAlerts`)
        .doc(snap.id).set({alert: `TBS/AllCampus/AllCampus/${context.params.campus}/Events/${context.params.eventId}/Alert/${snap.id}`})
    )

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
        body: `Someone is in trouble.`
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

/**
 * Send Notification to users of a given campus when an event is created in this campu
 *
 * Triggerd on event created
 *
 * Users save their device notification tokens to `TBS/AllCampus/AllCampus/{campusId}/notificationTokens/{notificationToken}`.
 */
exports.sendNewEventNotification = functions.firestore
  .document('TBS/AllCampus/AllCampus/{campus}/Events/{eventId}')
  .onCreate(async (snap, context) => {

    console.log('We have a new event. With id:', snap.id, ' and in campus: ', context.params.campus);

    // Add event to unread events
    const users = await admin.firestore()
      .collection(`TBS/AllCampus/AllCampus/${context.params.campus}/Users`)
      .get()
    console.log("Users : ", users.size)
    users.forEach(doc =>
      admin.firestore()
        .collection(`USERS/${doc.id}/UnreadEvents`)
        .doc(snap.id).set({event: `TBS/AllCampus/AllCampus/${context.params.campus}/Events/${context.params.eventId}`})
    )

    // Get the list of device notification tokens.
    const tokensSnapshot = await admin.firestore()
      .collection(`TBS/AllCampus/AllCampus/${context.params.campusId}/NotificationTokens`)
      .get()

    // Check if there are any device tokens.
    if (tokensSnapshot.empty) {
      return console.log('There are no notification tokens to send to.');
    }
    console.log('There are', tokensSnapshot.size, 'tokens to send notifications to.');

    // Notification details.
    const payload = {
      notification: {
        title: 'New event in your campus !',
        body: `Click here to learn more about this new event`
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

/**
 * Send Notification to users of a given chat group when a new message is posted
 *
 * Triggerd on chat created
 *
 * Users save their device notification tokens to `TBS/AllCampus/AllChatGroups/{groupId}/notificationTokens/{notificationToken}`.
 */
exports.sendNewMessageNotification = functions.firestore
  .document('TBS/AllCampus/AllChatGroups/{groupId}/Chats/{messageId}')
  .onCreate(async (snap, context) => {

    console.log('We have a new message. With id:', snap.id, ' and in group: ', context.params.groupId)

    // Get the list of participants
    const users = await admin.firestore()
      .collection(`TBS/AllCampus/AllChatGroups/${context.params.groupId}/Participants`)
      .get()
    console.log("Users : ", users.size)

    // Check if there are any device tokens.
    if (users.empty) {
      return console.log('There are no notification tokens to send to.');
    }

    // Add event to unread events
    users.forEach(doc => {
      if (doc.id !== snap.get('senderId'))
        admin.firestore()
          .collection(`USERS/${doc.id}/UnreadMessages`)
          .doc(snap.id).set({message: `TBS/AllCampus/AllChatGroups/${context.params.groupId}/Chats/${snap.id}`})
    })

    // Notification details.
    const payload = {
      notification: {
        title: 'New message',
        body: snap.get('message')
      }
    };

    // Listing all tokens as an array.
    let tokens = await _.reduce( users.docs, async (acc, doc) => {
      if (doc.id !== snap.get('senderId')) {
        let tokenDocs = await admin.firestore().collection(`USERS/${doc.id}/NotificationTokens`).listDocuments()
        tokenDocs.forEach(doc => acc.push(doc.id))
      }
      return acc
    }, [])

    // Send notifications to all tokens.
    return admin.messaging().sendToDevice(tokens, payload);
  });