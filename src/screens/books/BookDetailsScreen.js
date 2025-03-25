import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Linking,
  Dimensions,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LoadingOverlay from '../../components/LoadingOverlay';
import { 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  Divider, 
  Chip,
  Dialog,
  Portal,
  IconButton,
  List,
  Modal,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getBookById, updateBookStatus, deleteBook } from '../../services/bookService';
import { getBookLoanHistory, loanBook } from '../../services/loanService';
import { createGuestUser, checkUserExists, getGuestByContact } from '../../services/userService';
import { formatPhilippinesNumber, isValidPhilippinesNumber } from '../../utils/phoneUtils';
import StarRating from '../../components/StarRating';
import LoanedBook from '../../components/cards/LoanedBook';

const BookDetailsScreen = ({ navigation, route }) => {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loanHistory, setLoanHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showLendDrawer, setShowLendDrawer] = useState(false);
  const [lendName, setLendName] = useState('');
  const [lendEmail, setLendEmail] = useState('');
  const [lendPhone, setLendPhone] = useState('');
  const [lendLoading, setLendLoading] = useState(false);

  const book_id = route.params?.book_id;

  useEffect(() => {
    const fetchBook = async () => {
      if (!book_id) {
        navigation.goBack();
        return;
      }
      try {
        setLoading(true);
        const bookData = await getBookById(book_id);
        if (bookData) {
          setBook(bookData);
          fetchBorrowHistory(book_id);
        } else {
          Alert.alert('Error', 'Book not found');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error loading book:', error);
        Alert.alert('Error', 'Failed to load book details');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [book_id]);

  const fetchBorrowHistory = async (id) => {
    try {
      setHistoryLoading(true);
      const history = await getBookLoanHistory(id);
      setLoanHistory(history.data);
    } catch (error) {
      console.error('Error fetching borrow history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return '#4CD964';
      case 'loaned': return '#FF9500';
      case 'unavailable': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const handleEditBook = () => {
    navigation.navigate('AddBook', { book_id: book.id, editMode: true });
  };

  const handleDeleteBook = async () => {
    try {
      await deleteBook(book.id);
      Alert.alert('Success', 'Book deleted successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error deleting book:', error);
      Alert.alert('Error', 'Failed to delete book');
    }
  };

  const handleChangeStatus = async (newStatus) => {
    try {
      await updateBookStatus(book.id, newStatus);
      setBook({ ...book, status: newStatus });
      Alert.alert('Success', `Book status updated to ${newStatus}`);
      setShowStatusDialog(false);
    } catch (error) {
      console.error('Error updating book status:', error);
      Alert.alert('Error', 'Failed to update book status');
    }
  };

  const handleGenerateQR = () => {
    navigation.navigate('GenerateQR', { book_id: book.id });
  };

  const handleSearchOnline = () => {
    const searchQuery = `${book.title} ${book.author}`;
    const encodedQuery = encodeURIComponent(searchQuery);
    Linking.openURL(`https://www.google.com/search?q=${encodedQuery}`);
  };

  const handleLendBook = () => {
    setShowLendDrawer(true);
  };

  const handleBorrowSubmit = async () => {
    if (!lendName.trim() || !lendEmail.trim() || !lendPhone.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(lendEmail)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }
    if (!isValidPhilippinesNumber(lendPhone)) {
      Alert.alert('Error', 'Please enter a valid Philippines mobile number (e.g., 09XXXXXXXXX).');
      return;
    }

    setLendLoading(true);
    try {
      const formattedPhone = formatPhilippinesNumber(lendPhone);
      const userExists = await checkUserExists(lendEmail);

      let guestDetails;

      if (userExists) {
        const user = await getGuestByContact(lendEmail);
        if (!user) {
          throw new Error('User not found despite existing contact');
        }
        guestDetails = {
          user_id: user.id,
          name: user.profile.name,
          email: user.profile.email,
          phone: user.profile.phone
        };
      } else {
        const newUser = await createGuestUser(lendName, lendEmail, formattedPhone);
        guestDetails = {
          user_id: newUser.id,
          name: newUser.profile.name,
          email: newUser.profile.email,
          phone: newUser.profile.phone
        };
      }

      await loanBook(book.id, guestDetails);
      setBook({ ...book, status: 'loaned', available_copies: (book.available_copies || 1) - 1 });

      Alert.alert(
        'Book Lent',
        'The book has been successfully lent to the guest.',
        [{ text: 'OK', onPress: () => setShowLendDrawer(false) }]
      );
      setLendName('');
      setLendEmail('');
      setLendPhone('');
    } catch (error) {
      console.error('Error lending book:', error);
      Alert.alert('Error', error.message || 'Failed to lend the book. Please try again.');
    } finally {
      setLendLoading(false);
    }
  };

  if (loading) {
    return <LoadingOverlay visible={true} message="Loading book details..." />;
  }

  const categories = book.categories
    ? Array.isArray(book.categories)
      ? book.categories
      : book.categories.split(', ').map(cat => cat.trim())
    : [];

  return (
    <>
      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Delete Book</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Are you sure you want to delete "{book?.title}"? This action cannot be undone.</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button onPress={handleDeleteBook} textColor="#FF3B30">Delete</Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog visible={showStatusDialog} onDismiss={() => setShowStatusDialog(false)}>
          <Dialog.Title>Change Book Status</Dialog.Title>
          <Dialog.Content>
            <TouchableOpacity className="flex-row items-center py-3 border-b border-gray-200" onPress={() => handleChangeStatus('available')}>
              <View className="w-3.5 h-3.5 rounded-full bg-green-500 mr-2" />
              <Text className="text-base">Available</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center py-3 border-b border-gray-200" onPress={() => handleChangeStatus('loaned')}>
              <View className="w-3.5 h-3.5 rounded-full bg-orange-500 mr-2" />
              <Text className="text-base">Loaned</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center py-3" onPress={() => handleChangeStatus('unavailable')}>
              <View className="w-3.5 h-3.5 rounded-full bg-red-500 mr-2" />
              <Text className="text-base">Unavailable</Text>
            </TouchableOpacity>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowStatusDialog(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>

        <Modal
          visible={showLendDrawer}
          onDismiss={() => setShowLendDrawer(false)}
          contentContainerStyle={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            height: Dimensions.get('window').height * 0.6,
            paddingTop: 20,
          }}
          style={{ justifyContent: 'flex-end', margin: 0 }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>
              <Text className="text-xl font-bold text-gray-800 mb-2">Lend "{book?.title}"</Text>
              <Text className="text-sm text-gray-600 mb-5">Enter guest details</Text>

              <Text className="text-base font-medium text-gray-800 mb-2">Full Name</Text>
              <TextInput
                className="bg-gray-100 h-12 rounded-lg px-4 text-base text-gray-800 border border-gray-200 mb-4"
                placeholder="Patron's full name"
                value={lendName}
                onChangeText={setLendName}
                autoCapitalize="words"
              />

              <Text className="text-base font-medium text-gray-800 mb-2">Email Address</Text>
              <TextInput
                className="bg-gray-100 h-12 rounded-lg px-4 text-base text-gray-800 border border-gray-200 mb-4"
                placeholder="Patron's email address"
                value={lendEmail}
                onChangeText={setLendEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text className="text-base font-medium text-gray-800 mb-2">Phone Number</Text>
              <View className="flex-row items-center mb-4">
                <View className="bg-gray-200 px-3 py-4 rounded-lg border border-gray-300 mr-2 h-12 justify-center">
                  <Text className="text-base font-medium text-gray-800">+63</Text>
                </View>
                <TextInput
                  className="flex-1 bg-gray-100 h-12 rounded-lg px-4 text-base text-gray-800 border border-gray-200"
                  placeholder="XXXXXXXXX"
                  value={lendPhone}
                  onChangeText={(value) => setLendPhone(value.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                />
              </View>

              <Button
                mode="contained"
                onPress={handleBorrowSubmit}
                className="bg-blue-500 mt-5 py-1"
                disabled={lendLoading}
                loading={lendLoading}
              >
                Lend Book
              </Button>
              <Button
                mode="text"
                onPress={() => setShowLendDrawer(false)}
                className="mt-2"
              >
                Cancel
              </Button>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
      </Portal>

      <ScrollView className="flex-1 bg-gray-100">
        <View className="p-4 pb-8">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-lg font-bold text-gray-800">Book Management</Text>
            <View className="flex-row">
              <IconButton icon="pencil" size={20} onPress={handleEditBook} />
              <IconButton icon="trash-can-outline" size={20} onPress={() => setShowDeleteDialog(true)} iconColor="#FF3B30" />
            </View>
          </View>

          <Card className="rounded-lg shadow-sm mb-4">
            <Card.Content>
              <View className="flex-row mb-4">
                {book.imageUrl ? (
                  <Image source={{ uri: book.imageUrl }} className="w-[120px] h-[180px] rounded-lg" resizeMode="cover" />
                ) : (
                  <View className="w-[120px] h-[180px] rounded-lg bg-gray-200 justify-center items-center">
                    <MaterialCommunityIcons name="book-open-page-variant" size={64} color="#CCCCCC" />
                  </View>
                )}
                <View className="ml-4 flex-1">
                  <Title className="text-lg leading-6">{book.title}</Title>
                  <View className="flex-row flex-wrap items-center">
                    <Text className="text-sm text-gray-600">by </Text>
                    {book.authorsData && Array.isArray(book.authorsData) && book.authorsData.length > 0 ? (
                      book.authorsData.map((author, index) => (
                        <View key={index} className="flex-row items-center">
                          <TouchableOpacity
                            onPress={() => navigation.navigate('AuthorDetails', { authorId: author.openLibrary_id, authorName: author.name })}
                          >
                            <Text className="text-sm text-blue-500 underline">{author.name}</Text>
                          </TouchableOpacity>
                          {index < book.authorsData.length - 1 && <Text className="text-sm text-gray-600">, </Text>}
                        </View>
                      ))
                    ) : (
                      <Text className="text-sm text-gray-600">{book.author}</Text>
                    )}
                  </View>
                  <TouchableOpacity className="flex-row items-center mt-2" onPress={() => setShowStatusDialog(true)}>
                    <Text className="text-sm text-gray-600 mr-1">Status:</Text>
                    <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: getStatusColor(book.status) }}>
                      <Text className="text-white text-xs font-bold">
                        {book.status ? book.status.charAt(0).toUpperCase() + book.status.slice(1) : 'Unknown'}
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="pencil-outline" size={14} color="#666666" className="ml-1" />
                  </TouchableOpacity>
                  {book.average_rating > 0 && (
                    <View className="flex-row items-center mt-1">
                      <StarRating rating={book.average_rating} count={book.ratings_count || 0} />
                    </View>
                  )}
                  {(book.library_info?.library_qr || book.library_qr) && (
                    <Button mode="outlined" icon="qrcode-scan" onPress={handleGenerateQR} className="mt-2 border-blue-500">
                      View QR Code
                    </Button>
                  )}
                </View>
              </View>
              <Divider className="my-4" />
              <View className="mb-2">
                <View className="flex-row mb-2">
                  <Text className="w-20 text-sm text-gray-600">ISBN:</Text>
                  <Text className="flex-1 text-sm text-gray-800">{book.isbn || 'N/A'}</Text>
                </View>
                <View className="flex-row mb-2">
                  <Text className="w-20 text-sm text-gray-600">Publisher:</Text>
                  <Text className="flex-1 text-sm text-gray-800">{book.publisher || 'N/A'}</Text>
                </View>
                <View className="flex-row mb-2">
                  <Text className="w-20 text-sm text-gray-600">Published:</Text>
                  <Text className="flex-1 text-sm text-gray-800">{book.published_date || 'N/A'}</Text>
                </View>
                <View className="flex-row mb-2">
                  <Text className="w-20 text-sm text-gray-600">Pages:</Text>
                  <Text className="flex-1 text-sm text-gray-800">{book.page_count || 'N/A'}</Text>
                </View>
                <View className="flex-row mb-2">
                  <Text className="w-20 text-sm text-gray-600">Location:</Text>
                  <Text className="flex-1 text-sm text-gray-800">{book.library_info.location || 'N/A'}</Text>
                </View>
                {(book.copy_count || book.available_copies) && (
                  <View className="flex-row mb-2">
                    <Text className="w-20 text-sm text-gray-600">Available:</Text>
                    <Text className="flex-1 text-sm text-gray-800">{book.available_copies || 0} of {book.copy_count || 1}</Text>
                  </View>
                )}
                {categories.length > 0 && (
                  <View className="mt-1">
                    <Text className="text-sm text-gray-600">Categories:</Text>
                    <View className="flex-row flex-wrap mt-1">
                      {(showAllCategories ? categories : categories.slice(0, 3)).map((category, index) => (
                        <Chip key={index} className="mr-1 mb-1 bg-gray-200" textStyle={{ fontSize: 12 }}>
                          {category}
                        </Chip>
                      ))}
                      {categories.length > 3 && (
                        <View className="w-full flex-row justify-end">
                          <TouchableOpacity className="py-1 px-2 mt-1 mb-1" onPress={() => setShowAllCategories(!showAllCategories)}>
                            <Text className="text-blue-500 text-sm font-medium">{showAllCategories ? 'Show Less' : 'Show More'}</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </View>
              {book.description && (
                <>
                  <Divider className="my-4" />
                  <View className="mb-2">
                    <Text className="text-base font-bold text-gray-800">Description</Text>
                    <Text className="text-sm text-gray-800 leading-5">{book.description}</Text>
                  </View>
                </>
              )}
            </Card.Content>
          </Card>

          <Card className="rounded-lg shadow-sm mt-0">
            <Card.Content>
              <View className="mb-4">
                <Text className="text-base font-bold text-gray-800">Loan History</Text>
              </View>
              {historyLoading ? (
                <ActivityIndicator size="small" color="#4A90E2" className="my-5" />
              ) : loanHistory.length > 0 ? (
                <>
                  {loanHistory.slice(0, 3).map((borrow, index) => (
                    <React.Fragment key={index}>
                      <LoanedBook borrow={borrow} />
                      {index < Math.min(3, loanHistory.length) - 1 && <Divider className="my-2" />}
                    </React.Fragment>
                  ))}
                  {loanHistory.length > 3 && (
                    <TouchableOpacity
                      className="mt-2 py-2 items-center"
                      onPress={() => navigation.navigate('BorrowingHistory', { book_id: book_id })}
                    >
                      <Text className="text-blue-500 font-medium">See More</Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <Text className="text-center text-gray-500 italic my-5">No borrowing history available</Text>
              )}
            </Card.Content>
          </Card>

          <View className="mt-1">
            <Button mode="outlined" icon="book-arrow-right" onPress={handleLendBook} className="mb-2 border-blue-500">
              Lend Book
            </Button>
            <Button mode="outlined" icon="magnify" onPress={handleSearchOnline} className="mt-1 border-blue-500">
              Search Online
            </Button>
          </View>
        </View>
      </ScrollView>
    </>
  );
};

export default BookDetailsScreen;