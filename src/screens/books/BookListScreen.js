import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ScrollView,
  Image
} from 'react-native';
import LoadingOverlay from '../../components/LoadingOverlay';
import { 
  Searchbar, 
  Chip, 
  Button, 
  Menu, 
  Divider,
  List,
  FAB,
  Card,
  Title,
  Paragraph
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAllBooks, deleteBook, getBookCoverUrl } from '../../services/bookService';
import BookCard from '../../components/cards/BookCard';

const BookListScreen = ({ navigation }) => {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [sortOrder, setSortOrder] = useState('title_asc');
  
  // Load books from Firebase
  const loadBooks = async () => {
    try {
      setLoading(true);
      const booksData = await getAllBooks();
      setBooks(booksData.data);
      filterAndSortBooks(booksData.data, searchQuery, statusFilter, sortOrder);
    } catch (error) {
      console.error('Error loading books:', error);
      Alert.alert('Error', 'Failed to load books from the database');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Initial load
  useEffect(() => {
    loadBooks();
  }, []);
  
  // Filter and sort books based on current criteria
  const filterAndSortBooks = (booksData, query, status, sort) => {
    let result = [...booksData];
    
    if (status !== 'all') {
      result = result.filter(book => book.status === status);
    }
    
    if (query) {
      const lowercaseQuery = query.toLowerCase();
      result = result.filter(book => 
        (book.title && book.title.toLowerCase().includes(lowercaseQuery)) ||
        (book.author && book.author.toLowerCase().includes(lowercaseQuery)) ||
        (book.isbn && book.isbn.includes(query))
      );
    }
    
    switch (sort) {
      case 'title_asc':
        result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'title_desc':
        result.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
        break;
      case 'author_asc':
        result.sort((a, b) => (a.author || '').localeCompare(b.author || ''));
        break;
      case 'author_desc':
        result.sort((a, b) => (b.author || '').localeCompare(a.author || ''));
        break;
      case 'added_newest':
        result.sort((a, b) => {
          const dateA = a.addedDate ? new Date(a.addedDate.toDate()) : new Date(0);
          const dateB = b.addedDate ? new Date(b.addedDate.toDate()) : new Date(0);
          return dateB - dateA;
        });
        break;
      case 'added_oldest':
        result.sort((a, b) => {
          const dateA = a.addedDate ? new Date(a.addedDate.toDate()) : new Date(0);
          const dateB = b.addedDate ? new Date(b.addedDate.toDate()) : new Date(0);
          return dateA - dateB;
        });
        break;
      case 'most_loaned':
        result.sort((a, b) => (b.loan_count || 0) - (a.loan_count || 0));
        break;
      default:
        break;
    }
    
    setFilteredBooks(result);
  };
  
  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadBooks();
  };
  
  // Handle search
  const onChangeSearch = (query) => {
    setSearchQuery(query);
    filterAndSortBooks(books.data, query, statusFilter, sortOrder);
  };
  
  // Handle status filter change
  const onStatusFilterChange = (status) => {
    setStatusFilter(status);
    filterAndSortBooks(books.data, searchQuery, status, sortOrder);
  };
  
  // Handle sort order change
  const onSortOrderChange = (order) => {
    setSortOrder(order);
    setSortMenuVisible(false);
    filterAndSortBooks(books.data, searchQuery, statusFilter, order);
  };
  
  // Delete book handler
  const handleDeleteBook = (book_id) => {
    Alert.alert(
      'Delete Book',
      'Are you sure you want to delete this book? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBook(book_id);
              setBooks(books.data.filter(book => book.id !== book_id));
              setFilteredBooks(filteredBooks.data.filter(book => book.id !== book_id));
              Alert.alert('Success', 'Book has been deleted');
            } catch (error) {
              console.error('Error deleting book:', error);
              Alert.alert('Error', 'Failed to delete the book');
            }
          }
        }
      ]
    );
  };
  
  // Format status for display
  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return '#4CD964';
      case 'loaned':
        return '#FF9500';
      case 'unavailable':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };
  
  // Render book item
  const renderBookItem = ({ item }) => (
    <BookCard 
      book={item}
      navigation={navigation}
      bookNavigateTo="BookDetails"
      authorNavigateTo="AuthorDetails"
      admin={true}
    />
  );
  
  return (
    <View className="flex-1 bg-gray-100">
      <View className="flex-row items-center px-2.5 mt-2.5 mb-4">
        <Searchbar
          placeholder="Search by title, author, or ISBN"
          onChangeText={onChangeSearch}
          value={searchQuery}
          className="flex-1 shadow-sm"
        />
        <Menu
          visible={sortMenuVisible}
          onDismiss={() => setSortMenuVisible(false)}
          anchor={
            <TouchableOpacity
              onPress={() => setSortMenuVisible(true)}
              className="p-2.5 rounded-full bg-gray-200"
            >
              <MaterialCommunityIcons name="sort" size={24} color="#4A90E2" />
            </TouchableOpacity>
          }
        >
          <Menu.Item onPress={() => onSortOrderChange('title_asc')} title="Title (A-Z)" />
          <Menu.Item onPress={() => onSortOrderChange('title_desc')} title="Title (Z-A)" />
          <Menu.Item onPress={() => onSortOrderChange('author_asc')} title="Author (A-Z)" />
          <Menu.Item onPress={() => onSortOrderChange('author_desc')} title="Author (Z-A)" />
          <Divider />
          <Menu.Item onPress={() => onSortOrderChange('added_newest')} title="Date Added (Newest)" />
          <Menu.Item onPress={() => onSortOrderChange('added_oldest')} title="Date Added (Oldest)" />
          <Divider />
          <Menu.Item onPress={() => onSortOrderChange('most_loaned')} title="Most Loaned" />
        </Menu>
      </View>
      
      <View className="px-2.5 mb-2.5">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
          <Chip
            selected={statusFilter === 'all'}
            onPress={() => onStatusFilterChange('all')}
            className="mr-2"
            selectedColor="#4A90E2"
          >
            All
          </Chip>
          <Chip 
            selected={statusFilter === 'available'} 
            onPress={() => onStatusFilterChange('available')}
            className="mr-2"
            selectedColor="#4CD964"
          >
            Available
          </Chip>
          <Chip 
            selected={statusFilter === 'loaned'} 
            onPress={() => onStatusFilterChange('loaned')}
            className="mr-2"
            selectedColor="#FF9500"
          >
            Loaned
          </Chip>
          <Chip
            selected={statusFilter === 'unavailable'}
            onPress={() => onStatusFilterChange('unavailable')}
            className="mr-2"
            selectedColor="#FF3B30"
          >
            Unavailable
          </Chip>
        </ScrollView>
      </View>
      
      {loading && !refreshing ? (
        <LoadingOverlay visible={true} message="Loading books..." />
      ) : (
        <>
          {filteredBooks.length === 0 ? (
            <View className="flex-1 justify-center items-center px-5">
              <MaterialCommunityIcons name="book-open-variant" size={64} color="#CCCCCC" />
              <Text className="text-lg font-bold text-gray-800 mt-2.5">No books found</Text>
              <Text className="text-sm text-gray-400 mt-1 text-center">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try changing your search or filters'
                  : 'Add your first book to get started'}
              </Text>
              {!searchQuery && statusFilter === 'all' && (
                <Button 
                  mode="contained"
                  onPress={() => navigation.navigate('AddBook')}
                  className="mt-5 bg-blue-600"
                >
                  Add Book
                </Button>
              )}
            </View>
          ) : (
            <FlatList
              data={filteredBooks}
              renderItem={renderBookItem}
              keyExtractor={item => item.id}
              contentContainerStyle={{ padding: 10, paddingBottom: 80 }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#4A90E2']}
                />
              }
            />
          )}
        </>
      )}
      
      {/* <FAB
        className="absolute bottom-4 right-4 bg-blue-600"
        icon="plus"
        onPress={() => navigation.navigate('AddBook')}
        color="#FFFFFF"
      /> */}
    </View>
  );
};

export default BookListScreen;