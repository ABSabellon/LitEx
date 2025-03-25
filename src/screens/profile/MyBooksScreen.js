import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  Button,
  Menu,
  Divider,
  FAB,
  IconButton
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getBookById } from '../../services/bookService';
import { getLoanedBooksByEmail, returnBook } from '../../services/borrowService';

const MyBooksScreen = ({ navigation, route }) => {
  const [myBooks, setMyBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [filter, setFilter] = useState('all');
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    if (route?.params?.guestEmail && route?.params?.guestVerified) {
      setIsGuestMode(true);
      setGuestEmail(route.params.guestEmail);
    }
  }, [route?.params]);

  const loadBooks = async () => {
    setMyBooks([]);
    const emailToUse = isGuestMode ? guestEmail : (currentUser?.email || null);
    if (!emailToUse) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    
    try {
      setLoading(true);
      const borrows = await getLoanedBooksByEmail(emailToUse);
      const booksWithBorrowDetails = await Promise.all(
        borrows.map(async (borrow) => {
          const book = await getBookById(borrow.book_id);
          if (book) {
            const due_date = borrow.due_date.toDate();
            const isOverdue = borrow.status === 'active' && due_date < new Date();
            return {
              ...book,
              borrow_id: borrow.id,
              borrow_date: borrow.borrow_date.toDate(),
              due_date: due_date,
              return_date: borrow.return_date ? borrow.return_date.toDate() : null,
              status: borrow.status,
              isOverdue
            };
          }
          return null;
        })
      );
      
      const validBooks = booksWithBorrowDetails.filter(book => book !== null);
      validBooks.sort((a, b) => b.borrow_date - a.borrow_date);
      setMyBooks(validBooks);
    } catch (error) {
      console.error('Error loading loaned books:', error);
      Alert.alert('Error', 'Failed to load your loaned books');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const exitGuestMode = () => {
    setIsGuestMode(false);
    setGuestEmail('');
    navigation.navigate('GuestVerification');
  };

  useEffect(() => {
    loadBooks();
  }, [currentUser, isGuestMode, guestEmail]);

  const onRefresh = () => {
    setRefreshing(true);
    loadBooks();
  };

  const getFilteredBooks = () => {
    if (filter === 'all') return myBooks;
    if (filter === 'active') return myBooks.filter(book => book.status === 'active' && !book.isOverdue);
    if (filter === 'returned') return myBooks.filter(book => book.status === 'returned');
    if (filter === 'overdue') return myBooks.filter(book => book.isOverdue);
    return myBooks;
  };

  const formatDate = (date) => !date ? 'N/A' : date.toLocaleDateString();

  const getDaysLeft = (due_date) => {
    if (!due_date) return 0;
    const today = new Date();
    const diffTime = due_date - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleReturnBook = (book) => {
    Alert.alert(
      'Return Book',
      `Are you sure you want to return "${book.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Return',
          onPress: async () => {
            try {
              setLoading(true);
              await returnBook(book.borrow_id);
              Alert.alert('Success', 'Book returned successfully');
              loadBooks();
            } catch (error) {
              console.error('Error returning book:', error);
              Alert.alert('Error', 'Failed to return the book');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderBookItem = ({ item }) => {
    const daysLeft = getDaysLeft(item.due_date);
    return (
      <Card 
        className="mb-2.5 shadow-sm rounded-lg"
        onPress={() => navigation.navigate('MyBookDetails', { book_id: item.id })}
      >
        <Card.Content className="flex-row">
          <View className="flex-1 mr-2.5">
            <Title className="text-base leading-5">{item.title}</Title>
            <Paragraph className="text-sm text-gray-600">by {item.author}</Paragraph>
            <View className="mt-2.5">
              <View className="flex-row mb-1">
                <Text className="w-20 text-sm text-gray-600">Loaned:</Text>
                <Text className="text-sm text-gray-800 font-medium">{formatDate(item.borrow_date)}</Text>
              </View>
              <View className="flex-row mb-1">
                <Text className="w-20 text-sm text-gray-600">Due:</Text>
                <Text className={`text-sm font-medium ${item.isOverdue ? 'text-red-500' : 'text-gray-800'}`}>
                  {formatDate(item.due_date)}
                </Text>
              </View>
              {item.return_date && (
                <View className="flex-row mb-1">
                  <Text className="w-20 text-sm text-gray-600">Returned:</Text>
                  <Text className="text-sm text-gray-800 font-medium">{formatDate(item.return_date)}</Text>
                </View>
              )}
            </View>
            <View className="flex-row items-center mt-2.5 flex-wrap">
              {item.status === 'active' ? (
                item.isOverdue ? (
                  <Chip 
                    mode="outlined" 
                    className="border-red-500 bg-red-50"
                    textStyle={{ color: '#FF3B30' }}
                  >
                    {Math.abs(daysLeft)} days overdue
                  </Chip>
                ) : (
                  <Chip 
                    mode="outlined" 
                    className="border-green-500 bg-green-50"
                    textStyle={{ color: '#4CD964' }}
                  >
                    {daysLeft} days left
                  </Chip>
                )
              ) : (
                <Chip 
                  mode="outlined" 
                  className="border-gray-500 bg-gray-50"
                  textStyle={{ color: '#8E8E93' }}
                >
                  Returned
                </Chip>
              )}
              {item.status === 'active' && (
                <Button 
                  mode="text" 
                  compact
                  onPress={() => handleReturnBook(item)}
                  className="ml-2.5"
                >
                  Return
                </Button>
              )}
            </View>
          </View>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              className="w-20 h-30 rounded"
              resizeMode="cover"
            />
          ) : (
            <View className="w-20 h-30 rounded bg-gray-200 justify-center items-center">
              <MaterialCommunityIcons name="book-open-page-variant" size={40} color="#CCCCCC" />
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const filteredBooks = getFilteredBooks();

  if (!isGuestMode && !currentUser) {
    return (
      <View className="flex-1 bg-gray-100">
        <View className="p-5 flex-row justify-between items-center">
          <Text className="text-2xl font-bold text-gray-800">My Books</Text>
        </View>
        <View className="flex-1 p-5 items-center justify-center">
          <MaterialCommunityIcons name="account-lock" size={80} color="#4A90E2" />
          <Text className="text-xl font-bold text-gray-800 mt-5 mb-2.5">Access Your Books</Text>
          <Text className="text-base text-gray-600 text-center mb-8 leading-5">
            Sign in to view your books or enter your guest details to check books you've loaned as a guest.
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('GuestVerification')}
            className="mb-4 bg-green-600 w-[80%]"
            icon="email-check"
          >
            Check Guest Books
          </Button>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
            className="mb-4 bg-blue-600 w-[80%]"
            icon="login"
          >
            Sign In
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Auth', { screen: 'Register' })}
            className="mb-4 border-blue-600 w-[80%]"
          >
            Create Account
          </Button>
          <Button
            mode="text"
            onPress={() => navigation.navigate('CatalogTab')}
            className="mt-2.5"
          >
            Continue Browsing
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100">
      <View className="p-5 flex-row justify-between items-center">
        {isGuestMode && (
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={exitGuestMode}
            className="ml-[-10px]"
          />
        )}
        <Text className={`text-2xl font-bold text-gray-800 ${isGuestMode ? 'flex-1 ml-2' : ''}`}>
          {isGuestMode ? 'Guest Books' : 'My Books'}
        </Text>
        <Menu
          visible={filterMenuVisible}
          onDismiss={() => setFilterMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setFilterMenuVisible(true)}
              className="border-blue-600"
              icon="filter-variant"
            >
              {filter === 'all' ? 'All Books' :
               filter === 'active' ? 'Active' :
               filter === 'returned' ? 'Returned' : 'Overdue'}
            </Button>
          }
        >
          <Menu.Item onPress={() => { setFilter('all'); setFilterMenuVisible(false); }} title="All Books" leadingIcon="book-multiple" />
          <Menu.Item onPress={() => { setFilter('active'); setFilterMenuVisible(false); }} title="Active" leadingIcon="book-open-variant" />
          <Menu.Item onPress={() => { setFilter('returned'); setFilterMenuVisible(false); }} title="Returned" leadingIcon="book-check" />
          <Divider />
          <Menu.Item onPress={() => { setFilter('overdue'); setFilterMenuVisible(false); }} title="Overdue" leadingIcon="book-alert" />
        </Menu>
      </View>
      {isGuestMode && (
        <View className="bg-green-600 py-2.5 px-5 flex-row items-center justify-center">
          <MaterialCommunityIcons name="account-box" size={20} color="#FFF" />
          <Text className="text-white text-sm font-medium ml-2">
            Viewing books for guest: {guestEmail}
          </Text>
        </View>
      )}
      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text className="mt-2.5 text-gray-600">Loading your books...</Text>
        </View>
      ) : (
        <>
          {filteredBooks.length === 0 ? (
            <View className="flex-1 justify-center items-center p-5">
              <MaterialCommunityIcons name="bookshelf" size={64} color="#CCCCCC" />
              <Text className="text-base text-gray-400 mt-2.5 mb-5 text-center">
                {filter !== 'all' ? `No ${filter} books found` : "You haven't loaned any books yet"}
              </Text>
              {filter === 'all' && (
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('CatalogTab')}
                  className="bg-blue-600"
                >
                  Browse Library
                </Button>
              )}
            </View>
          ) : (
            <FlatList
              data={filteredBooks}
              renderItem={renderBookItem}
              keyExtractor={item => item.borrow_id}
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
      {!isGuestMode && (
        <FAB
          className="absolute bottom-4 right-4 bg-blue-600"
          icon="qrcode-scan"
          onPress={() => navigation.navigate('ScanTab')}
          color="#FFFFFF"
        />
      )}
    </View>
  );
};

export default MyBooksScreen;