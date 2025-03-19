import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { TextInput, Button, Title } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getBookByIdentifier, batchUploadBooks } from '../../services/bookService';
import { useAuth } from '../../context/AuthContext';
import LoadingOverlay from '../../components/LoadingOverlay';
import { Provider as PaperProvider } from 'react-native-paper';
import ScannedBook from '../../components/Cards/ScannedBook';
import AddBookForm from '../../components/Forms/AddBookForm';

const { height } = Dimensions.get('window');

const ScanBookScreen = ({ navigation, route }) => {
  const { currentUser } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [isbn, setIsbn] = useState('');
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState('');
  const [alertShown, setAlertShown] = useState(false);
  const [scannedBooks, setScannedBooks] = useState([]);
  const isProcessingRef = useRef(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerAnimation = useRef(new Animated.Value(0)).current;
  const [searchInput, setSearchInput] = useState('');
  const [searchedBook, setSearchedBook] = useState({});
  const [addManually, setAddManually] = useState(false);

  useEffect(() => {
    if (permission && !permission.granted && !permission.canAskAgain && !alertShown) {
      Alert.alert(
        'Camera Permission Denied',
        'Please enable camera access in your device settings to scan QR codes.',
        [{ text: 'OK', onPress: () => setAlertShown(true) }]
      );
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ data, type }) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setScanned(true);
    setLoading(true);
    setLoadingType('scanning');
    try {
      const isbn = data;
      setIsbn(isbn);
      await processISBN(isbn);
    } catch (error) {
      console.error('Error processing QR code:', error);
      Alert.alert('Error', 'Failed to process the scan. Please try again.', [{
        text: 'OK',
        onPress: () => {
          setScanned(false);
          setLoading(false);
          setIsbn('');
          setLoadingType('');
          isProcessingRef.current = false;
        }
      }]);
    }
  };

  const processISBN = async (isbn) => {
    try {
      const book = await getBookByIdentifier('isbn', isbn);
      if (book) {
        setScannedBooks((prevBooks) => [...prevBooks, book]);
        setLoading(false);
      }else{
        Alert.alert('Error', 'Failed to process the ISBN. Please try again.', [{
          text: 'OK',
          onPress: () => {
            setScanned(false);
            setIsbn('');
            isProcessingRef.current = false;
          }
        }]);
      }
    } catch (error) {
      console.error('Error processing ISBN:', error);
      Alert.alert('Error', 'Failed to process the ISBN. Please try again.', [{
        text: 'OK',
        onPress: () => {
          setScanned(false);
          setIsbn('');
          isProcessingRef.current = false;
        }
      }]);
    } finally {
      setLoading(false);
    }
  };

  const resetScan = () => {
    setScanned(false);
    isProcessingRef.current = false;
  };

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.timing(drawerAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(drawerAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setDrawerOpen(false));
  };

  const drawerTranslateY = drawerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [height * 0.75, 0],
  });

  const handleSearchSubmit = async () => {
    setIsbn(searchInput.trim());
    setLoading(true);
    setLoadingType('searching');
    if (addManually) {
      if (searchInput.trim()) {
        try {
          const book = await getBookByIdentifier('isbn', searchInput.trim());
          if (book) {
            setSearchedBook(book);
            setSearchInput('');
            setLoading(false);
          } else {
            Alert.alert('Book Not Found', 'No book found with this ISBN. Please try again.', [{
              text: 'OK',
              onPress: () => {
                setSearchInput('');
                setIsbn('');
              }
            }]);
          }
        } catch (error) {
          console.error('Error processing ISBN:', error);
          Alert.alert('Error', 'Failed to process the ISBN. Please try again.', [{
            text: 'OK',
            onPress: () => {
              setScanned(false);
              setIsbn('');
              setSearchInput('');
              isProcessingRef.current = false;
            }
          }]);
        } finally {
          setLoading(false);
        }
      }
    } else {
      console.log('Searching scanned books for:', searchInput.trim());
    }
  };

  useEffect(() => {
    // console.log('searchedBook :: ', searchedBook);
  }, [searchedBook]);

  const handleAddBook = async (data) => {
    setLoading(true);
    setLoadingType('adding');
    try{
      if(data){
        setScannedBooks((prevBooks) => [...prevBooks, data]);
        setAddManually(false);
        setSearchedBook({});
        setSearchInput('');
        setLoading(false);
      }
    }catch(error){
      console.error('Error adding book:', error); 
      Alert.alert('Error', 'Failed to process the ISBN. Please try again.', [{
        text: 'OK',
        onPress: () => {
          setSearchedBook({});
          setSearchInput('');
        }
      }]);
    }finally{
      setLoading(false);
    }
    // console.log('handleAddBook was clicked',data);
  };

  const getUniqueBooksWithCounts = () => {
    const seenIdentifiers = new Set();
    const uniqueBooks = [];
    const copyCounts = new Map();
    scannedBooks.forEach((book) => {
      const ids = book.identifiers || {};
      const identifierKey =
        ids.isbn_13 || ids.isbn_10 || ids.openlibrary || JSON.stringify(book);
      copyCounts.set(identifierKey, (copyCounts.get(identifierKey) || 0) + 1);
      if (!seenIdentifiers.has(identifierKey)) {
        seenIdentifiers.add(identifierKey);
        uniqueBooks.push(book);
      }
    });
    return uniqueBooks.map((book) => ({
      book,
      copyCount: copyCounts.get(
        book.identifiers?.isbn_13 ||
        book.identifiers?.isbn_10 ||
        book.identifiers?.openlibrary ||
        JSON.stringify(book)
      ),
    }));
  };

  const uploadBooks = async () => {
    if (loading) return;
    setLoading(true);
    setLoadingType('uploading');
    try {
      const result = await batchUploadBooks(scannedBooks, currentUser);
      if (result.success) {
        result.results.forEach(res => {
          if (res.message) console.log(res.message);
          else console.log(`Book uploaded successfully with ID: ${res.id}`);
        });
        setScannedBooks([]);
        Alert.alert('Success', 'Books uploaded successfully!');
      } else {
        throw new Error(result.error || 'Batch upload failed');
      }
    } catch (error) {
      // console.error('Batch upload process failed:', error);
      Alert.alert('Error', 'Failed to upload books. Please try again.');
    } finally {
      setLoading(false);
      setLoadingType('');
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.text}>Checking camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <MaterialCommunityIcons name="camera-off" size={64} color="#FF3B30" />
        <Text style={styles.text}>Camera access is required to scan QR codes.</Text>
        {permission.canAskAgain ? (
          <Button mode="contained" onPress={requestPermission} style={styles.button}>
            Grant Permission
          </Button>
        ) : (
          <Button mode="contained" onPress={() => navigation.goBack()} style={styles.button}>
            Go Back
          </Button>
        )}
      </View>
    );
  }

  const loadingMessage = () => {
    switch (loadingType) {
      case 'uploading': return 'Uploading please wait...';
      case 'adding': return 'Adding book please wait...';
      case 'scanning': return `Locating ISBN: ${isbn} in OpenLibrary...`;
      case 'searching': return `Searching ISBN: ${isbn} in OpenLibrary...`;
      default: return '';
    }
  };

  return (
    <PaperProvider>
      <View style={styles.container}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['ean13'] }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Scan Book ISBN Barcode</Text>
          <Text style={styles.subHeaderText}>Position Barcode within frame</Text>
        </View>
        {scanned && !loading && (
          <TouchableOpacity style={styles.scanButton} onPress={resetScan}>
            <MaterialCommunityIcons name="qrcode-scan" size={28} color="#FFFFFF" />
            <Text style={styles.scanButtonText}>Scan Again</Text>
          </TouchableOpacity>
        )}
        <LoadingOverlay visible={loading} message={loadingMessage()} />
        <View style={styles.openDrawerButton}>
          <TouchableOpacity onPress={openDrawer}>
            <View style={styles.buttonContainer}>
              <MaterialCommunityIcons name="menu" size={28} color={'#FFFFFF'} />
              {!drawerOpen && scannedBooks.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {scannedBooks.length > 99 ? '99+' : scannedBooks.length}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
        {drawerOpen && (
          <>
            <TouchableOpacity style={styles.overlay} onPress={closeDrawer} />
            <Animated.View
              style={[
                styles.drawerContainer,
                { transform: [{ translateY: drawerTranslateY }] },
              ]}
            >
              <View style={styles.drawerContent}>
                <View style={styles.drawerSection}>
                  <Title style={styles.drawerTitle}>{scannedBooks.length} Scanned Books</Title>
                  <View style={styles.searchContainer}>
                    {addManually && (
                      <TouchableOpacity style={styles.chevronButton} onPress={() => setAddManually(false)}>
                        <MaterialCommunityIcons name="chevron-left" size={32} color="#4A90E2" />
                      </TouchableOpacity>
                    )}
                    <TextInput
                      mode="outlined"
                      placeholder={addManually ? "Enter ISBN..." : "Search scanned books..."}
                      style={[styles.searchInput, addManually && styles.searchInputWithChevron]}
                      contentStyle={styles.searchContent}
                      left={<TextInput.Icon icon="magnify" />}
                      outlineStyle={styles.searchOutline}
                      value={searchInput}
                      onChangeText={(text) => setSearchInput(text)}
                      onSubmitEditing={handleSearchSubmit}
                      returnKeyType="search"
                    />
                    {!addManually && (
                      <TouchableOpacity style={styles.plusButton} onPress={() => setAddManually(true)}>
                        <MaterialCommunityIcons name="plus" size={32} color="#4A90E2" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    style={styles.scrollView}
                  >
                    {addManually ? (
                      <AddBookForm
                        initialBookData={searchedBook}
                        handleAddBook={handleAddBook} // Changed onSubmit to handleAddBook to match prop name
                      />
                    ) : scannedBooks.length > 0 ? (
                      getUniqueBooksWithCounts().map(({ book, copyCount }, index) => (
                        <ScannedBook
                          key={book.identifiers?.isbn_13 || book.identifiers?.isbn_10 || index}
                          data={book}
                          copyCount={copyCount}
                          onDelete={() => {
                            setScannedBooks((prev) => {
                              let found = false;
                              return prev.filter((b) => {
                                if (found) return true;
                                const bIds = b.identifiers || {};
                                const bookIds = book.identifiers || {};
                                const isMatch =
                                  (bIds.isbn_10 && bIds.isbn_10 === bookIds.isbn_10) ||
                                  (bIds.isbn_13 && bIds.isbn_13 === bookIds.isbn_13) ||
                                  (bIds.openlibrary && bIds.openlibrary === bookIds.openlibrary);
                                if (isMatch) {
                                  found = true;
                                  return false;
                                }
                                return true;
                              });
                            });
                          }}
                          onAdd={() => {
                            setScannedBooks((prev) => [...prev, { ...book }]);
                          }}
                        />
                      ))
                    ) : (
                      <Text style={styles.noDataText}>No scanned books available yet</Text>
                    )}
                  </ScrollView>
                </View>
                {!addManually && scannedBooks.length > 0 && (
                  <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteAllButton]}
                      onPress={() => setScannedBooks([])}
                    >
                      <MaterialCommunityIcons name="delete-sweep" size={24} color="#FF3B30" />
                      <Text style={styles.deleteAllButtonText}>clear</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.addBooksButton]}
                      onPress={uploadBooks}
                    >
                      <MaterialCommunityIcons name="book-plus" size={24} color="#4A90E2" />
                      <Text style={styles.addBooksButtonText}>Add Books</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </Animated.View>
          </>
        )}
      </View>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  subHeaderText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    marginTop: 8,
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  scanButton: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    padding: 10,
    borderRadius: 25,
  },
  scanButtonText: {
    color: '#FFFFFF',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  text: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 12,
  },
  button: {
    marginTop: 20,
  },
  openDrawerButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    padding: 10,
    zIndex: 10,
  },
  buttonContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF0000',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.75,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  drawerContent: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  drawerSection: {
    padding: 10,
    flex: 1,
  },
  drawerTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
  },
  plusButton: {
    marginLeft: 10,
    padding: 5,
  },
  chevronButton: {
    padding: 5,
    marginRight: 10,
  },
  searchInputWithChevron: {
    flex: 1,
  },
  searchOutline: {
    borderRadius: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20, // Ensure padding at the bottom for scrollable content
  },
  noDataText: {
    textAlign: 'center',
    color: '#999999',
    marginVertical: 20,
    fontStyle: 'italic',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingBottom: 15,
    paddingTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 5,
  },
  deleteAllButton: {
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FF3B30',
    backgroundColor: 'transparent',
  },
  addBooksButton: {
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#4A90E2',
    backgroundColor: 'transparent',
  },
  deleteAllButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  addBooksButtonText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

export default ScanBookScreen;