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
} from 'react-native';
import { TextInput, Button, Divider, Chip, HelperText } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { uploadBook } from '../../services/bookService';
import { generateLibraryCode, explainLibraryCode } from '../../utils/libraryCodeGenerator';

const AddBookForm = ({ 
  loading = false,
  initialBookData = null, 
  handleAddBook = () => {}, 
}) => {
  const [bookAdded, setBookAdded] = useState(false);
  const [authorChips, setAuthorChips] = useState([]);
  const [categoryChips, setCategoryChips] = useState([]);
  const [newAuthor, setNewAuthor] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [libraryCodeExplanation, setLibraryCodeExplanation] = useState('');
  
  const formikRef = useRef(null);

  // Initialize form and chips from initialBookData
  useEffect(() => {
    if (initialBookData && formikRef.current) {
      const { setValues, setFieldValue } = formikRef.current;

      setValues({
        title: initialBookData.title || '',
        full_title: initialBookData.full_title || '',
        author: initialBookData.author || '',
        authorsData: initialBookData.authorsData || [],
        isbn: initialBookData.isbn || initialBookData.identifiers?.isbn_13 || '',
        publisher: Array.isArray(initialBookData.publisher) ? initialBookData.publisher[0] || '' : initialBookData.publisher || '',
        published_date: initialBookData.published_date || '',
        publisher_place: initialBookData.publisher_place || [],
        description: initialBookData.description || '',
        page_count: initialBookData.page_count || null,
        categories: Array.isArray(initialBookData.categories) ? initialBookData.categories.join(', ') : initialBookData.categories || '',
        location: initialBookData.location || '',
        weight: initialBookData.weight || null,
        identifiers: initialBookData.identifiers || {},
        image_url: initialBookData.image_url || null,
        covers: initialBookData.covers || null,
        notes: initialBookData.notes || '',
        edition: initialBookData.edition || '',
        openlibrary_url: initialBookData.openlibrary_url || '',
        work_key: initialBookData.work_key || '',
        series: initialBookData.series || [],
        ratings: initialBookData.ratings || [],
      });

      if (initialBookData.author) {
        const authors = typeof initialBookData.author === 'string'
          ? initialBookData.author.split(',').map(a => a.trim())
          : Array.isArray(initialBookData.author) ? initialBookData.author : [];
        setAuthorChips(authors);
      } else {
        setAuthorChips([]);
      }

      if (initialBookData.categories) {
        const categories = Array.isArray(initialBookData.categories)
          ? initialBookData.categories
          : typeof initialBookData.categories === 'string'
            ? initialBookData.categories.split(',').map(c => c.trim())
            : [];
        setCategoryChips(categories);
      } else {
        setCategoryChips([]);
      }

      const tempBookData = {
        ...initialBookData,
        categories: initialBookData.categories || [],
      };
      const libraryCode = generateLibraryCode(tempBookData);
      setFieldValue('location', libraryCode);
      const explanation = explainLibraryCode(libraryCode);
      setLibraryCodeExplanation(explanation.explanation || '');
    }
  }, [initialBookData]);

  // Validation schema
  const BookSchema = Yup.object().shape({
    title: Yup.string().required('Title is required'),
    full_title: Yup.string().nullable(),
    author: Yup.string().required('Author is required'),
    authorsData: Yup.array().nullable(),
    isbn: Yup.string(),
    publisher: Yup.string(),
    published_date: Yup.string(),
    publisher_place: Yup.array().of(Yup.string()),
    description: Yup.string(),
    page_count: Yup.number().integer().positive().nullable(),
    categories: Yup.string(),
    location: Yup.string(),
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

  // Function to generate and update library code
  const updateLibraryCode = (values, setFieldValue) => {
    if (!values.title || !values.author) return;
    
    const copyNumber = 1;
    const tempBookData = {
      ...values,
      categories: values.categories ? values.categories.split(',').map(cat => cat.trim()) : [],
    };
    
    const libraryCode = generateLibraryCode(tempBookData, copyNumber);
    setFieldValue('location', libraryCode);
    
    const explanation = explainLibraryCode(libraryCode);
    setLibraryCodeExplanation(explanation.explanation || '');
  };

  useEffect(() => {
    if (formikRef.current) {
      const { values, setFieldValue } = formikRef.current;
      updateLibraryCode(values, setFieldValue);
    }
  }, [authorChips, categoryChips]);

  // Helper functions for chips
  const addAuthorChip = (author, setFieldValue) => {
    if (author && author.trim()) {
      const newChips = [...authorChips, author.trim()];
      setAuthorChips(newChips);
      setFieldValue('author', newChips.join(', '));
      
      const currentAuthorsData = formikRef.current?.values.authorsData || [];
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
    
    const currentAuthorsData = formikRef.current?.values.authorsData || [];
    const newAuthorsData = currentAuthorsData.filter(author => author.name !== removedAuthor);
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

  return (
 
    <View  contentContainerStyle={styles.scrollContainer}>
      <Formik
        initialValues={{
          title: '',
          full_title: '',
          author: '',
          authorsData: [],
          isbn: '',
          publisher: '',
          published_date: '',
          publisher_place: [],
          description: '',
          page_count: null,
          categories: '',
          location: '',
          weight: null,
          identifiers: {},
          image_url: null,
          covers: null,
          notes: '',
          edition: '',
          openlibrary_url: '',
          work_key: '',
          series: [],
          ratings: [],
        }}
        validationSchema={BookSchema}
        onSubmit={handleAddBook}
        innerRef={formikRef}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
          <View style={styles.formContainer}>
            <TextInput
              label="ISBN"
              value={values.isbn}
              onChangeText={handleChange('isbn')}
              onBlur={handleBlur('isbn')}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
              left={<TextInput.Icon icon="barcode" />}
            />
            
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
                  placeholder="Add author (press Enter to add)"
                  value={newAuthor}
                  onChangeText={setNewAuthor}
                  onSubmitEditing={() => addAuthorChip(newAuthor, setFieldValue)}
                  style={styles.chipInput}
                  mode="outlined"
                />
              </View>
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
                  placeholder="Add category (press Enter to add)"
                  value={newCategory}
                  onChangeText={setNewCategory}
                  onSubmitEditing={() => addCategoryChip(newCategory, setFieldValue)}
                  style={styles.chipInput}
                  mode="outlined"
                />
              </View>
            </View>
            
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
              Add Book
            </Button>
          </View>
        )}
      </Formik>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    padding: 20,
  },
  formContainer: {
    width: '100%',
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
  libraryCodeContainer: {
    marginBottom: 15,
  },
  libraryCodeHelperText: {
    marginTop: 5,
    fontSize: 12,
  },
});

export default AddBookForm;