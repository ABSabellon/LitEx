import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Dimensions
} from 'react-native';
import WebView from 'react-native-webview';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Divider,
  Chip,
  Dialog,
  Portal
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getBookById } from '../../services/bookService';
import { useAuth } from '../../context/AuthContext';
import StarRating from '../../components/StarRating';

const BookDetailsScreen = ({ navigation, route }) => {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const { currentUser } = useAuth();
  
  // Get book ID from route params
  const book_id = route.params?.book_id;
  
  // Load book data
  useEffect(() => {
    const fetchBook = async () => {
      if (!book_id) {
        navigation.goBack();
        return;
      }
      
      try {
        setLoading(true);
        const bookData = await getBookById(book_id);
        // console.log('bookData ::: ', bookData.categories)
        if (bookData) {
          setBook(bookData);
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
  
  // Handle borrow button press
  const handleBorrow = () => {
    if (!currentUser) {
      Alert.alert(
        'Sign In or Continue as Guest?',
        'You can sign in to your account or continue as a guest',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Auth') },
          {
            text: 'Continue as Guest',
            onPress: () => navigation.navigate('GuestBorrow', { book })
          }
        ]
      );
      return;
    }
    
    if (book.status !== 'available') {
      Alert.alert('Book Unavailable', 'This book is currently not available for borrowing');
      return;
    }
    
    navigation.navigate('Borrow', { book_id: book.id });
  };
  
  // Handle search online button press
  const handleSearchOnline = () => {
    let searchQuery = `${book.title} ${book.author}`;
    const encodedQuery = encodeURIComponent(searchQuery);
    Linking.openURL(`https://www.google.com/search?q=${encodedQuery}`);
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading book details...</Text>
      </View>
    );
  }
  
  return (
    <>
      <Portal>
        <Dialog visible={showQRDialog} onDismiss={() => setShowQRDialog(false)}>
          <Dialog.Title>Book QR Code</Dialog.Title>
          <Dialog.Content>
            <View style={styles.qrDialogContent}>
              {(book.library_info?.library_qr || book.library_qr) ? (
                <>
                  {(() => {
                    const qrUri = book.library_info?.library_qr || book.library_qr;
                    const isSvg = qrUri.includes('image/svg+xml');
                    
                    if (isSvg) {
                      // For SVG content, use WebView
                      // Get screen width for proper sizing
                      const windowWidth = Dimensions.get('window').width;
                      const qrSize = Math.min(300, windowWidth - 80); // Limit size while ensuring it fits
                      
                      return (
                        <View style={[styles.qrImage, {width: qrSize, height: qrSize}]}>
                          <WebView
                            originWhitelist={['*']}
                            source={{
                              html: `
                                <html>
                                <head>
                                  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                                  <style>
                                    html, body {
                                      margin: 0;
                                      padding: 0;
                                      width: 100%;
                                      height: 100%;
                                      display: flex;
                                      justify-content: center;
                                      align-items: center;
                                      background-color: white;
                                      overflow: hidden;
                                    }
                                    .qr-container {
                                      width: 100%;
                                      height: 100%;
                                      display: flex;
                                      justify-content: center;
                                      align-items: center;
                                    }
                                    img {
                                      width: 95%;
                                      height: 95%;
                                      object-fit: contain;
                                    }
                                  </style>
                                </head>
                                <body>
                                  <div class="qr-container">
                                    <img src="${qrUri}" alt="QR Code" />
                                  </div>
                                </body>
                                </html>
                              `
                            }}
                            style={{ backgroundColor: 'white' }}
                            scalesPageToFit={false}
                            scrollEnabled={false}
                            bounces={false}
                            javaScriptEnabled={true}
                          />
                        </View>
                      );
                    } else {
                      // For regular images (PNG, JPEG)
                      return (
                        <Image
                          source={{ uri: qrUri }}
                          style={styles.qrImage}
                          resizeMode="contain"
                        />
                      );
                    }
                  })()}
                  <Text style={styles.qrDialogText}>
                    Scan this QR code to access this book
                  </Text>
                </>
              ) : (
                <Text style={styles.noQRText}>
                  No QR code available for this book.
                </Text>
              )}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowQRDialog(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.headerContainer}>
            {book.imageUrl ? (
              <Image
                source={{ uri: book.imageUrl }}
                style={styles.coverImage}
                resizeMode="cover"
              />
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
                        onPress={() => {
                          // Get the proper screen name based on current navigation state
                          const routeName = route.name || '';
                          let authorScreenName = 'CatalogAuthorDetails';
                          
                          // Determine which navigation context we're in
                          if (routeName.startsWith('Scan')) {
                            authorScreenName = 'ScanAuthorDetails';
                          } else if (routeName.startsWith('MyBook')) {
                            authorScreenName = 'MyBooksAuthorDetails';
                          }
                          
                          navigation.navigate(authorScreenName, {
                            authorId: author.openLibrary_id,
                            authorName: author.name
                          });
                        }}
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
              
              <View style={styles.statusContainer}>
                <Text style={styles.statusLabel}>Status:</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(book.status) }]}>
                  <Text style={styles.statusText}>
                    {book.status ? book.status.charAt(0).toUpperCase() + book.status.slice(1) : 'Unknown'}
                  </Text>
                </View>
              </View>
              
              {book.average_rating > 0 && (
                <View style={styles.ratingContainer}>
                  <StarRating
                    rating={book.average_rating}
                    count={book.ratingsCount || 0}
                    style={[{marginTop: 5}]}
                  />
                </View>
              )}

              {(book.library_info?.library_qr || book.library_qr) && (
                <Button
                  mode="outlined"
                  icon="qrcode-scan"
                  onPress={() => setShowQRDialog(true)}
                  style={[styles.searchButton, {marginTop: 10}]}
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
            
            {book.categories && book.categories.length > 0 && (
              <View style={styles.categoriesContainer}>
                <Text style={styles.detailLabel}>Categories:</Text>
                <View style={styles.categoriesWrapper}>
                  {(showAllCategories ? book.categories : book.categories.slice(0, 3)).map((category, index) => (
                    <Chip
                      key={index}
                      style={styles.categoryChip}
                      textStyle={styles.categoryChipText}
                    >
                      {category}
                    </Chip>
                  ))}
                  
                  {book.categories.length > 3 && (
                    <TouchableOpacity
                      onPress={() => setShowAllCategories(!showAllCategories)}
                      style={styles.showMoreButton}
                    >
                      <Text style={styles.showMoreButtonText}>
                        {showAllCategories ? 'Show Less' : 'Show More'}
                      </Text>
                    </TouchableOpacity>
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
      
      <View style={styles.actionButtons}>
        {book.status === 'available' ? (
          <Button 
            mode="contained" 
            icon="book-plus" 
            onPress={handleBorrow}
            style={styles.borrowButton}
          >
            Borrow This Book
          </Button>
        ) : (
          <Button 
            mode="contained" 
            disabled
            icon="book" 
            style={styles.unavailableButton}
          >
            {book.status === 'borrowed' ? 'Currently Borrowed' : 'Not Available'}
          </Button>
        )}
        
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666666',
  },
  card: {
    borderRadius: 10,
    elevation: 2,
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
  ratingText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666666',
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
  actionButtons: {
    marginTop: 15,
  },
  borrowButton: {
    marginBottom: 10,
    backgroundColor: '#4A90E2',
    paddingVertical: 5,
  },
  unavailableButton: {
    marginBottom: 10,
    backgroundColor: '#999999',
    paddingVertical: 5,
  },
  searchButton: {
    borderColor: '#4A90E2',
  },
  qrDialogContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  qrImage: {
    width: 200,
    height: 200,
    marginBottom: 15,
  },
  qrDialogText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666666',
  },
  noQRText: {
    textAlign: 'center',
    fontSize: 16,
    fontStyle: 'italic',
    color: '#999999',
    marginVertical: 30,
  },
});

export default BookDetailsScreen;