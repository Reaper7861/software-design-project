// Setup
const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");
const supabase = require('../src/config/databaseBackend');

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

// Set custom claims
async function setRole(uid, role){
    try {
        // Set admin role in Firebase
        if(role === "administrator" || role === "admin" || role === "Administrator" || role === "Admin"){
            await admin.auth().setCustomUserClaims(uid, {admin: true});
            console.log(`Assigned admin role to user ${uid} in Firebase`);
        // Set volunteer role in Firebase
        } else if(role === "volunteer" || role === "Volunteer") {
            await admin.auth().setCustomUserClaims(uid, {admin: false});
            console.log(`Assigned volunteer role to user ${uid} in Firebase`);
        }
        
        // Update role in Supabase
        const {error} = await supabase
            .from('usercredentials')
            .update({role})
            .eq('uid', uid);
            
        if (error) {
            console.error('Error updating Supabase:', error);
        } else {
            console.log(`Updated role to ${role} in Supabase for user ${uid}`);
        }
        
    } catch (error) {
        console.error('Error setting role:', error);
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