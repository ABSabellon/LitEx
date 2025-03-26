import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Alert
} from 'react-native';
import { Button, TextInput, Divider, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { generateLibraryCode, explainLibraryCode } from '../../utils/libraryCodeGenerator';
import InputForm from './InputForm';

const AddBookForm = ({ 
  loading = false,
  initialBookData = null, 
  handleAddBook = () => {}, 
}) => {
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
    <View className="mt-5 flex-1 bg-white">
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
          <View className="w-full">
            <InputForm
              type="number"
              label="ISBN"
              value={values.isbn}
              onChange={handleChange('isbn')}
              onBlur={handleBlur('isbn')}
              mode="outlined"
              className="mb-4"
              leftIcon={<TextInput.Icon icon="barcode" />}
            />
            
            <InputForm
              type="text"
              label="Title *"
              value={values.title}
              onChange={handleChange('title')}
              onBlur={handleBlur('title')}
              mode="outlined"
              className="mb-4"
              error={touched.title && errors.title}
              touched={touched.title}
            />
            
            <Divider className="my-4" />
            
            {values.image_url ? (
              <View className="items-center mb-5">
                <Image
                  source={{ uri: values.image_url }}
                  className="w-[120px] h-[180px] mb-2.5 rounded bg-gray-100"
                  resizeMode="contain"
                />
                <Button
                  icon="close"
                  mode="text"
                  onPress={() => setFieldValue('image_url', null)}
                  className="my-1.5"
                >
                  Remove
                </Button>
              </View>
            ) : (
              <View className="items-center justify-center h-[180px] bg-gray-100 rounded mb-5">
                <MaterialCommunityIcons name="book-open-page-variant" size={64} color="#DDDDDD" />
                <Text className="mt-2.5 text-gray-400 text-sm">No cover image</Text>
              </View>
            )}
            
            <View className="mb-4">
              <Text className="text-base font-bold text-gray-800 mb-2">Authors *</Text>
              <ScrollView horizontal className="flex-row mb-2.5 max-h-[45px]">
                {authorChips.map((author, index) => (
                  <Chip
                    key={`author-${index}`}
                    onClose={() => removeAuthorChip(index, setFieldValue)}
                    className="mr-2 mb-2 bg-gray-100"
                    mode="outlined"
                  >
                    {author}
                  </Chip>
                ))}
              </ScrollView>
              <View className="flex-row items-center">
                <InputForm
                  type="text"
                  placeholder="Add author (press Enter to add)"
                  value={newAuthor}
                  onChange={setNewAuthor}
                  onSubmitEditing={() => addAuthorChip(newAuthor, setFieldValue)}
                  className="flex-1 mb-2.5"
                  mode="outlined"
                />
              </View>
              {touched.author && errors.author && (
                <Text className="text-xs text-red-500 -mt-2.5 mb-2.5 ml-1.5">{errors.author}</Text>
              )}
            </View>
            
            <InputForm
              type="text"
              label="Publisher"
              value={values.publisher}
              onChange={handleChange('publisher')}
              onBlur={handleBlur('publisher')}
              mode="outlined"
              className="mb-4"
            />
            
            <InputForm
              type="text"
              label="Published Date"
              value={values.published_date}
              onChange={handleChange('published_date')}
              onBlur={handleBlur('published_date')}
              mode="outlined"
              className="mb-4"
            />
            
            <View className="mb-4">
              <Text className="text-base font-bold text-gray-800 mb-2">Categories</Text>
              <ScrollView horizontal className="flex-row mb-2.5 max-h-[45px]">
                {categoryChips.map((category, index) => (
                  <Chip
                    key={`category-${index}`}
                    onClose={() => removeCategoryChip(index, setFieldValue)}
                    className="mr-2 mb-2 bg-gray-100"
                    mode="outlined"
                  >
                    {category}
                  </Chip>
                ))}
              </ScrollView>
              <View className="flex-row items-center">
                <InputForm
                  type="text"
                  placeholder="Add category (press Enter to add)"
                  value={newCategory}
                  onChange={setNewCategory}
                  onSubmitEditing={() => addCategoryChip(newCategory, setFieldValue)}
                  className="flex-1 mb-2.5"
                  mode="outlined"
                />
              </View>
            </View>
            
            <View className="mb-4">
              <Text className="text-base font-bold text-gray-800 mb-2">Library Code</Text>
              <InputForm
                type="text"
                label="Location Code"
                value={values.location}
                onChange={handleChange('location')}
                onBlur={handleBlur('location')}
                mode="outlined"
                className="mb-4"
                placeholder="THEME-AUT-1234-001"
                rightIcon={<TextInput.Icon icon="bookshelf" />}
              />
              {values.location ? (
                <Text className="text-xs text-gray-600 -mt-2.5 mb-2.5 ml-1.5">
                  {libraryCodeExplanation.replace('Author code', `Author (${values.author})`)}
                </Text>
              ) : (
                <Text className="text-xs text-gray-600 -mt-2.5 mb-2.5 ml-1.5">
                  Location code is automatically generated based on genre, author, ISBN, and copy number
                </Text>
              )}
            </View>
            
            <InputForm
              type="textarea"
              label="Description"
              value={values.description}
              onChange={handleChange('description')}
              onBlur={handleBlur('description')}
              mode="outlined"
              className="mb-4"
              height={100}
              multiline
              numberOfLines={4}
            />
            
            <InputForm
              type="textarea"
              label="Notes"
              value={values.notes}
              onChange={handleChange('notes')}
              onBlur={handleBlur('notes')}
              mode="outlined"
              className="mb-4"
              height={100}
              multiline
              numberOfLines={3}
            />
            
            <Button
              mode="contained"
              onPress={handleSubmit}
              className="mt-2.5 mb-7.5 py-1.5 bg-primary"
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

export default AddBookForm;