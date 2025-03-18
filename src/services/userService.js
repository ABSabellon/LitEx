import { collection, query, where, getDocs, addDoc, setDoc, doc, orderBy } from 'firebase/firestore';
import { db } from './firebase';

// Check if a user with the given email exists in our database
export const checkUserExists = async (input) => {
  try {
    const usersRef = collection(db, 'Guests');
    
    // Create two queries: one for email and one for phone
    const emailQuery = query(usersRef, where("profile.email", "==", input));
    const phoneQuery = query(usersRef, where("profile.phone", "==", input));
    
    // Execute both queries concurrently
    const [emailSnapshot, phoneSnapshot] = await Promise.all([
      getDocs(emailQuery),
      getDocs(phoneQuery)
    ]);
    
    // Return true if either snapshot has results
    return !emailSnapshot.empty || !phoneSnapshot.empty;
  } catch (error) {
    console.error('Error checking if user exists:', error);
    throw error;
  }
};

// Get user by email
export const getUserByEmail = async (email) => {
  try {
    const usersRef = collection(db, 'Users');
    const q = query(usersRef, where("profile.email", "==", email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const userDoc = querySnapshot.docs[0];
    return {
      id: userDoc.id,
      ...userDoc.data()
    };
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
};

// Get all users sorted by creation date
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'Users');
    const q = query(usersRef, orderBy('timestamps.created_at'));
    const querySnapshot = await getDocs(q);

    const users = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Include minimal profile info for list displays
      profile: {
        name: doc.data().profile?.name,
        email: doc.data().profile?.email,
        role: doc.data().profile?.role
      }
    }));

    return {
      length: querySnapshot.size, // Total number of users
      data: users               // Array of user objects
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Create a guest user with the given information
export const createGuestUser = async (name, email, phone) => {
  try {
    // Check if a user with this email already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return existingUser;
    }
    
    const now = new Date();
    
    // Create structured user data
    const userData = {
      profile: {
        email,
        name,
        phone,
        email_verified: false,
        mobile_verified: false,
      },
      status: 'active',
      timestamps: {
        created_at: now,
        last_login: now,
      },
      logs: {
        created: {
          created_by: {
            email: 'system',
            name: 'Guest Registration'
          },
          created_at: now
        }
      }
    };
    
    // Add to Users collection
    const userRef = collection(db, 'Guests');
    const docRef = await addDoc(userRef, userData);
    
    // Return the created user with ID
    return {
      id: docRef.id,
      ...userData
    };
  } catch (error) {
    console.error('Error creating guest user:', error);
    throw error;
  }
};

export const getGuestByContact = async (contact) => {
  try {
    const usersRef = collection(db, 'Guests');
    const emailQuery = query(usersRef, where("profile.email", "==", contact));
    const phoneQuery = query(usersRef, where("profile.phone", "==", contact));
    
    const [emailSnapshot, phoneSnapshot] = await Promise.all([
      getDocs(emailQuery),
      getDocs(phoneQuery)
    ]);

    if (!emailSnapshot.empty) {
      const doc = emailSnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    
    if (!phoneSnapshot.empty) {
      const doc = phoneSnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user by contact:', error);
    throw error;
  }
};