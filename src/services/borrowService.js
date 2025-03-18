import { collection, addDoc, updateDoc, getDoc, getDocs, doc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { updateBookStatus } from './bookService';
import * as MailComposer from 'expo-mail-composer';
import * as SMS from 'expo-sms';

// Generate a 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTP in Firebase
export const storeOTP = async (borrowerEmail, borrowerPhone, otp) => {
  try {
    const otpRef = collection(db, 'Otps');
    await addDoc(otpRef, {
      email: borrowerEmail,
      phone: borrowerPhone,
      otp,
      createdAt: Timestamp.now(),
      isUsed: false
    });
    return true;
  } catch (error) {
    console.error('Error storing OTP:', error);
    throw error;
  }
};

// Verify OTP
export const verifyOTP = async (borrowerEmail, inputOTP) => {
  try {
    const otpRef = collection(db, 'Otps');
    const q = query(
      otpRef,
      where("email", "==", borrowerEmail),
      where("otp", "==", inputOTP),
      where("isUsed", "==", false)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return false;
    }
    
    // Mark OTP as used
    const otpDoc = querySnapshot.docs[0];
    await updateDoc(doc(db, 'Otps', otpDoc.id), {
      isUsed: true
    });
    
    return true;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
};

// Send OTP via email
export const sendOTPViaEmail = async (borrowerEmail, otp) => {
  try {
    const isAvailable = await MailComposer.isAvailableAsync();
    
    if (!isAvailable) {
      console.error('Mail composer is not available');
      return false;
    }
    
    await MailComposer.composeAsync({
      recipients: [borrowerEmail],
      subject: 'Your Library App OTP Code',
      body: `Your OTP code for book borrowing is: ${otp}. This code will expire in 10 minutes.`,
      isHtml: false
    });
    
    return true;
  } catch (error) {
    console.error('Error sending OTP via email:', error);
    throw error;
  }
};

// Send OTP via SMS
export const sendOTPViaSMS = async (borrowerPhone, otp) => {
  try {
    const isAvailable = await SMS.isAvailableAsync();
    
    if (!isAvailable) {
      console.error('SMS is not available');
      return false;
    }
    
    const { result } = await SMS.sendSMSAsync(
      [borrowerPhone],
      `Your OTP code for book borrowing is: ${otp}. This code will expire in 10 minutes.`
    );
    
    return result === 'sent';
  } catch (error) {
    console.error('Error sending OTP via SMS:', error);
    throw error;
  }
};

// Borrow a book
export const borrowBook = async (book_id, borrowerDetails) => {
  try {
    // First update the book status
    await updateBookStatus(book_id, 'borrowed');
    
    // Create a borrow record
    const borrowsRef = collection(db, 'Borrows');
    const borrowDoc = await addDoc(borrowsRef, {
      book_id,
      borrower: borrowerDetails,
      borrow_date: Timestamp.now(),
      due_date: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)), // 14 days from now
      returned_date: null,
      status: 'active',
    });
    
    // Increment the borrow count for the book
    const bookRef = doc(db, 'Books', book_id);
    const bookDoc = await getDoc(bookRef);
    
    if (bookDoc.exists()) {
      const currentCount = bookDoc.data().borrow_count || 0;
      await updateDoc(bookRef, {
        borrow_count: currentCount + 1
      });
    }
    
    return { id: borrowDoc.id, book_id, borrower: borrowerDetails };
  } catch (error) {
    console.error('Error borrowing book:', error);
    throw error;
  }
};

// Return a book
export const returnBook = async (borrow_id) => {
  try {
    // Get the borrow record
    const borrowRef = doc(db, 'Borrows', borrow_id);
    const borrowDoc = await getDoc(borrowRef);
    
    if (!borrowDoc.exists()) {
      throw new Error('Borrow record not found');
    }
    
    const borrowData = borrowDoc.data();
    
    // Update the book status
    await updateBookStatus(borrowData.book_id, 'available');
    
    // Update the borrow record
    await updateDoc(borrowRef, {
      returned_date: Timestamp.now(),
      status: 'returned'
    });
    
    return true;
  } catch (error) {
    console.error('Error returning book:', error);
    throw error;
  }
};

// Get all active borrows
export const getActiveBorrows = async () => {
  try {
    const borrowsRef = collection(db, 'Borrows');
    const querySnapshot = await getDocs(borrowsRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting all borrows:', error);
    throw error;
  }
};

// Get all borrows
export const getAllBorrows = async () => {
  try {
    const borrowsRef = collection(db, 'Borrows');
    const querySnapshot = await getDocs(borrowsRef);
    
    const borrows = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      length: querySnapshot.size, // Total number of borrow records
      data: borrows             // Array of borrow objects
    };
  } catch (error) {
    console.error('Error getting all borrows:', error);
    throw error;
  }
};

// Get borrows by borrower email
export const getBorrowsByEmail = async (email) => {
  try {
    const borrowsRef = collection(db, 'Borrows');
    const q = query(borrowsRef, where("borrower.email", "==", email));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting borrows by email:', error);
    throw error;
  }
};

// Get borrow history for a book
export const getBookBorrowHistory = async (book_id) => {
  try {
    const borrowsRef = collection(db, 'Borrows');
    const q = query(
      borrowsRef,
      where("book_id", "==", book_id),
      orderBy("borrow_date", "desc") 
    );
    const querySnapshot = await getDocs(q);
    
    const borrows = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      length: querySnapshot.size, 
      data: borrows             
    };
  } catch (error) {
    console.error('Error getting book borrow history:', error);
    throw error;
  }
};

// Get overdue borrows
export const getOverdueBorrows = async () => {
  try {
    const borrowsRef = collection(db, 'Borrows');
    const q = query(borrowsRef, where("status", "==", "active"));
    const querySnapshot = await getDocs(q);
    
    const now = Timestamp.now();
    
    // Filter out overdue borrows
    return querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(borrow => borrow.due_date.toMillis() < now.toMillis());
  } catch (error) {
    console.error('Error getting overdue borrows:', error);
    throw error;
  }
};

// Send reminder to borrower
export const sendBorrowReminder = async (borrow) => {
  try {
    const { borrower, due_date } = borrow;
    const dueDateTime = due_date.toDate();
    
    // Format due date
    const formattedDate = dueDateTime.toLocaleDateString();
    
    // Send email reminder
    if (borrower.email) {
      const isAvailable = await MailComposer.isAvailableAsync();
      
      if (isAvailable) {
        await MailComposer.composeAsync({
          recipients: [borrower.email],
          subject: 'Library Book Due Date Reminder',
          body: `Dear ${borrower.name},\n\nThis is a friendly reminder that your borrowed book is due on ${formattedDate}. Please return it on time.\n\nThank you,\nLibrary Management`,
          isHtml: false
        });
      }
    }
    
    // Send SMS reminder
    if (borrower.phone) {
      const isAvailable = await SMS.isAvailableAsync();
      
      if (isAvailable) {
        await SMS.sendSMSAsync(
          [borrower.phone],
          `Library Reminder: Your borrowed book is due on ${formattedDate}. Please return it on time.`
        );
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error sending borrow reminder:', error);
    throw error;
  }
};