import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import LoadingOverlay from '../../components/LoadingOverlay';
import { Card, Title, Paragraph, Button, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getAllBooks, getHighestRatedBooks, getBookCoverUrl } from '../../services/bookService';
import { getBorrowsByEmail } from '../../services/borrowService';

import FeaturedBook from '../../components/Cards/FeaturedBook';

const HomeScreen = ({ navigation }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [myBooks, setMyBooks] = useState([]);
  const [libraryStats, setLibraryStats] = useState({
    totalBooks: 0,
    availableBooks: 0
  });
  
  const loadHomeData = async () => {
    try {
      setLoading(true);
      
      // Get all books for stats
      const books = await getAllBooks();
      
      // Get featured/highest rated books
      const topRated = await getHighestRatedBooks(5);
      
      // Get user's borrowed books - only for authenticated users
      let borrowedBooks = [];
      if (currentUser && currentUser.email) {
        const borrows = await getBorrowsByEmail(currentUser.email);
        
        // For each borrow, fetch the book details
        for (const borrow of borrows) {
          const book = books.data.find(b => b.id === borrow.book_id);
          if (book) {
            borrowedBooks.push({
              ...book,
              borrow_id: borrow.id,
              due_date: borrow.due_date
            });
          }
        }
      }
      
      // Calculate library stats
      const availableBooks = books.data.filter(book => book.status === 'available').length;
      
      setFeaturedBooks(topRated.data);
      setMyBooks(borrowedBooks);
      setLibraryStats({
        totalBooks: books.length,
        availableBooks
      });
      
    } catch (error) {
      console.error('Error loading home data:', error);
      Alert.alert('Error', 'Failed to load library data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    loadHomeData();
  };
  
  useEffect(() => {
    loadHomeData();
  }, [currentUser]);
  
  
  const renderMyBook = (book) => {
    // Format due date
    const due_date = book.due_date ? new Date(book.due_date.toDate()) : null;
    const formattedDueDate = due_date ? due_date.toLocaleDateString() : 'Unknown';
    
    // Check if book is overdue
    const isOverdue = due_date && due_date < new Date();
    
    return (
      <Card 
        key={book.id}
        style={styles.myBookCard}
        onPress={() => navigation.navigate('MyBooksTab', {
          screen: 'MyBookDetails',
          params: { book_id: book.id }
        })}
      >
        <Card.Content style={styles.myBookCardContent}>
          <View style={styles.myBookInfo}>
            <Title numberOfLines={2} style={styles.myBookTitle}>{book.title}</Title>
            <View style={styles.myBookAuthorContainer}>
              {book.authorsData && Array.isArray(book.authorsData) && book.authorsData.length > 0 ? (
                book.authorsData.map((author, index) => (
                  <View key={index} style={styles.authorItemContainer}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('MyBooksTab', {
                        screen: 'MyBooksAuthorDetails',
                        params: { authorId: author.openLibrary_id, authorName: author.name }
                      })}
                    >
                      <Text style={styles.myBookAuthorLink}>
                        {index === 0 ? '' : ', '}{author.name}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Paragraph style={styles.myBookAuthor}>{book.author}</Paragraph>
              )}
            </View>
            
            <View style={styles.dueContainer}>
              <Text style={styles.dueLabel}>Due:</Text>
              <Text style={[
                styles.due_date,
                isOverdue && styles.overdueDate
              ]}>
                {formattedDueDate}
              </Text>
              
              {isOverdue && (
                <Chip 
                  mode="outlined" 
                  textStyle={styles.overdueChipText}
                  style={styles.overdueChip}
                >
                  Overdue
                </Chip>
              )}
            </View>
          </View>
          
          {getBookCoverUrl(book) ? (
            <Image
              source={{ uri: getBookCoverUrl(book) }}
              style={styles.myBookCover}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.myBookCoverPlaceholder}>
              <MaterialCommunityIcons name="book-open-page-variant" size={40} color="#CCCCCC" />
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };
  
  return (
    <>
      {/* Add loading overlay */}
      <LoadingOverlay visible={loading && !refreshing} message="Loading library data..." />
      
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4A90E2']}
          />
        }
      >
      <View style={styles.header}>
        <Text style={styles.greeting}>
          {currentUser ?
            `Welcome, ${currentUser.displayName || 'Reader'}` :
            'Welcome to Library App'
          }
        </Text>
        {!currentUser && (
          <TouchableOpacity
            onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
            style={styles.signInButton}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.statsContainer}>
        <Card style={styles.statsCard}>
          <Card.Content style={styles.statsContent}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{libraryStats.totalBooks}</Text>
              <Text style={styles.statLabel}>Total Books</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{libraryStats.availableBooks}</Text>
              <Text style={styles.statLabel}>Available</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{myBooks.length}</Text>
              <Text style={styles.statLabel}>My Books</Text>
            </View>
          </Card.Content>
        </Card>
      </View>
      
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('CatalogTab')}
        >
          <MaterialCommunityIcons name="book-search" size={32} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Browse Books</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('ScanTab')}
        >
          <MaterialCommunityIcons name="qrcode-scan" size={32} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Scan Book</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Books</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('CatalogTab')}
          >
            <Text style={styles.seeAllButton}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredBooksContainer}
        >
          {featuredBooks.length > 0 ? (
            featuredBooks.map(book => (
              <FeaturedBook 
                key={book.id}
                book={book}
                navigation={navigation}
                bookNavigateTo="BorrowerBookDetails"
                authorNavigateTo="CatalogAuthorDetails"
              />
            ))
          ) : (
            <Text style={styles.emptyText}>No featured books available</Text>
          )}
        </ScrollView>
      </View>
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Books</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('MyBooksTab')}
          >
            <Text style={styles.seeAllButton}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.myBooksContainer}>
          {!currentUser ? (
            // Guest user - show sign in prompt
            <View style={styles.emptyBooksContainer}>
              <MaterialCommunityIcons name="account-lock" size={48} color="#CCCCCC" />
              <Text style={styles.emptyText}>Sign in to track your borrowed books</Text>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
                style={styles.signInPromptButton}
              >
                Sign In
              </Button>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('Auth', { screen: 'Register' })}
                style={styles.registerButton}
              >
                Create Account
              </Button>
            </View>
          ) : myBooks.length > 0 ? (
            // Logged in user with books
            myBooks.map(book => renderMyBook(book))
          ) : (
            // Logged in user without books
            <View style={styles.emptyBooksContainer}>
              <MaterialCommunityIcons name="bookshelf" size={48} color="#CCCCCC" />
              <Text style={styles.emptyText}>You haven't borrowed any books yet</Text>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('CatalogTab')}
                style={styles.browseButton}
              >
                Browse Library
              </Button>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  statsContainer: {
    marginTop: -5,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  statsCard: {
    elevation: 4,
    borderRadius: 10,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#EEEEEE',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 5,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  actionButton: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginTop: 8,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  seeAllButton: {
    color: '#4A90E2',
    fontSize: 14,
  },
  featuredBooksContainer: {
    paddingHorizontal: 15,
    paddingBottom: 5,
  },
  myBooksContainer: {
    paddingHorizontal: 20,
  },
  myBookCard: {
    marginBottom: 10,
    elevation: 2,
  },
  myBookCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  myBookInfo: {
    flex: 1,
    marginRight: 10,
  },
  myBookTitle: {
    fontSize: 16,
    lineHeight: 20,
  },
  myBookAuthor: {
    fontSize: 14,
    lineHeight: 18,
    color: '#666666',
  },
  myBookAuthorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  myBookAuthorLink: {
    fontSize: 14,
    lineHeight: 18,
    color: '#4A90E2',
    textDecorationLine: 'underline',
  },
  myBookCover: {
    width: 60,
    height: 90,
    borderRadius: 4,
  },
  myBookCoverPlaceholder: {
    width: 60,
    height: 90,
    borderRadius: 4,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  dueLabel: {
    fontSize: 14,
    color: '#666666',
    marginRight: 5,
  },
  due_date: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginRight: 8,
  },
  overdueDate: {
    color: '#FF3B30',
  },
  overdueChip: {
    height: 22,
    borderColor: '#FF3B30',
  },
  overdueChipText: {
    color: '#FF3B30',
    fontSize: 10,
    margin: 0,
  },
  emptyBooksContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#999999',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  browseButton: {
    marginTop: 15,
    backgroundColor: '#4A90E2',
  },
  signInPromptButton: {
    marginTop: 15,
    backgroundColor: '#4A90E2',
  },
  registerButton: {
    marginTop: 10,
    borderColor: '#4A90E2',
  },
  signInButton: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  signInButtonText: {
    color: '#4A90E2',
    fontWeight: 'bold',
  },
});

export default HomeScreen;