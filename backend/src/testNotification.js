const admin = require('./firebaseAdmin');

const testToken = 'cl3RvjTgPJbUcv9A8qWiAM:APA91bFO3qG6VmZydw4_EWxCoh6bFw2ojVx_Gfhoz8PbDOZ8EyXMZ0Ey5Awkxs7QBj52dnPwsJ6DHczOr8TRwRk4vKZm_BPnwIk2GljVeGr40zObhrGY2mI'; //get the token from the browser console !!

async function testSend() {
  try {
    const response = await admin.messaging().send({
      token: testToken,
      notification: {
        title: 'Test Notification',
        body: 'This is a test from Firebase Admin SDK.',
      },
    });
    console.log('Notification sent successfully:', response);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

testSend();