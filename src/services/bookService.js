import axios from 'axios';
import { collection, addDoc, updateDoc, getDoc, getDocs, doc, query, where, deleteDoc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import QRCode from 'qrcode';
// For base64 encoding in React Native environment
import { Buffer } from 'buffer';
// Import library code generator
import { generateLibraryCode } from '../utils/libraryCodeGenerator';

// Open Library API base URLs
const OPEN_LIBRARY_IDENTIFIER_URL = 'http://openlibrary.org/api/volumes/brief/';
const OPEN_LIBRARY_SEARCH_URL = 'https://openlibrary.org/search.json';
const OPEN_LIBRARY_COVERS_URL = 'https://covers.openlibrary.org/b/id/';
const OPEN_LIBRARY_AUTHOR_COVERS_URL = 'https://covers.openlibrary.org/a/id/';
const OPEN_LIBRARY_URL = 'https://openlibrary.org';

export const getBookByIdentifier = async (type, id) => {
  try {
    let identifier = id;

    if (type === 'isbn') {
      identifier = id.replace(/-/g, '');
    }

    const response = await axios.get(`${OPEN_LIBRARY_IDENTIFIER_URL}${type}/${identifier}.json`);
   
    if (!response.data.records || Object.keys(response.data.records).length === 0) {
      throw new Error('Book not found.');
    }

    const firstRecordKey = Object.keys(response.data.records)[0];
    const bookData = response.data.records[firstRecordKey];
    
    // console.log('authors :: ', bookData.data.authors)
    const transformedBook = {
      title: bookData.data?.title || '',
      full_title: bookData.details?.details?.full_title || '',
      authors: bookData.data?.authors ? bookData.data.authors.map(author => {
        // Extract the OpenLibrary ID from the author URL
        // URL format: http://openlibrary.org/authors/OL7115219A/Sarah_J._Maas
        const match = author.url && typeof author.url === 'string'
          ? author.url.match(/\/authors\/(OL\w+)/)
          : null;
        const openLibraryId = match ? match[1] : '';
        return {
          name: author.name,
          openLibrary_id: openLibraryId
        };
      }) : [],
      publisher: bookData.data?.publishers ? bookData.data.publishers.map(publisher => publisher.name):[],
      published_date: bookData.data?.publish_date || bookData.publishDates?.[0] || '',
      publisher_place:bookData.data?.publish_places ? bookData.data.publish_places.map(places => places.name) : [],
      page_count: bookData.data?.number_of_pages || null,
      subjects: bookData.data?.subjects ? bookData.data.subjects.map(subject => subject.name) : [],
      weight: bookData.data?.weight || null,
      identifiers: bookData.data?.identifiers ? Object.fromEntries(Object.entries(bookData.data.identifiers).map(([key, value]) => [key, value[0]])) : {},
      covers: bookData.data?.cover ? { cover_small: bookData.data.cover.small, cover_medium: bookData.data.cover.medium, cover_large: bookData.data.cover.large} : null,
      openlibrary_url: bookData.recordURL || bookData.data?.url || '',
      work_key: bookData.details?.details?.works?.[0]?.key || '',
      series: bookData.details?.details?.series || [],
    };

    const response2 = await axios.get(`${OPEN_LIBRARY_URL}${transformedBook.work_key}.json`);
    transformedBook.description = response2.data?.description?.value || response2.data?.description || '';

    const response3 = await axios.get(`${OPEN_LIBRARY_URL}${transformedBook.work_key}/ratings.json`);
    transformedBook.ratings = response3.data

    // console.log('response2 :: ', response2.data.description)
    // Process the book data for AddBookScreen
    const processedBook = processBookForAddScreen(transformedBook);
    
    return processedBook;
    // return null
    
  } catch (error) {
    console.error('Error fetching book:', error.message || error);
    throw error;
  }
};

// Function to get a book by ISBN
export const getBookByISBN = async (isbn) => {
  try {
    return await getBookByIdentifier('isbn', isbn);
  } catch (error) {
    console.error('Error fetching book by ISBN:', error);
    throw error;
  }
};

// Function to get a book by barcode (which is typically an ISBN)
export const getBookByBarcode = async (barcode) => {
  try {
    return await getBookByISBN(barcode);
  } catch (error) {
    console.error('Error fetching book by barcode:', error);
    throw error;
  }
};


export const processBookForAddScreen = (bookData) => {
  if (!bookData) return null;
  
  const processedBook = { ...bookData };
  
  if (processedBook.covers) {
    processedBook.image_url =
      processedBook.covers.cover_medium ||
      processedBook.covers.cover_large ||
      processedBook.covers.cover_small ||
      null;
  }
  
  if (processedBook.authors && Array.isArray(processedBook.authors)) {
    // Keep the original authors array with openLibrary_id for later use
    processedBook.authorsData = processedBook.authors;
    
    if (processedBook.authors.length > 0 && typeof processedBook.authors[0] === 'object') {
      processedBook.author = processedBook.authors.map(author => author.name).join(', ');
    }
    else if (processedBook.authors.length > 0) {
      processedBook.author = processedBook.authors.join(', ');
    }
  }
  
  if (processedBook.subjects && Array.isArray(processedBook.subjects)) {
    processedBook.categories = processedBook.subjects;
  }
  
  return processedBook;
};


// Helper function to generate QR data for a book
const generateQRData = (book_id, title, author, libraryCode) => {
  // Create a data object with essential book info
  const qrData = {
    id: book_id,
    title: title || '',
    author: author || '',
    location: libraryCode || '',
    type: 'library_book'
  };
  
  // Return as JSON string
  return JSON.stringify(qrData);
};

// Generate QR code as base64 data URL
const generateQRAsBase64 = async (data) => {
  try {
    // In React Native environment, we need a different approach than using Canvas
    // Using QRCode.toString to generate SVG string
    const svgString = await QRCode.toString(data, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
      type: 'svg',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // Create a data URL with the SVG content
    const dataURL = `data:image/svg+xml;base64,${Buffer.from(svgString).toString('base64')}`;
    return dataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

// Generate QR code for a book and update its document
export const generateBookQR = async (book_id) => {
  try {
    // Get the book document
    const bookRef = doc(db, 'Books', book_id);
    const bookDoc = await getDoc(bookRef);
    
    if (!bookDoc.exists()) {
      throw new Error('Book not found');
    }
    
    const bookData = bookDoc.data();
    
    // Determine author data based on the book data structure
    let authorText = '';
    if (bookData.book_info && bookData.book_info.authors) {
      if (bookData.book_info.authors.length > 0 && typeof bookData.book_info.authors[0] === 'object') {
        // Handle new format with name and openLibrary_id
        authorText = bookData.book_info.authors.map(author => author.name).join(', ');
      } else {
        // Handle legacy format with strings
        authorText = bookData.book_info.authors.join(', ');
      }
    } else if (bookData.author) {
      authorText = bookData.author;
    }
    
    // Generate QR code data for the book
    const qrData = generateQRData(
      book_id,
      bookData.book_info ? bookData.book_info.title : bookData.title,
      authorText,
      bookData.library_info.location,
    );
    
    const qrCodeBase64 = await generateQRAsBase64(qrData);
    
    // Get the current user
    const { currentUser } = await import('../context/AuthContext').then(module => module.useAuth());
    
    // Update the book document with the QR code
    if (bookData.library_info) {
      // New structure with library_info
      await updateDoc(bookRef, {
        library_info: {
          ...bookData.library_info,
          library_qr: qrCodeBase64,
        },
        logs: {
          ...bookData.logs,
          qr_generated: {
            generated_by: currentUser ? {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName || ''
            } : {
              uid: 'system',
              email: 'system',
              displayName: 'System'
            },
            generated_at: new Date()
          }
        }
      });
    } else {
      // Legacy structure support
      await updateDoc(bookRef, {
        library_qr: qrCodeBase64,
        logs: {
          ...bookData.logs,
          qr_generated: {
            generated_by: currentUser ? {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName || ''
            } : {
              uid: 'system',
              email: 'system',
              displayName: 'System'
            },
            generated_at: new Date()
          }
        }
      });
    }
    
    return qrCodeBase64;
  } catch (error) {
    console.error('Error generating book QR:', error);
    throw error;
  }
};

// Firebase Functions

// Check for duplicate books based on identifiers
export const checkBookExists = async (identifiers) => {
  try {
    if (!identifiers || Object.keys(identifiers).length === 0) {
      return null;
    }
    
    const booksRef = collection(db, 'Books');
    
    // Check each identifier type (isbn_10, isbn_13, lccn, oclc, openlibrary)
    for (const [type, value] of Object.entries(identifiers)) {
      if (!value) continue;
      
      // Query for books with matching identifier
      const fieldPath = `identifiers.${type}`;
      const q = query(booksRef, where(fieldPath, "==", value));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Return the first matching book
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data()
        };
      }
    }
    
    // No matching book found
    return null;
  } catch (error) {
    console.error('Error checking if book exists:', error);
    throw error;
  }
};

export const uploadBook = async (bookData, currentUser) => {
  try {
    // Check if book already exists using identifiers
    const existingBook = await checkBookExists(bookData.identifiers || {});
    
    // If book exists, return a message instead of throwing an error
    if (existingBook) {
      console.warn(`Book already exists with ID: ${existingBook.id}. Skipping upload.`);
      return { id: existingBook.id, message: 'Book already exists. Skipped.' };
    }

    // Generate library code for a new book (copyNumber is always 1 since duplicates aren't allowed)
    const libraryCode = generateLibraryCode(bookData, 1);

    const cleanBookData = {
      book_info: {
        authors: bookData.authorsData
          ? bookData.authorsData.map(author => ({
              name: author.name,
              openLibrary_id: author.openLibrary_id
            }))
          : bookData.author
            ? bookData.author.split(',').map(name => ({ name: name.trim() }))
            : [],
        description: bookData.description || '',
        full_title: bookData.full_title || '',
        series: bookData.series || [],
        title: bookData.title || '',
      },
      publish_info: {
        publishers: bookData.publisher || [],
        published_date: bookData.published_date || '',
        publisher_place: bookData.publisher_place || [],
      },
      categories: bookData.categories || [],
      weight: bookData.weight || null,
      page_count: bookData.page_count || null,
      identifiers: bookData.identifiers || {},
      media: {
        covers: bookData.covers || null,
      },
      status: 'available',
      notes: bookData.notes || '',
      edition: bookData.edition || '',
      library_info: {
        openlibrary_url: bookData.openlibrary_url || '',
        work_key: bookData.work_key || '',
        library_qr: null,
        location: bookData.location || libraryCode,
      },
      stats: {
        borrow_count: 0,
        ratings: bookData.ratings || [],
        average_rating: 0,
        copy_count: 1,
        available_copies: 1,
      },
      logs: {
        created: {
          created_by: currentUser ? {
            uid: currentUser.profile.uid,
            email: currentUser.profile.email,
            displayName: currentUser.profile.name || ''
          } : {
            uid: 'system',
            email: 'system',
            displayName: 'System'
          },
          created_at: new Date()
        }
      }
    };

    // Add new book to Firestore since no duplicate was found
    const booksRef = collection(db, 'Books');
    const bookDoc = await addDoc(booksRef, cleanBookData);

    return { id: bookDoc.id, ...cleanBookData };
  } catch (error) {
    console.error('Error adding book to library:', error);
    return { error: error.message };
  }
};

export const batchUploadBooks = async (books, currentUser) => {
  try {
    const batch = writeBatch(db);
    const booksRef = collection(db, 'Books');
    const results = [];

    // Process each book
    for (const bookData of books) {
      // Check if book already exists using identifiers
      const existingBook = await checkBookExists(bookData.identifiers || {});
      
      if (existingBook) {
        console.warn(`Book already exists with ID: ${existingBook.id}. Skipping upload.`);
        results.push({ 
          id: existingBook.id, 
          message: 'Book already exists. Skipped.' 
        });
        continue; // Skip to next book
      }

      // Generate library code for a new book
      const libraryCode = generateLibraryCode(bookData, 1);

      const cleanBookData = {
        book_info: {
          authors: bookData.authorsData
            ? bookData.authorsData.map(author => ({
                name: author.name,
                openLibrary_id: author.openLibrary_id
              }))
            : bookData.author
              ? bookData.author.split(',').map(name => ({ name: name.trim() }))
              : [],
          description: bookData.description || '',
          full_title: bookData.full_title || '',
          series: bookData.series || [],
          title: bookData.title || '',
        },
        publish_info: {
          publishers: bookData.publisher || [],
          published_date: bookData.published_date || '',
          publisher_place: bookData.publisher_place || [],
        },
        categories: bookData.categories || [],
        weight: bookData.weight || null,
        page_count: bookData.page_count || null,
        identifiers: bookData.identifiers || {},
        media: {
          covers: bookData.covers || null,
        },
        status: 'available',
        notes: bookData.notes || '',
        edition: bookData.edition || '',
        library_info: {
          openlibrary_url: bookData.openlibrary_url || '',
          work_key: bookData.work_key || '',
          library_qr: null,
          location: bookData.location || libraryCode,
        },
        stats: {
          borrow_count: 0,
          ratings: bookData.ratings || [],
          average_rating: 0,
          copy_count: 1,
          available_copies: 1,
        },
        logs: {
          created: {
            created_by: currentUser ? {
              uid: currentUser.profile.uid,
              email: currentUser.profile.email,
              displayName: currentUser.profile.name || ''
            } : {
              uid: 'system',
              email: 'system',
              displayName: 'System'
            },
            created_at: new Date()
          }
        }
      };

      // Create a new document reference and add to batch
      const newDocRef = doc(booksRef);
      batch.set(newDocRef, cleanBookData);
      results.push({ id: newDocRef.id, ...cleanBookData });
    }

    // Commit the batch
    await batch.commit();
    return { success: true, results };

  } catch (error) {
    console.error('Error during batch upload of books:', error);
    return { error: error.message, results: [] };
  }
};


// // Uncomment below for allowing duplicate books
// export const uploadBook = async (bookData, currentUser) => {
//   try {
//     // Check if book already exists using identifiers
//     const existingBook = await checkBookExists(bookData.identifiers || {});
    
//     // Determine copy number (for library code)
//     const copyNumber = existingBook ? (existingBook.stats?.copy_count || 1) + 1 : 1;
    
//     // Generate library code based on book metadata
//     const libraryCode = generateLibraryCode(bookData, copyNumber);
    
//     const cleanBookData = {
//           book_info:{
//             authors: bookData.authorsData
//               ? bookData.authorsData.map(author => ({
//                   name: author.name,
//                   openLibrary_id: author.openLibrary_id
//                 }))
//               : bookData.author
//                 ? bookData.author.split(',').map(name => ({ name: name.trim() }))
//                 : [],
//             description: bookData.description || '',
//             full_title: bookData.full_title || '',
//             series: bookData.series || [],
//             title: bookData.title || '',
//           },
//       publish_info:{
//         publishers:bookData.publisher || [],
//         published_date: bookData.published_date || '',
//         publisher_place: bookData.publisher_place || [],
//       },

//       categories: bookData.categories || [],
//       weight: bookData.weight || null,
//       page_count: bookData.page_count || null,

//       identifiers: bookData.identifiers || {},

//       media:{
//         covers: bookData.covers || null,
//       },
      
//       status: 'available',
//       notes: bookData.notes || '',
//       edition: bookData.edition || '',
      
//       library_info:{
//         openlibrary_url: bookData.openlibrary_url || '',
//         work_key: bookData.work_key || '',
//         library_qr:null,
//         location: bookData.location || libraryCode,
//       },
      
//       stats:{
//         borrow_count: 0,
//         ratings: bookData.ratings || [],
//         average_rating: 0,
//         copy_count: 1, // Initialize copy count
//         available_copies: 1, // Initialize available copies
//       },

//       logs: {
//         created: {
//           created_by: currentUser ? {
//             uid: currentUser.profile.uid,
//             email: currentUser.profile.email,
//             displayName: currentUser.profile.name || ''
//           } : {
//             uid: 'system',
//             email: 'system',
//             displayName: 'System'
//           },
//           created_at: new Date()
//         }
//       }
//     };
    
//     // If book exists, update copy count instead of adding new book
//     if (existingBook) {
//       const bookRef = doc(db, 'Books', existingBook.id);
//       const currentStats = existingBook.stats || {};
//       const currentCopyCount = currentStats.copy_count || 1;
//       const currentAvailableCopies = currentStats.available_copies ||
//         (existingBook.status === 'available' ? 1 : 0);
      
//       // Update the existing book with incremented copy count
//       await updateDoc(bookRef, {
//         stats: {
//           ...currentStats,
//           copy_count: currentCopyCount + 1,
//           available_copies: currentAvailableCopies + 1,
//         },
//         logs: {
//           ...existingBook.logs,
//           copy_added: {
//             added_by: currentUser ? {
//               uid: currentUser.profile.uid,
//               email: currentUser.profile.email,
//               displayName: currentUser.profile.name || ''
//             } : {
//               uid: 'system',
//               email: 'system',
//               displayName: 'System'
//             },
//             added_at: new Date()
//           }
//         }
//       });
      
//       // Return the updated book
//       return {
//         id: existingBook.id,
//         ...existingBook,
//         stats: {
//           ...currentStats,
//           copy_count: currentCopyCount + 1,
//           available_copies: currentAvailableCopies + 1,
//         }
//       };
//     }
    
//     // Add new book to Firestore if no duplicate found
//     const booksRef = collection(db, 'Books');
//     const bookDoc = await addDoc(booksRef, cleanBookData);
    
//     // Save author details to Authors collection if OpenLibrary IDs are available
//     if (cleanBookData.book_info?.authors && Array.isArray(cleanBookData.book_info.authors)) {
//       // Process authors in parallel using Promise.all
//       await Promise.all(
//         cleanBookData.book_info.authors
//           .filter(author => author.openLibrary_id) // Only process authors with OpenLibrary IDs
//           .map(async (author) => {
//             try {
//               await saveAuthorDetails(author.openLibrary_id);
//             } catch (authorError) {
//               // Log error but continue with book creation
//               console.error(`Error saving author ${author.name}:`, authorError);
//             }
//           })
//       );
//     }
    
//     // Generate and save QR code
//     const book_id = bookDoc.id;
//     try {
//       // Generate QR code data for the book
//       // Handle author extraction from the new format with name and openLibrary_id
//       let authorText = '';
//       if (cleanBookData.book_info.authors.length > 0) {
//         if (typeof cleanBookData.book_info.authors[0] === 'object') {
//           // Authors are objects with name property
//           authorText = cleanBookData.book_info.authors.map(author => author.name).join(', ');
//         } else {
//           // Legacy format where authors are strings
//           authorText = cleanBookData.book_info.authors.join(', ');
//         }
//       }
      
//       const qrData = generateQRData(book_id, cleanBookData.book_info.title, authorText, cleanBookData.location);
      
//       // Generate QR code as SVG data URL
//       const qrCodeBase64 = await generateQRAsBase64(qrData);
      
//       // Update the book with QR code
//       await updateDoc(doc(db, 'Books', book_id), {
//         library_info: {
//           ...cleanBookData.library_info,
//           library_qr: qrCodeBase64,
//         },
//         logs: {
//           ...cleanBookData.logs,
//           qr_generated: {
//             generated_by: currentUser ? {
//               uid: currentUser.profile.uid,
//               email: currentUser.profile.email,
//               displayName: currentUser.profile.name || ''
//             } : {
//               uid: 'system',
//               email: 'system',
//               displayName: 'System'
//             },
//             generated_at: new Date()
//           }
//         }
//       });
      
//       // Add QR to the return data
//       cleanBookData.library_info.library_qr = qrCodeBase64;
//     } catch (qrError) {
//       console.error('Error generating QR code during book creation:', qrError);
      
//       // Delete the book document since QR generation failed
//       try {
//         await deleteDoc(doc(db, 'Books', book_id));
//         // console.log('Book document deleted after QR generation failure');
//       } catch (deleteError) {
//         console.error('Error deleting book document after QR generation failure:', deleteError);
//       }
      
//       // Rethrow the error to indicate that book addition failed
//       throw new Error('Failed to add book: QR code generation failed');
//     }
    
//     return { id: bookDoc.id, ...cleanBookData };

//     // return null;
//   } catch (error) {
//     console.error('Error adding book to library:', error);
//     throw error;
//   }
// };

// Helper function to get the appropriate cover image URL from any book structure
export const getBookCoverUrl = (book, size = 'medium') => {
  if (!book) return null;
  
  // Check new nested structure first
  if (book.media?.covers) {
    if (size === 'small') return book.media.covers.cover_small;
    if (size === 'medium') return book.media.covers.cover_medium;
    if (size === 'large') return book.media.covers.cover_large;
    
    // Default to any available size
    return book.media.covers.cover_medium ||
           book.media.covers.cover_small ||
           book.media.covers.cover_large;
  }
  
  // Check legacy structure
  if (book.covers) {
    if (size === 'small') return book.covers.cover_small;
    if (size === 'medium') return book.covers.cover_medium;
    if (size === 'large') return book.covers.cover_large;
    
    // Default to any available size
    return book.covers.cover_medium ||
           book.covers.cover_small ||
           book.covers.cover_large;
  }
  
  // If there's a direct imageUrl property, use that
  return book.imageUrl || null;
};

// Normalize book data to ensure consistent access regardless of data structure
export const normalizeBookData = (book) => {
  // Create a normalized book object
  const normalizedBook = { ...book };
  
  normalizedBook.title = book.book_info?.title || book.title || '';
  
  if (book.book_info?.authors && Array.isArray(book.book_info.authors)) {
    // Check if authors are objects with name property (new format) or just strings (old format)
    if (book.book_info.authors.length > 0 && typeof book.book_info.authors[0] === 'object') {
      normalizedBook.author = book.book_info.authors.map(author => author.name).join(', ');
    } else {
      normalizedBook.author = book.book_info.authors.join(', ');
    }
  } else {
    normalizedBook.author = book.author || '';
  }
  
  // Preserve the original authors data with OpenLibrary IDs
  normalizedBook.authorsData = book.book_info?.authors || [];
  
  normalizedBook.imageUrl = getBookCoverUrl(book);
  
  normalizedBook.description = book.book_info?.description || book.description || '';
  normalizedBook.publisher = book.publish_info.publishers || '',
  normalizedBook.published_date = book.publish_info.published_date || '',
  normalizedBook.publisher_place = book.publish_info.publisher_place || [],
  normalizedBook.categories = book.subjects || book.categories || [];
  // Handle ratings - parse from stats or legacy structure
  if (book.stats?.ratings?.summary?.average) {
    // New structure with stats.ratings
    normalizedBook.average_rating = book.stats.ratings.summary.average;
    normalizedBook.ratings_count = book.stats.ratings.count || 0;
    normalizedBook.ratings_counts = book.stats.ratings.summary.counts || null;
  }
  
  normalizedBook.isbn = book.identifiers?.isbn_13 || book.identifiers?.isbn_10 || book.isbn || '';
  
  // Include copy count and available copies information
  normalizedBook.copy_count = book.stats?.copy_count || 1;
  normalizedBook.available_copies = book.stats?.available_copies || (book.status === 'available' ? 1 : 0);
  
  // console.log('normalizedBook :: ', book.stats?.ratings?.summary)
  return normalizedBook;
};

// Get all books from the library
export const getAllBooks = async () => {
  try {
    const booksRef = collection(db, 'Books');
    const querySnapshot = await getDocs(booksRef);
    
    const books = querySnapshot.docs.map(doc => {
      const bookData = doc.data();
        return normalizeBookData({
          id: doc.id,
          ...bookData
        });
      });

    return {
      length: querySnapshot.size, // Total number of documents
      data: books               // Array of book objects directly
    };
  } catch (error) {
    console.error('Error getting all books:', error);
    throw error;
  }
};

// Get book by ID
export const getBookById = async (book_id) => {
  try {
    const bookRef = doc(db, 'Books', book_id);
    const bookDoc = await getDoc(bookRef);
    
    if (bookDoc.exists()) {
      return normalizeBookData({
        id: bookDoc.id,
        ...bookDoc.data()
      });
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting book by ID:', error);
    throw error;
  }
};

// Update book status
export const updateBookStatus = async (book_id, status) => {
  try {
    const bookRef = doc(db, 'Books', book_id);
    const bookDoc = await getDoc(bookRef);
    
    if (!bookDoc.exists()) {
      throw new Error('Book not found');
    }
    
    const bookData = bookDoc.data();
    const currentStats = bookData.stats || {};
    const copyCount = currentStats.copy_count || 1;
    let availableCopies = currentStats.available_copies || 1;
    
    // Update available copies based on status change
    if (status === 'borrowed' && bookData.status === 'available') {
      // Book is being borrowed, decrease available copies
      availableCopies = Math.max(0, availableCopies - 1);
    } else if (status === 'available' && bookData.status === 'borrowed') {
      // Book is being returned, increase available copies
      availableCopies = Math.min(copyCount, availableCopies + 1);
    }
    
    // Update the book with new status and available copies count
    await updateDoc(bookRef, {
      status,
      stats: {
        ...currentStats,
        available_copies: availableCopies
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error updating book status:', error);
    throw error;
  }
};

// Update book details
export const updateBookDetails = async (book_id, bookData) => {
  try {
    // Get current user
    const { currentUser } = await import('../context/AuthContext').then(module => module.useAuth());
    
    // Get the existing book to preserve logs
    const bookRef = doc(db, 'Books', book_id);
    const bookDoc = await getDoc(bookRef);
    let existingLogs = {};
    
    if (bookDoc.exists()) {
      existingLogs = bookDoc.data().logs || {};
    }
    
    // Prepare update data with new log entry
    const updateData = {
      ...bookData,
      logs: {
        ...existingLogs,
        updated: {
          updated_by: currentUser ? {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || ''
          } : {
            uid: 'system',
            email: 'system',
            displayName: 'System'
          },
          updated_at: new Date()
        }
      }
    };
    
    await updateDoc(bookRef, updateData);
    return true;
  } catch (error) {
    console.error('Error updating book details:', error);
    throw error;
  }
};

// Delete book
export const deleteBook = async (book_id) => {
  try {
    // Get current user
    const { currentUser } = await import('../context/AuthContext').then(module => module.useAuth());
    
    // Get the existing book to preserve logs
    const bookRef = doc(db, 'Books', book_id);
    const bookDoc = await getDoc(bookRef);
    
    if (bookDoc.exists()) {
      // Instead of hard deleting, mark as deleted with log info
      const bookData = bookDoc.data();
      await updateDoc(bookRef, {
        status: 'deleted',
        logs: {
          ...(bookData.logs || {}),
          deleted: {
            deleted_by: currentUser ? {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName || ''
            } : {
              uid: 'system',
              email: 'system',
              displayName: 'System'
            },
            deleted_at: new Date()
          }
        }
      });
    } else {
      // If book doesn't exist, use deleteDoc
      await deleteDoc(bookRef);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting book:', error);
    throw error;
  }
};

// Get books by status
export const getBooksByStatus = async (status) => {
  try {
    const booksRef = collection(db, 'Books');
    const q = query(booksRef, where("status", "==", status));
    const querySnapshot = await getDocs(q);
    
    const books = querySnapshot.docs.map(doc => normalizeBookData({
      id: doc.id,
      ...doc.data()
    }));

    return {
      length: querySnapshot.size,
      data: books
    };
  } catch (error) {
    console.error('Error getting books by status:', error);
    throw error;
  }
};

// Get borrowed books
export const getBorrowedBooks = async () => {
  return getBooksByStatus('borrowed');
};

// Get most borrowed books
export const getMostBorrowedBooks = async (limit = 10) => {
  try {
    const booksRef = collection(db, 'Books');
    const querySnapshot = await getDocs(booksRef);
    
    const books = querySnapshot.docs.map(doc => normalizeBookData({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort by borrow count in descending order
    const sortedBooks = books.sort((a, b) => (
      (b.stats?.borrow_count || b.borrow_count || 0) - (a.stats?.borrow_count || a.borrow_count || 0)
    ));
    
    const limitedBooks = sortedBooks.slice(0, limit);

    return {
      length: querySnapshot.size, // Total before limiting
      data: limitedBooks
    };
  } catch (error) {
    console.error('Error getting most borrowed books:', error);
    throw error;
  }
};

// Get highest rated books
export const getHighestRatedBooks = async (limit = 10) => {
  try {
    const booksRef = collection(db, 'Books');
    const querySnapshot = await getDocs(booksRef);
    
    const books = querySnapshot.docs.map(doc => normalizeBookData({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort by average rating in descending order
    const sortedBooks = books.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
    
    const limitedBooks = sortedBooks.slice(0, limit);

    return {
      length: querySnapshot.size, // Total before limiting
      data: limitedBooks
    };
  } catch (error) {
    console.error('Error getting highest rated books:', error);
    throw error;
  }
};

// Get author details from Firestore
export const getAuthorById = async (openLibraryId) => {
  try {
    if (!openLibraryId) {
      console.warn('No OpenLibrary ID provided');
      return null;
    }
    
    const authorDocRef = doc(db, 'Authors', openLibraryId);
    const authorDoc = await getDoc(authorDocRef);
    
    if (authorDoc.exists()) {
      return {
        id: authorDoc.id,
        ...authorDoc.data()
      };
    } else {
      // If not found in database, try to fetch and save from OpenLibrary
      return await saveAuthorDetails(openLibraryId);
    }
  } catch (error) {
    console.error(`Error getting author ${openLibraryId}:`, error);
    return null;
  }
};

// Fetch Wikipedia URL for an author from Wikidata
const fetchWikipediaUrlFromWikidata = async (wikidataId) => {
  try {
    if (!wikidataId) return null;
    
    // Fetch data from Wikidata API
    const response = await axios.get(`https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`);
    
    // Extract English Wikipedia URL from sitelinks if available
    if (response.data &&
        response.data.entities &&
        response.data.entities[wikidataId] &&
        response.data.entities[wikidataId].sitelinks &&
        response.data.entities[wikidataId].sitelinks.enwiki) {
      
      return `https://en.wikipedia.org/wiki/${response.data.entities[wikidataId].sitelinks.enwiki.title.replace(/ /g, '_')}`;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching Wikipedia URL for ${wikidataId}:`, error);
    return null;
  }
};

// Fetch and save author details from OpenLibrary
export const saveAuthorDetails = async (openLibraryId) => {
  try {
    if (!openLibraryId) {
      console.warn('No OpenLibrary ID provided for author');
      return null;
    }
    
    // Check if the author already exists in Firestore
    const authorDocRef = doc(db, 'Authors', openLibraryId);
    const authorDoc = await getDoc(authorDocRef);
    
    // If author already exists, return the existing data
    if (authorDoc.exists()) {
      console.log(`Author ${openLibraryId} already exists in database`);
      return {
        id: authorDoc.id,
        ...authorDoc.data()
      };
    }
    
    // Fetch author details from OpenLibrary
    const response = await axios.get(`https://openlibrary.org/authors/${openLibraryId}.json`);
    const authorData = response.data;
    
    // Transform author data for Firestore
    // Process photo IDs into structured photo data with URLs
    const photoCovers = (authorData.photos || []).map(photoId => ({
      id: photoId,
      urls: {
        small: `${OPEN_LIBRARY_AUTHOR_COVERS_URL}${photoId}-S.jpg`,
        medium: `${OPEN_LIBRARY_AUTHOR_COVERS_URL}${photoId}-M.jpg`,
        large: `${OPEN_LIBRARY_AUTHOR_COVERS_URL}${photoId}-L.jpg`
      }
    }));

    // Check for Wikidata ID in remote_ids
    let wikidataId = null;
    let wikipediaUrl = null;
    
    if (authorData.remote_ids && authorData.remote_ids.wikidata) {
      wikidataId = authorData.remote_ids.wikidata;
      
      // Fetch Wikipedia URL from Wikidata
      wikipediaUrl = await fetchWikipediaUrlFromWikidata(wikidataId);
    }

    const cleanAuthorData = {
      name: authorData.name || '',
      birth_date: authorData.birth_date || '',
      death_date: authorData.death_date || '',
      bio: authorData.bio?.value || authorData.bio || '',
      wikipedia: wikipediaUrl || '',
      personal_name: authorData.personal_name || '',
      alternate_names: authorData.alternate_names || [],
      // Keep the original photo IDs for reference
      photo_ids: authorData.photos || [],
      // Add the structured photo covers with URLs
      photo_covers: photoCovers,
      links: authorData.links || [],
      remote_ids: authorData.remote_ids || {},
      wikidata_id: wikidataId,  // Store Wikidata ID separately for convenience
      openLibrary_id: openLibraryId,
      openLibrary_key: authorData.key || '',
      openLibrary_revision: authorData.revision || '',
      last_updated: new Date(),
    };
    
    // Save author to Firestore using OpenLibrary ID as document ID
    await setDoc(authorDocRef, cleanAuthorData);
    
    console.log(`Author ${openLibraryId} saved to database`);
    return {
      id: openLibraryId,
      ...cleanAuthorData
    };
  } catch (error) {
    console.error(`Error saving author ${openLibraryId}:`, error);
    // Return null on error but don't throw, so book creation can continue
    return null;
  }
};

// Get all authors from Firestore
export const getAllAuthors = async () => {
  try {
    const authorsRef = collection(db, 'Authors');
    const querySnapshot = await getDocs(authorsRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting all authors:', error);
    return [];
  }
};