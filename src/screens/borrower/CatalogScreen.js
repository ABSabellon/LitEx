import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
  ScrollView,
  Button
} from 'react-native';
import LoadingOverlay from '../../components/LoadingOverlay';
import {
  Searchbar,
  Chip,
  Menu,
  Divider,
  FAB,
  Card,
  Title,
  Paragraph
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAllBooks, getBookCoverUrl } from '../../services/bookService';
import { useAuth } from '../../context/AuthContext';
import StarRating from '../../components/StarRating';
import BookCard from '../../components/Cards/BookCard';

const CatalogScreen = ({ navigation }) => {
  const { userRole } = useAuth();
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
    // First apply status filter
    let result = [...booksData];
    
    if (status !== 'all') {
      result = result.filter(book => book.status === status);
    }
    
    // Then apply search query filter
    if (query) {
      const lowercaseQuery = query.toLowerCase();
      result = result.filter(book => 
        (book.title && book.title.toLowerCase().includes(lowercaseQuery)) ||
        (book.author && book.author.toLowerCase().includes(lowercaseQuery)) ||
        (book.categories && book.categories.some(cat => cat.toLowerCase().includes(lowercaseQuery)))
      );
    }
    
    // Finally apply sorting
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
      case 'rating_high':
        result.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
        break;
      case 'rating_low':
        result.sort((a, b) => (a.average_rating || 0) - (b.average_rating || 0));
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
    filterAndSortBooks(books, query, statusFilter, sortOrder);
  };
  
  // Handle status filter change
  const onStatusFilterChange = (status) => {
    setStatusFilter(status);
    filterAndSortBooks(books, searchQuery, status, sortOrder);
  };
  
  // Handle sort order change
  const onSortOrderChange = (order) => {
    setSortOrder(order);
    setSortMenuVisible(false);
    filterAndSortBooks(books, searchQuery, statusFilter, order);
  };
  
  // Format status for display
  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return '#4CD964';
      case 'borrowed':
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
      bookNavigateTo="BorrowerBookDetails"
      authorNavigateTo="CatalogAuthorDetails"
    />
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search by title, author, or category"
          onChangeText={onChangeSearch}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <Menu
          visible={sortMenuVisible}
          onDismiss={() => setSortMenuVisible(false)}
          anchor={
            <TouchableOpacity
              onPress={() => setSortMenuVisible(true)}
              style={styles.sortIconButton}
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
          <Menu.Item onPress={() => onSortOrderChange('rating_high')} title="Highest Rated" />
          <Menu.Item onPress={() => onSortOrderChange('rating_low')} title="Lowest Rated" />
        </Menu>
      </View>
      
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          <Chip 
            selected={statusFilter === 'all'} 
            onPress={() => onStatusFilterChange('all')}
            style={styles.filterChip}
            selectedColor="#4A90E2"
          >
            All
          </Chip>
          <Chip 
            selected={statusFilter === 'available'} 
            onPress={() => onStatusFilterChange('available')}
            style={styles.filterChip}
            selectedColor="#4CD964"
          >
            Available
          </Chip>
        </ScrollView>
      </View>
      
      {loading && !refreshing ? (
        <LoadingOverlay visible={true} message="Loading books..." />
      ) : (
        <>
          {filteredBooks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="book-open-variant" size={64} color="#CCCCCC" />
              <Text style={styles.emptyText}>No books found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try changing your search or filters'
                  : 'The library catalog is empty'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredBooks}
              renderItem={renderBookItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: 10,
    marginBottom: 15,
  },
  searchBar: {
    flex: 1,
    elevation: 2,
  },
  sortIconButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filtersContainer: {
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  filtersScroll: {
    paddingRight: 20,
  },
  filterChip: {
    marginRight: 8,
  },
  sortButton: {
    marginLeft: 8,
    borderColor: '#4A90E2',
  },
  // Removed redundant loading styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 5,
    textAlign: 'center',
  },
  listContent: {
    padding: 10,
    paddingBottom: 80, // Add padding to bottom to avoid FAB overlap
  },
});

export default CatalogScreen;