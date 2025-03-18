import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
  ActivityIndicator
} from 'react-native';
import LoadingOverlay from '../../components/LoadingOverlay';
import { TextInput, Button, Divider, Chip, IconButton, HelperText } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Formik } from 'formik';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import * as Yup from 'yup';
import { getBookByIdentifier, uploadBook } from '../../services/bookService';
import { generateLibraryCode, explainLibraryCode } from '../../utils/libraryCodeGenerator';

const AddBookScreen = ({ navigation, route }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [bookAdded, setBookAdded] = useState(false);
  const [authorChips, setAuthorChips] = useState([]);
  const [categoryChips, setCategoryChips] = useState([]);
  const [newAuthor, setNewAuthor] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [libraryCodeExplanation, setLibraryCodeExplanation] = useState('');
  
  const isbn = route.params?.isbn || '';
  const isbnSearched = route.params?.isbnSearched || false;
  const initialBookData = route.params?.bookData || null;
  
  const formikRef = useRef(null);
  
  useFocusEffect(
    React.useCallback(() => {
      const onBlur = () => {
        // navigation.setParams({ isbn: undefined, isbnSearched: undefined });
        
        if (formikRef.current) {
          const { resetForm } = formikRef.current;
          resetForm();
          setAuthorChips([]);
          setCategoryChips([]);
          setNewAuthor('');
          setNewCategory('');
        }
      };
      
      const unsubscribe = navigation.addListener('blur', onBlur);
      return unsubscribe;
    }, [navigation])
  );
  
  // Initialize chips from initial data if available
  useEffect(() => {
    if (initialBookData) {
      if (initialBookData.author) {
        const authors = typeof initialBookData.author === 'string'
          ? initialBookData.author.split(',').map(a => a.trim())
          : Array.isArray(initialBookData.author) ? initialBookData.author : [];
        setAuthorChips(authors);
      }
      
      if (initialBookData.categories) {
        const categories = Array.isArray(initialBookData.categories)
          ? initialBookData.categories
          : typeof initialBookData.categories === 'string'
            ? initialBookData.categories.split(',').map(c => c.trim())
            : [];
        setCategoryChips(categories);
      }
    }
  }, [initialBookData]);

  // Auto-search by ISBN if provided through route params
  useEffect(() => {
    // If we have an ISBN and formik is initialized
    if (isbn && isbn.trim() !== '' && formikRef.current) {
      const { setFieldValue } = formikRef.current;
      // Set the ISBN value in the form first
      setFieldValue('isbn', isbn);
      // Trigger ISBN search automatically
      handleSearchISBN(isbn, setFieldValue);
    }
  }, [isbn]);

  // Validation schema
  const BookSchema = Yup.object().shape({
    title: Yup.string().required('Title is required'),
    full_title: Yup.string().nullable(),
    author: Yup.string().required('Author is required'),
    authorsData: Yup.array().nullable(), // Add authorsData validation
    isbn: Yup.string(),
    publisher: Yup.string(),
    published_date: Yup.string(),
    publisher_place: Yup.array().of(Yup.string()),
    description: Yup.string(),
    page_count: Yup.number().integer().positive().nullable(),
    categories: Yup.string(),
    location: Yup.string(), // Library code field
    weight: Yup.string().nullable(),
    identifiers: Yup.object().nullable(),
    image_url: Yup.string().url().nullable(),
    covers: Yup.object().shape({
      cover_small: Yup.string().nullable(),
      cover_medium: Yup.string().nullable(),
      cover_large: Yup.string().nullable(),
    }).nullable(),
    ratings: Yup.mixed().nullable(),
    notes: Yup.string(),
    edition: Yup.string(),
    openlibrary_url: Yup.string().url().nullable(),
    work_key: Yup.string().nullable(),
    series: Yup.array().of(Yup.string()),
  });
  
  // Function to generate and update library code based on current form values
  const updateLibraryCode = (values, setFieldValue) => {
    if (!values.title || !values.author) {
      return; // Not enough information yet
    }
    
    // Determine copy number, defaulting to 1 for new books
    const copyNumber = 1;
    
    const tempBookData = {
      ...values,
      categories: values.categories ? values.categories.split(',').map(cat => cat.trim()) : [],
    };
    
    const libraryCode = generateLibraryCode(tempBookData, copyNumber);
    setFieldValue('location', libraryCode);
    
    // Get explanation for the generated code
    const explanation = explainLibraryCode(libraryCode);
    setLibraryCodeExplanation(explanation.explanation || '');
  };

  // Auto-generate library code whenever relevant data changes
  useEffect(() => {
    if (formikRef.current) {
      const { values, setFieldValue } = formikRef.current;
      updateLibraryCode(values, setFieldValue);
    }
  }, [authorChips, categoryChips]); // Depends on changes to authors and categories
  
  // Handle scan book button
  const handleScanBook = () => {
    navigation.navigate('ScanBook', { returnToAddBook: true });
  };
  
  // Handle form submission
  const handleAddBook = async (values) => {
    try {
      setLoading(true);
      
      // Process categories to array if provided as comma-separated string
      let processedValues = { ...values };
      if (values.categories && typeof values.categories === 'string') {
        processedValues.categories = values.categories.split(',').map(cat => cat.trim());
      }

      // Log the values to debug, specifically checking authorsData
      console.log('values ::: ', processedValues);
      console.log('authorsData ::: ', processedValues.authorsData);
      
      // Add the book to the library
      const result = await uploadBook(processedValues, currentUser);
      setBookAdded(true);
      
      // Check if this was a new book or an existing book with copy count incremented
      const isDuplicate = result && result.stats && result.stats.copy_count > 1;
      
      if (isDuplicate) {
        // Book already exists, copy count was incremented
        Alert.alert(
          'Duplicate Book Detected',
          `"${values.title}" already exists in the library. Copy count increased to ${result.stats.copy_count}. Available copies: ${result.stats.available_copies}.`,
          [
            { text: 'Add Another Book', onPress: () => navigation.replace('AddBook') },
            { text: 'View Books', onPress: () => navigation.navigate('BookList') }
          ]
        );
      } else {
        // New book was added
        Alert.alert(
          'Success',
          `"${values.title}" has been added to the library`,
          [
            { text: 'Add Another Book', onPress: () => navigation.replace('AddBook') },
            { text: 'View Books', onPress: () => navigation.navigate('BookList') }
          ]
        );
      }
    } catch (error) {
      console.error('Error adding book:', error);
      Alert.alert('Error', 'Failed to add the book to the library');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper functions for chips
  const addAuthorChip = (author, setFieldValue) => {
    if (author && author.trim()) {
      const newChips = [...authorChips, author.trim()];
      setAuthorChips(newChips);
      setFieldValue('author', newChips.join(', '));
      
      // Get current authorsData and update it
      const currentAuthorsData = formikRef.current?.values.authorsData || [];
      // Add the new author with empty openLibrary_id for manually added authors
      const newAuthorsData = [...currentAuthorsData, { name: author.trim(), openLibrary_id: '' }];
      setFieldValue('authorsData', newAuthorsData);
      
      setNewAuthor('');
    }
  };
  
  const removeAuthorChip = (index, setFieldValue) => {
    const newChips = [...authorChips];
    const removedAuthor = newChips[index];
    newChips.splice(index, 1);
    setAuthorChips(newChips);
    setFieldValue('author', newChips.join(', '));
    
    // Also remove the author from authorsData
    const currentAuthorsData = formikRef.current?.values.authorsData || [];
    const newAuthorsData = currentAuthorsData.filter(author =>
      author.name !== removedAuthor
    );
    setFieldValue('authorsData', newAuthorsData);
  };
  
  const addCategoryChip = (category, setFieldValue) => {
    if (category && category.trim()) {
      const newChips = [...categoryChips, category.trim()];
      setCategoryChips(newChips);
      setFieldValue('categories', newChips.join(', '));
      setNewCategory('');
    }
  };
  
  const removeCategoryChip = (index, setFieldValue) => {
    const newChips = [...categoryChips];
    newChips.splice(index, 1);
    setCategoryChips(newChips);
    setFieldValue('categories', newChips.join(', '));
  };
  
  // Handle search by ISBN
  const handleSearchISBN = async (isbn, setFieldValue) => {
    if (!isbn) {
      Alert.alert('Error', 'Please enter an ISBN');
      return;
    }
    
    try {
      setLoading(true);
      // Get book data using the service
      const book = await getBookByIdentifier('isbn', isbn);
      
      if (book) {
        // Set form field values from processed book data
        setFieldValue('title', book.title || '');
        setFieldValue('full_title', book.full_title || '');
        
        // Store the authorsData with OpenLibrary IDs from OpenLibrary
        setFieldValue('authorsData', book.authorsData || []);
        
        // Handle authors for chips display
        if (book.author) {
          const authorList = book.author.split(',').map(a => a.trim());
          setAuthorChips(authorList);
          setFieldValue('author', book.author);
        } else {
          setAuthorChips([]);
          setFieldValue('author', '');
        }
        
        // Set publisher
        if (book.publisher) {
          if (Array.isArray(book.publisher)) {
            setFieldValue('publisher', book.publisher[0] || '');
          } else {
            setFieldValue('publisher', book.publisher);
          }
        } else {
          setFieldValue('publisher', '');
        }

        // Set other fields
        setFieldValue('ratings', book.ratings || []);
        setFieldValue('publisher_place', book.publisher_place || []);
        setFieldValue('published_date', book.published_date || '');
        setFieldValue('description', book.description || '');
        setFieldValue('page_count', book.page_count || null);
        
        // Handle categories for chip display
        if (book.categories && Array.isArray(book.categories)) {
          setCategoryChips(book.categories);
          setFieldValue('categories', book.categories.join(', '));
        } else {
          setCategoryChips([]);
          setFieldValue('categories', '');
        }
        
        // Handle cover image - should now be already processed as image_url
        setFieldValue('image_url', book.image_url || null);
        
        // Set remaining fields
        setFieldValue('weight', book.weight || null);
        setFieldValue('identifiers', book.identifiers || {});
        setFieldValue('covers', book.covers || null);
        setFieldValue('openlibrary_url', book.openlibrary_url || '');
        setFieldValue('work_key', book.work_key || '');
        setFieldValue('series', book.series || []);
        
        // Auto-generate library code for the book
        const tempBookData = {
          ...book,
          categories: book.categories || []
        };
        const libraryCode = generateLibraryCode(tempBookData);
        setFieldValue('location', libraryCode);
        
        // Get explanation for the generated code
        const explanation = explainLibraryCode(libraryCode);
        setLibraryCodeExplanation(explanation.explanation || '');
        
        Alert.alert('Success', 'Book details retrieved successfully from OpenLibrary');
      } else {
        Alert.alert('Not Found', 'No book found with this ISBN in OpenLibrary');
      }
    } catch (error) {
      console.error('Error searching book by ISBN:', error);
      Alert.alert('Error', 'Failed to search for the book');
    } finally {
      setLoading(false);
    }
  };
  
  // Add our loading overlay component
  const loadingMessage = () => {
    if (bookAdded) return "Adding book to library...";
    if (loading && isbn && isbn.trim() !== '' && !isbnSearched) return "Searching for book...";
   
    return "Searching for book...";
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Add our centralized loading overlay */}
      <LoadingOverlay visible={loading} message={loadingMessage()} />
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          {/* <Text style={styles.headerTitle}>Add New Book</Text> */}
          {!isbnSearched && (
            <Button
            mode="contained"
            icon="barcode-scan"
            onPress={handleScanBook}
            style={styles.scanButton}
            labelStyle={styles.scanButtonLabel}
            >
              Scan Book
            </Button>
          )}
        </View>
        
        <Formik
          initialValues={{
            title: initialBookData?.title || '',
            full_title: initialBookData?.full_title || '',
            author: initialBookData?.author || '',
            authorsData: initialBookData?.authorsData || [], // Add authorsData field
            isbn: isbn || initialBookData?.isbn || '',
            publisher: initialBookData?.publisher || '',
            published_date: initialBookData?.published_date || '',
            publisher_place: initialBookData?.publisher_place || [],
            description: initialBookData?.description || '',
            page_count: initialBookData?.page_count || null,
            categories: initialBookData?.categories ? initialBookData.categories.join(', ') : '',
            location: initialBookData?.location || '',
            weight: initialBookData?.weight || null,
            identifiers: initialBookData?.identifiers || {},
            image_url: initialBookData?.image_url || null,
            covers: initialBookData?.covers || null,
            notes: initialBookData?.notes || '',
            edition: initialBookData?.edition || '',
            openlibrary_url: initialBookData?.openlibrary_url || '',
            work_key: initialBookData?.work_key || '',
            series: initialBookData?.series || [],
            ratings: initialBookData?.ratings || [],
          }}
          validationSchema={BookSchema}
          onSubmit={handleAddBook}
          innerRef={formikRef}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
            <View style={styles.formContainer}>
              {/* ISBN search field */}
              <View style={styles.isbnSearchContainer}>
                <TextInput
                  label="ISBN / Barcode"
                  value={values.isbn}
                  onChangeText={handleChange('isbn')}
                  onBlur={handleBlur('isbn')}
                  mode="outlined"
                  style={isbnSearched ? styles.isbnInputFull : styles.isbnInput}
                  keyboardType="numeric"
                  left={<TextInput.Icon icon="barcode" />}
                />
                {!isbnSearched && (
                  <Button
                    mode="contained"
                    onPress={() => handleSearchISBN(values.isbn, setFieldValue)}
                    loading={loading}
                    disabled={loading}
                    style={styles.searchButton}
                  >
                    Search
                  </Button>
                )}
              </View>
              
              {/* Book details form */}
              <TextInput
                label="Title *"
                value={values.title}
                onChangeText={handleChange('title')}
                onBlur={handleBlur('title')}
                mode="outlined"
                style={styles.input}
                error={touched.title && errors.title}
              />
              {touched.title && errors.title && (
                <Text style={styles.errorText}>{errors.title}</Text>
              )}
              
              <Divider style={styles.divider} />
              
              {/* Book cover preview */}
              {values.image_url ? (
                <View style={styles.coverPreviewContainer}>
                  <Image
                    source={{ uri: values.image_url }}
                    style={styles.coverImage}
                    resizeMode="contain"
                  />
                  <Button
                    icon="close"
                    mode="text"
                    onPress={() => setFieldValue('image_url', null)}
                    style={styles.removeCoverButton}
                  >
                    Remove
                  </Button>
                </View>
              ) : (
                <View style={styles.noCoverContainer}>
                  <MaterialCommunityIcons name="book-open-page-variant" size={64} color="#DDDDDD" />
                  <Text style={styles.noCoverText}>No cover image</Text>
                </View>
              )}
              
              {/* Author Chips */}
              <View style={styles.chipSection}>
                <Text style={styles.chipSectionTitle}>Authors *</Text>
                <ScrollView horizontal style={styles.chipScrollView}>
                  {authorChips.map((author, index) => (
                    <Chip
                      key={`author-${index}`}
                      onClose={() => removeAuthorChip(index, setFieldValue)}
                      style={styles.chip}
                      mode="outlined"
                    >
                      {author}
                    </Chip>
                  ))}
                </ScrollView>
                <View style={styles.chipInputRow}>
                  <TextInput
                    placeholder="Add author"
                    value={newAuthor}
                    onChangeText={setNewAuthor}
                    style={styles.chipInput}
                    mode="outlined"
                    right={
                      <TextInput.Icon
                        icon="plus"
                        onPress={() => addAuthorChip(newAuthor, setFieldValue)}
                      />
                    }
                  />
                </View>
                {/* Hidden input for Formik validation */}
                <TextInput
                  value={values.author}
                  onChangeText={handleChange('author')}
                  style={{ display: 'none' }}
                  error={touched.author && errors.author}
                />
                {touched.author && errors.author && (
                  <Text style={styles.errorText}>{errors.author}</Text>
                )}
              </View>
              
              <TextInput
                label="Publisher"
                value={values.publisher}
                onChangeText={handleChange('publisher')}
                onBlur={handleBlur('publisher')}
                mode="outlined"
                style={styles.input}
              />
              
              <TextInput
                label="Published Date"
                value={values.published_date}
                onChangeText={handleChange('published_date')}
                onBlur={handleBlur('published_date')}
                mode="outlined"
                style={styles.input}
              />
              
              {/* Categories Chips */}
              <View style={styles.chipSection}>
                <Text style={styles.chipSectionTitle}>Categories</Text>
                <ScrollView horizontal style={styles.chipScrollView}>
                  {categoryChips.map((category, index) => (
                    <Chip
                      key={`category-${index}`}
                      onClose={() => removeCategoryChip(index, setFieldValue)}
                      style={styles.chip}
                      mode="outlined"
                    >
                      {category}
                    </Chip>
                  ))}
                </ScrollView>
                <View style={styles.chipInputRow}>
                  <TextInput
                    placeholder="Add category"
                    value={newCategory}
                    onChangeText={setNewCategory}
                    style={styles.chipInput}
                    mode="outlined"
                    right={
                      <TextInput.Icon
                        icon="plus"
                        onPress={() => addCategoryChip(newCategory, setFieldValue)}
                      />
                    }
                  />
                </View>
                {/* Hidden input for Formik */}
                <TextInput
                  value={values.categories}
                  onChangeText={handleChange('categories')}
                  style={{ display: 'none' }}
                />
              </View>
              
              {/* Library Code Field */}
              <View style={styles.libraryCodeContainer}>
                <Text style={styles.chipSectionTitle}>Library Code</Text>
                <TextInput
                  label="Location Code"
                  value={values.location}
                  onChangeText={handleChange('location')}
                  onBlur={handleBlur('location')}
                  mode="outlined"
                  style={styles.input}
                  placeholder="THEME-AUT-1234-001"
                  right={<TextInput.Icon icon="bookshelf" />}
                />
                {values.location ? (
                  <HelperText type="info" style={styles.libraryCodeHelperText}>
                    {libraryCodeExplanation.replace('Author code', `Author (${values.author})`)}
                  </HelperText>
                ) : (
                  <HelperText type="info" style={styles.libraryCodeHelperText}>
                    Location code is automatically generated based on genre, author, ISBN, and copy number
                  </HelperText>
                )}
              </View>
              
              <TextInput
                label="Description"
                value={values.description}
                onChangeText={handleChange('description')}
                onBlur={handleBlur('description')}
                mode="outlined"
                style={styles.textArea}
                multiline
                numberOfLines={4}
              />
              
              <TextInput
                label="Notes"
                value={values.notes}
                onChangeText={handleChange('notes')}
                onBlur={handleBlur('notes')}
                mode="outlined"
                style={styles.textArea}
                multiline
                numberOfLines={3}
              />
              
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.submitButton}
                loading={loading}
                disabled={loading}
              >
                Add Book to Library
              </Button>
            </View>
          )}
        </Formik>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  scanButton: {
    width: '100%',
    backgroundColor: '#4A90E2',
  },
  scanButtonLabel: {
    fontSize: 12,
  },
  formContainer: {
    width: '100%',
  },
  isbnSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  isbnInput: {
    flex: 1,
    marginRight: 10,
  },
  isbnInputFull: {
    width: '100%',
  },
  searchButton: {
    backgroundColor: '#4A90E2',
  },
  divider: {
    marginVertical: 15,
  },
  coverPreviewContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  coverImage: {
    width: 120,
    height: 180,
    marginBottom: 10,
    borderRadius: 4,
    backgroundColor: '#F0F0F0',
  },
  removeCoverButton: {
    marginVertical: 5,
  },
  noCoverContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    marginBottom: 20,
  },
  noCoverText: {
    marginTop: 10,
    color: '#999999',
    fontSize: 14,
  },
  input: {
    marginBottom: 15,
  },
  textArea: {
    marginBottom: 15,
    height: 100,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 5,
  },
  submitButton: {
    marginTop: 10,
    marginBottom: 30,
    padding: 5,
    backgroundColor: '#4A90E2',
  },
  // Chip section styles
  chipSection: {
    marginBottom: 15,
  },
  chipSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333333',
  },
  chipScrollView: {
    flexDirection: 'row',
    marginBottom: 10,
    maxHeight: 45,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
  },
  chipInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipInput: {
    flex: 1,
    marginBottom: 10,
  },
  // Library code styles
  libraryCodeContainer: {
    marginBottom: 15,
  },
  libraryCodeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  libraryCodeInput: {
    flex: 1,
    marginRight: 10,
  },
  generateCodeButton: {
    backgroundColor: '#4A90E2',
  },
  libraryCodeHelperText: {
    marginTop: 5,
    fontSize: 12,
  },
  // Removed redundant loading styles since we now use the LoadingOverlay component
});

export default AddBookScreen;