/**
 * Library Code Generator
 * 
 * Examines book categories to determine primary themes and generates a library code in the format:
 * THEME-AUTHOR-NNNN-C
 * 
 * Where:
 * - THEME: Main theme/category code (determined by AI analysis of categories)
 * - AUTHOR: First initial + 2 letters of last name (e.g., JRO for J.K. Rowling)
 * - NNNN: Last 4 digits of ISBN
 * - C: Copy number
 */

// Main genre/theme category mappings
export const GENRE_MAPPINGS = {
  // Broad Fiction Categories
  'Fiction': 'FIC', 
  'Fantasy': 'FAN', 
  'Science Fiction': 'SF', 
  'Mystery': 'MYS', 
  'Romance': 'ROM', 
  'Romance Fantasy': 'ROF', 
  'Historical Fiction': 'HIS',
  'Young Adult': 'YA', 
  'Horror': 'HOR',
  'Adventure': 'ADV',
  'Children\'s': 'KID', 

  // Broad Non-Fiction Categories
  'Biography': 'BIO',
  'History': 'HST',
  'Science': 'SCI', 
  'Philosophy': 'PHI',
  'Self-Help': 'SLF',
  'Business': 'BUS',
  'Art': 'ART',
  'Education': 'EDU',
  'Health': 'HLT', 
  'Smut': 'SMU',

  'General': 'GEN'
};

/**
 * Analyze categories to determine the main theme
 * 
 * Uses a simple approach to find the most relevant category:
 * 1. Look for exact matches in our mappings
 * 2. Look for partial matches in our mappings
 * 3. If multiple matches, prioritize based on specificity
 * 4. Default to 'GEN' if no good match found
 * 
 * @param {Array} categories - Array of book categories/genres
 * @returns {String} - 3-letter theme code
 */
export const analyzeCategories = (categories) => {
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    return 'GEN';
  }
  
  // Create a scoring system for categories
  const categoryScores = {};
  
  // First pass: look for exact matches
  for (const category of categories) {
    if (GENRE_MAPPINGS[category]) {
      categoryScores[category] = (categoryScores[category] || 0) + 10; // High score for exact match
    }
  }
  
  // Second pass: look for partial matches
  for (const category of categories) {
    for (const [key, value] of Object.entries(GENRE_MAPPINGS)) {
      if (category.includes(key) || key.includes(category)) {
        categoryScores[key] = (categoryScores[key] || 0) + 5; // Medium score for partial match
      }
    }
  }
  
  // If we have scores, use the highest scored category
  if (Object.keys(categoryScores).length > 0) {
    const topCategory = Object.entries(categoryScores).sort((a, b) => b[1] - a[1])[0][0];
    return GENRE_MAPPINGS[topCategory] || 'GEN';
  }
  
  // If still no matches, use the first category's first 3 letters
  const firstCategory = categories[0];
  return firstCategory && firstCategory.length >= 3 
    ? firstCategory.substring(0, 3).toUpperCase() 
    : 'GEN';
};

/**
 * Extract author code from author name
 * Uses first initial + first 2 letters of the last name
 * This helps differentiate between authors with the same last name
 *
 * @param {String} author - Author's full name
 * @returns {String} - 3-letter author code
 */
const getAuthorCode = (author) => {
  if (!author) {
    return 'XXX';
  }
  
  // Extract name parts
  const nameParts = author.split(' ');
  
  if (nameParts.length === 1) {
    // Only one name provided
    return author.substring(0, 3).toUpperCase();
  }
  
  // Get first initial and last name
  const firstName = nameParts[0];
  const lastName = nameParts[nameParts.length - 1];
  
  // Use first initial + first 2 letters of last name
  const firstInitial = firstName.charAt(0);
  const lastNamePrefix = lastName.substring(0, 2);
  
  return (firstInitial + lastNamePrefix).toUpperCase();
};

/**
 * Extract the last 4 digits of ISBN
 * 
 * @param {String} isbn - Book ISBN
 * @returns {String} - Last 4 digits or placeholder
 */
const getIsbnDigits = (isbn) => {
  if (!isbn) {
    return '0000';
  }
  
  // Clean ISBN (remove hyphens and spaces)
  const cleanIsbn = isbn.replace(/[-\s]/g, '');
  
  // Get last 4 digits
  return cleanIsbn.length >= 4 
    ? cleanIsbn.slice(-4) 
    : cleanIsbn.padStart(4, '0');
};

/**
 * Generate library code for a book
 * 
 * @param {Object} bookData - Book data object
 * @param {Number} copyNumber - Copy number (defaults to 1)
 * @returns {String} - Library code in format THEME-AUTHOR-NNNN-C
 */
export const generateLibraryCode = (bookData, copyNumber = 1) => {
  // Extract required information
  const categories = bookData.categories || [];
  const author = bookData.author || 
               (bookData.book_info && bookData.book_info.authors ? 
                bookData.book_info.authors[0] : '');
  const isbn = bookData.isbn || 
             (bookData.identifiers ? 
              (bookData.identifiers.isbn_13 || bookData.identifiers.isbn_10) : '');
  
  // Generate code components
  const themeCode = analyzeCategories(categories);
  const authorCode = getAuthorCode(author);
  const isbnDigits = getIsbnDigits(isbn);
  
  // Format copy number as 3 digits with leading zeros
  const formattedCopyNumber = String(copyNumber).padStart(3, '0');
  
  // Combine into final code
  return `${themeCode}-${authorCode}-${isbnDigits}-${formattedCopyNumber}`;
};

/**
 * Explain the meaning of a library code
 * 
 * @param {String} code - Library code
 * @returns {Object} - Explanation of code parts
 */
export const explainLibraryCode = (code) => {
  if (!code || typeof code !== 'string') {
    return { error: 'Invalid code' };
  }
  
  const parts = code.split('-');
  if (parts.length !== 4) {
    return { error: 'Invalid code format' };
  }
  
  const [themeCode, authorCode, isbnDigits, copyNumber] = parts;
  
  // Find theme name by code
  let themeName = 'Unknown';
  for (const [key, value] of Object.entries(GENRE_MAPPINGS)) {
    if (value === themeCode) {
      themeName = key;
      break;
    }
  }
  
  return {
    themeCode,
    themeName,
    authorCode,
    isbnDigits,
    copyNumber,
    explanation: `${themeName} section (${themeCode}), Author code "${authorCode}", ISBN ending in "${isbnDigits}", Copy #${String(copyNumber).padStart(3, '0')}`
  };
};