// Setup
const supabase = require('../config/databaseBackend');


class AuthService {
  // Register new user
  async registerUser(email, password, role = 'volunteer') {
    try {
      // Insert user into Supabase
      const { data, error } = await supabase
        .from('usercredentials')
        .insert([{ email, password, role }])
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
      throw new Error('Registration failed');
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
