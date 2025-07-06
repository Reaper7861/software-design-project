// Setup
const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");


// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

// Set custom claims
async function setRole(uid, role){
    // Set admin role
    if(role === "administrator"){
        await admin.auth().setCustomUserClaims(uid, {admin: true});
        console.log(`Assigned admin role to user ${uid}`);
    // Set volunteer role
    } else {
     await admin.auth().setCustomUserClaims(uid, {admin: false});
     console.log(`Assigned volunteer role to user ${uid}`);
    }
}


// Get UID and role
const uid = process.argv[2];
const role = process.argv[3];

if(!uid || !role){
    console.error("Error in setRole.js");
    process.exit(1);
}


// Call function
setRole(uid, role);