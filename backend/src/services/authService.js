// Setup
const supabase = require('../config/databaseBackend');
const bcrypt = require('bcryptjs');
const { auth } = require('../config/firebase');


class AuthService {
  // Register new user
  async registerUser(email, password, role = 'volunteer') {
    try {
      // First, create the user in Firebase Auth
      const userRecord = await auth.createUser({
        email: email,
        password: password,
        emailVerified: false
      });

      const uid = userRecord.uid;

      // Hash the password before storing
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insert user into Supabase with the Firebase UID
      const { data, error } = await supabase
        .from('usercredentials')
        .insert([{ uid, email, password: hashedPassword, role }])
        .select();
      
      if (error) {
        if (error.code === '23505') {
          throw new Error('Email already exists');
        }
        throw error;
      }
      
      return {
        success: true,
        user: data[0]
      };
    } catch (error) {
      console.error('Registration error: ', error);
      
      // Check for Firebase Auth specific errors
      if (error.code === 'auth/email-already-exists') {
        throw new Error('Email already exists');
      }
      
      throw new Error('Registration failed');
    }
  }

  // Verify password for login
  async verifyPassword(email, password) {
    try {
      const user = await this.getUserByEmail(email);
      if (!user) {
        throw new Error('User not found');
      }
      
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid password');
      }
      
      return user;
    } catch (error) {
      console.error('Password verification error: ', error);
      throw error;
    }
  }

  // Obtain user by email
  async getUserByEmail(email) {
    const { data, error } = await supabase
      .from('usercredentials')
      .select('*')
      .eq('email', email)
      .single();
    if (error) {
      throw new Error('User not found');
    }
    return data;
  }

  // Obtain user by UID
  async getUserByUid(uid) {
    const { data, error } = await supabase
      .from('usercredentials')
      .select('*')
      .eq('uid', uid)
      .single();
    if (error) {
      throw new Error('User not found');
    }
    return data;
  }

  // Verify Firebase ID token and return decoded info
  async verifyFirebaseToken(idToken) {
    const { auth } = require('../config/firebase');
    return await auth.verifyIdToken(idToken);
  }
}

module.exports = new AuthService();
