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
export const storeOTP = async (guestEmail, guestPhone, otp) => {
  try {
    const otpRef = collection(db, 'Otps');
    await addDoc(otpRef, {
      email: guestEmail,
      phone: guestPhone,
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
export const verifyOTP = async (guestEmail, inputOTP) => {
  try {
    const otpRef = collection(db, 'Otps');
    const q = query(
      otpRef,
      where("email", "==", guestEmail),
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
export const sendOTPViaEmail = async (guestEmail, otp) => {
  try {
    const isAvailable = await MailComposer.isAvailableAsync();
    
    if (!isAvailable) {
      console.error('Mail composer is not available');
      return false;
    }
    
    await MailComposer.composeAsync({
      recipients: [guestEmail],
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
export const sendOTPViaSMS = async (guestPhone, otp) => {
  try {
    const isAvailable = await SMS.isAvailableAsync();
    
    if (!isAvailable) {
      console.error('SMS is not available');
      return false;
    }
    
    const { result } = await SMS.sendSMSAsync(
      [guestPhone],
      `Your OTP code for book borrowing is: ${otp}. This code will expire in 10 minutes.`
    );
    
    return result === 'sent';
  } catch (error) {
    console.error('Error sending OTP via SMS:', error);
    throw error;
  }
};

// Loan a book
export const loanBook = async (book_id, guestDetails) => {
  try {
    // First update the book status
    await updateBookStatus(book_id, 'loaned');
    
    // Create a borrow record
    const loanedRef = collection(db, 'BookLoans');
    const borrowDoc = await addDoc(loanedRef, {
      book_id,
      guest: guestDetails,
      loaned_date: Timestamp.now(),
      due_date: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)), // 14 days from now
      return_date: null,
      status: 'active',
    });
    
    // Increment the borrow count for the book
    const bookRef = doc(db, 'Books', book_id);
    const bookDoc = await getDoc(bookRef);
    
    if (bookDoc.exists()) {
      const currentCount = bookDoc.data().loan_count || 0;
      await updateDoc(bookRef, {
        loan_count: currentCount + 1
      });
    }
    
    return { id: borrowDoc.id, book_id, guest: guestDetails };
  } catch (error) {
    console.error('Error borrowing book:', error);
    throw error;
  }
};

// Return a book
export const returnBook = async (borrow_id) => {
  try {
    // Get the borrow record
    const borrowRef = doc(db, 'BookLoans', borrow_id);
    const borrowDoc = await getDoc(borrowRef);
    
    if (!borrowDoc.exists()) {
      throw new Error('Loan record not found');
    }
    
    const borrowData = borrowDoc.data();
    
    // Update the book status
    await updateBookStatus(borrowData.book_id, 'available');
    
    // Update the borrow record
    await updateDoc(borrowRef, {
      return_date: Timestamp.now(),
      status: 'returned'
    });
    
    return true;
  } catch (error) {
    console.error('Error returning book:', error);
    throw error;
  }
};

// Get all active borrows
export const getActiveLoans = async () => {
  try {
    const loanedRef = collection(db, 'BookLoans');
    const querySnapshot = await getDocs(loanedRef);
    
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
export const getAllLoanedBooks = async () => {
  try {
    const loanedRef = collection(db, 'BookLoans');
    const querySnapshot = await getDocs(loanedRef);
    
    const loaned = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      length: querySnapshot.size, // Total number of borrow records
      data: loaned             // Array of borrow objects
    };
  } catch (error) {
    console.error('Error getting all borrows:', error);
    throw error;
  }
};

// Get borrows by guest email
export const getLoanedBooksByEmail = async (email) => {
  try {
    const loanedRef = collection(db, 'BookLoans');
    const q = query(loanedRef, where("guest.email", "==", email));
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
export const getBookLoanHistory = async (book_id) => {
  try {
    const loanedRef = collection(db, 'BookLoans');
    const q = query(
      loanedRef,
      where("book_id", "==", book_id),
      orderBy("loaned_date", "desc") 
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
export const getOverdueLoans = async () => {
  try {
    const loanedRef = collection(db, 'BookLoans');
    const q = query(loanedRef, where("status", "==", "active"));
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

// Send reminder to guest
export const sendLoanReminder = async (borrow) => {
  try {
    const { guest, due_date } = borrow;
    const dueDateTime = due_date.toDate();
    
    // Format due date
    const formattedDate = dueDateTime.toLocaleDateString();
    
    // Send email reminder
    if (guest.email) {
      const isAvailable = await MailComposer.isAvailableAsync();
      
      if (isAvailable) {
        await MailComposer.composeAsync({
          recipients: [guest.email],
          subject: 'Library Book Due Date Reminder',
          body: `Dear ${guest.name},\n\nThis is a friendly reminder that your loaned book is due on ${formattedDate}. Please return it on time.\n\nThank you,\nLibrary Management`,
          isHtml: false
        });
      }
    }
    
    // Send SMS reminder
    if (guest.phone) {
      const isAvailable = await SMS.isAvailableAsync();
      
      if (isAvailable) {
        await SMS.sendSMSAsync(
          [guest.phone],
          `Library Reminder: Your loaned book is due on ${formattedDate}. Please return it on time.`
        );
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error sending borrow reminder:', error);
    throw error;
  }
};