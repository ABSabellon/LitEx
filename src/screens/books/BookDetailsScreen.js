import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
  const [showLendDrawer, setShowLendDrawer] = useState(false); // New state for drawer
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
          // console.log('bookData :: ', bookData)
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
    setShowLendDrawer(true); // Open the drawer
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
            <TouchableOpacity style={styles.statusOption} onPress={() => handleChangeStatus('available')}>
              <View style={[styles.statusDot, { backgroundColor: '#4CD964' }]} />
              <Text style={styles.statusOptionText}>Available</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statusOption} onPress={() => handleChangeStatus('loaned')}>
              <View style={[styles.statusDot, { backgroundColor: '#FF9500' }]} />
              <Text style={styles.statusOptionText}>Loaned</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statusOption} onPress={() => handleChangeStatus('unavailable')}>
              <View style={[styles.statusDot, { backgroundColor: '#FF3B30' }]} />
              <Text style={styles.statusOptionText}>Unavailable</Text>
            </TouchableOpacity>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowStatusDialog(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Lend Book Drawer */}
        <Modal
          visible={showLendDrawer}
          onDismiss={() => setShowLendDrawer(false)}
          contentContainerStyle={styles.drawerContainer}
          style={styles.modalStyle}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.drawerContent}
          >
            <ScrollView contentContainerStyle={styles.drawerScrollContent}>
              {/* <Text style={styles.drawerTitle}>Lend "{book?.title}"</Text> */}
              <Text style={styles.drawerSubtitle}>Enter guest details</Text>

              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Patron's full name"
                value={lendName}
                onChangeText={setLendName}
                autoCapitalize="words"
              />

              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Patron's email address"
                value={lendEmail}
                onChangeText={setLendEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.phoneInputContainer}>
                <View style={styles.phonePrefix}>
                  <Text style={styles.phonePrefixText}>+63</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="XXXXXXXXX"
                  value={lendPhone}
                  onChangeText={(value) => setLendPhone(value.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                />
              </View>

              <Button
                mode="contained"
                onPress={handleBorrowSubmit}
                style={styles.lendSubmitButton}
                disabled={lendLoading}
                loading={lendLoading}
              >
                Lend Book
              </Button>
              <Button
                mode="text"
                onPress={() => setShowLendDrawer(false)}
                style={styles.cancelDrawerButton}
              >
                Cancel
              </Button>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
      </Portal>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.adminHeader}>
          <Text style={styles.adminTitle}>Book Management</Text>
          <View style={styles.adminActions}>
            <IconButton icon="pencil" size={20} onPress={handleEditBook} />
            <IconButton icon="trash-can-outline" size={20} onPress={() => setShowDeleteDialog(true)} iconColor="#FF3B30" />
          </View>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.headerContainer}>
              {book.imageUrl ? (
                <Image source={{ uri: book.imageUrl }} style={styles.coverImage} resizeMode="cover" />
              ) : (
                <View style={styles.coverPlaceholder}>
                  <MaterialCommunityIcons name="book-open-page-variant" size={64} color="#CCCCCC" />
                </View>
              )}
              <View style={styles.headerInfo}>
                <Title style={styles.title}>{book.title}</Title>
                <View style={styles.authorContainer}>
                  <Text style={styles.authorBy}>by </Text>
                  {book.authorsData && Array.isArray(book.authorsData) && book.authorsData.length > 0 ? (
                    book.authorsData.map((author, index) => (
                      <View key={index} style={styles.authorItemContainer}>
                        <TouchableOpacity
                          onPress={() => navigation.navigate('AuthorDetails', { authorId: author.openLibrary_id, authorName: author.name })}
                        >
                          <Text style={styles.authorLink}>{author.name}</Text>
                        </TouchableOpacity>
                        {index < book.authorsData.length - 1 && <Text style={styles.authorBy}>, </Text>}
                      </View>
                    ))
                  ) : (
                    <Text style={styles.author}>{book.author}</Text>
                  )}
                </View>
                <TouchableOpacity style={styles.statusContainer} onPress={() => setShowStatusDialog(true)}>
                  <Text style={styles.statusLabel}>Status:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(book.status) }]}>
                    <Text style={styles.statusText}>
                      {book.status ? book.status.charAt(0).toUpperCase() + book.status.slice(1) : 'Unknown'}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="pencil-outline" size={14} color="#666666" style={{ marginLeft: 5 }} />
                </TouchableOpacity>
                {book.average_rating > 0 && (
                  <View style={styles.ratingContainer}>
                    <StarRating rating={book.average_rating} count={book.ratings_count || 0} style={{ marginTop: 5 }} />
                  </View>
                )}
                {(book.library_info?.library_qr || book.library_qr) && (
                  <Button
                    mode="outlined"
                    icon="qrcode-scan"
                    onPress={handleGenerateQR}
                    style={[styles.searchButton, { marginTop: 10 }]}
                  >
                    View QR Code
                  </Button>
                )}
              </View>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>ISBN:</Text>
                <Text style={styles.detailValue}>{book.isbn || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Publisher:</Text>
                <Text style={styles.detailValue}>{book.publisher || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Published:</Text>
                <Text style={styles.detailValue}>{book.published_date || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Pages:</Text>
                <Text style={styles.detailValue}>{book.page_count || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Location:</Text>
                <Text style={styles.detailValue}>{book.library_info.location || 'N/A'}</Text>
              </View>
              {(book.copy_count || book.available_copies) && (
                <>
                  {/* <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Copies:</Text>
                    <Text style={styles.detailValue}>{book.copy_count || 1}</Text>
                  </View> */}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Available:</Text>
                    <Text style={styles.detailValue}>{book.available_copies || 0} of {book.copy_count || 1}</Text>
                  </View>
                </>
              )}
              {categories.length > 0 && (
                <View style={styles.categoriesContainer}>
                  <Text style={styles.detailLabel}>Categories:</Text>
                  <View style={styles.categoriesWrapper}>
                    {(showAllCategories ? categories : categories.slice(0, 3)).map((category, index) => (
                      <Chip key={index} style={styles.categoryChip} textStyle={styles.categoryChipText}>
                        {category}
                      </Chip>
                    ))}
                    {categories.length > 3 && (
                      <View style={styles.showMoreContainer}>
                        <TouchableOpacity onPress={() => setShowAllCategories(!showAllCategories)} style={styles.showMoreButton}>
                          <Text style={styles.showMoreButtonText}>{showAllCategories ? 'Show Less' : 'Show More'}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
            {book.description && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionTitle}>Description</Text>
                  <Text style={styles.descriptionText}>{book.description}</Text>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        <Card style={[styles.card, styles.historyCard]}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Loan History</Text>
            </View>
            {historyLoading ? (
              <ActivityIndicator size="small" color="#4A90E2" style={{ marginVertical: 20 }} />
            ) : loanHistory.length > 0 ? (
              <>
                {loanHistory.slice(0, 3).map((borrow, index) => (
                  <React.Fragment key={index}>
                    <LoanedBook borrow={borrow} />
                    {index < Math.min(3, loanHistory.length) - 1 && <Divider style={styles.historyDivider} />}
                  </React.Fragment>
                ))}
                {loanHistory.length > 3 && (
                  <TouchableOpacity
                    style={styles.seeMoreButton}
                    onPress={() => navigation.navigate('BorrowingHistory', { book_id: book_id })}
                  >
                    <Text style={styles.seeMoreText}>See More</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <Text style={styles.noHistoryText}>No borrowing history available</Text>
            )}
          </Card.Content>
        </Card>

        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            icon="book-arrow-right" // Updated icon as recommended
            onPress={handleLendBook}
            style={styles.lendButton}
          >
            Lend Book
          </Button>
          <Button
            mode="outlined"
            icon="magnify"
            onPress={handleSearchOnline}
            style={styles.searchButton}
          >
            Search Online
          </Button>
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
  contentContainer: {
    padding: 15,
    paddingBottom: 30,
  },
  adminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  adminTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  adminActions: {
    flexDirection: 'row',
  },
  card: {
    borderRadius: 10,
    elevation: 2,
    marginBottom: 15,
  },
  historyCard: {
    marginTop: 0,
  },
  headerContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  coverImage: {
    width: 120,
    height: 180,
    borderRadius: 8,
  },
  coverPlaceholder: {
    width: 120,
    height: 180,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    marginLeft: 15,
    flex: 1,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
  },
  author: {
    fontSize: 14,
    color: '#666666',
  },
  authorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  authorItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorBy: {
    fontSize: 14,
    color: '#666666',
  },
  authorLink: {
    fontSize: 14,
    color: '#4A90E2',
    textDecorationLine: 'underline',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666666',
    marginRight: 5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  divider: {
    marginVertical: 15,
  },
  detailsContainer: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    width: 80,
    fontSize: 14,
    color: '#666666',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
  },
  categoriesContainer: {
    marginTop: 5,
  },
  categoriesWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  categoryChip: {
    marginRight: 5,
    marginBottom: 5,
    backgroundColor: '#F0F0F0',
  },
  categoryChipText: {
    fontSize: 12,
  },
  showMoreContainer:{
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  showMoreButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginTop: 5,
    marginBottom: 5,
  },
  showMoreButtonText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '500',
  },
  descriptionContainer: {
    marginBottom: 10,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333333',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333333',
  },
  sectionHeader: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  noHistoryText: {
    textAlign: 'center',
    color: '#999999',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  actionButtons: {
    marginTop: 5,
  },
  lendButton: {
    borderColor: '#4A90E2',
    marginBottom: 10,
  },
  searchButton: {
    marginTop: 5,
    borderColor: '#4A90E2',
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 10,
  },
  statusOptionText: {
    fontSize: 16,
  },
  seeMoreButton: {
    marginTop: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  seeMoreText: {
    color: '#4A90E2',
    fontWeight: '500',
  },
  // Drawer-specific styles
  modalStyle: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  drawerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: Dimensions.get('window').height * 0.6, // 60% of screen height
    paddingTop: 20,
  },
  drawerContent: {
    flex: 1,
  },
  drawerScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  drawerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9F9F9',
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    marginBottom: 16,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  phonePrefix: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    height: 50,
    justifyContent: 'center',
  },
  phonePrefixText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  lendSubmitButton: {
    backgroundColor: '#4A90E2',
    marginTop: 20,
    paddingVertical: 5,
  },
  cancelDrawerButton: {
    marginTop: 10,
  },
});

export default BookDetailsScreen;