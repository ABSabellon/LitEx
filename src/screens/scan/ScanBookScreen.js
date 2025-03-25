import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
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
import ScannedBook from '../../components/cards/ScannedBook';
import AddBookForm from '../../components/forms/AddBookForm';

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
      } else {
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
    try {
      if (data) {
        setScannedBooks((prevBooks) => [...prevBooks, data]);
        setAddManually(false);
        setSearchedBook({});
        setSearchInput('');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error adding book:', error);
      Alert.alert('Error', 'Failed to process the ISBN. Please try again.', [{
        text: 'OK',
        onPress: () => {
          setSearchedBook({});
          setSearchInput('');
        }
      }]);
    } finally {
      setLoading(false);
    }
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
      Alert.alert('Error', 'Failed to upload books. Please try again.');
    } finally {
      setLoading(false);
      setLoadingType('');
    }
  };

  if (!permission) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text className="text-white text-center mt-3">Checking camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <MaterialCommunityIcons name="camera-off" size={64} color="#FF3B30" />
        <Text className="text-white text-center mt-3">Camera access is required to scan QR codes.</Text>
        {permission.canAskAgain ? (
          <Button mode="contained" onPress={requestPermission} className="mt-5">
            Grant Permission
          </Button>
        ) : (
          <Button mode="contained" onPress={() => navigation.goBack()} className="mt-5">
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
      <View className="flex-1 bg-black justify-center items-center">
        <CameraView
          className="flex-1 w-full"
          facing="back"
          flashMode="torch"
          barcodeScannerSettings={{ barcodeTypes: ['ean13'] }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
        <View className="absolute top-[50px] left-0 right-0 items-center px-5">
          <Text className="text-white text-xl font-bold text-center bg-black/50 px-4 py-2 rounded-2xl">
            Scan Book ISBN Barcode
          </Text>
          <Text className="text-white text-sm text-center bg-black/50 px-4 py-1 rounded-[15px] mt-2">
            Position Barcode within frame
          </Text>
        </View>
        {scanned && !loading && (
          <TouchableOpacity className="absolute bottom-[50px] flex-row items-center bg-blue-500 p-2.5 rounded-[25px]" onPress={resetScan}>
            <MaterialCommunityIcons name="qrcode-scan" size={28} color="#FFFFFF" />
            <Text className="text-white ml-1 font-bold">Scan Again</Text>
          </TouchableOpacity>
        )}
        <LoadingOverlay visible={loading} message={loadingMessage()} />
        <View className="absolute bottom-5 right-5 p-2.5 z-10">
          <TouchableOpacity onPress={openDrawer}>
            <View className="relative">
              <MaterialCommunityIcons name="menu" size={28} color="#FFFFFF" />
              {!drawerOpen && scannedBooks.length > 0 && (
                <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 justify-center items-center">
                  <Text className="text-white text-xs font-bold">
                    {scannedBooks.length > 99 ? '99+' : scannedBooks.length}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
        {drawerOpen && (
          <>
            <TouchableOpacity className="absolute inset-0 bg-black/50" onPress={closeDrawer} />
            <Animated.View
              className="absolute bottom-0 left-0 right-0 h-3/4 bg-white shadow-lg rounded-t-[20px] z-10"
              style={{ transform: [{ translateY: drawerTranslateY }] }}
            >
              <View className="flex-1 flex-col justify-between">
                <View className="p-2.5 flex-1">
                  <Title className="text-[13px] font-medium text-gray-700 text-center">
                    {scannedBooks.length} Scanned Books
                  </Title>
                  <View className="flex-row items-center mt-2.5 px-2.5">
                    {addManually && (
                      <TouchableOpacity className="p-1.5 mr-2.5" onPress={() => setAddManually(false)}>
                        <MaterialCommunityIcons name="chevron-left" size={32} color="#4A90E2" />
                      </TouchableOpacity>
                    )}
                    <TextInput
                      mode="outlined"
                      placeholder={addManually ? "Enter ISBN..." : "Search scanned books..."}
                      className={`flex-1 h-10 bg-white rounded-[20px] ${addManually ? '' : 'ml-0'}`}
                      left={<TextInput.Icon icon="magnify" />}
                      outlineStyle={{ borderRadius: 20 }}
                      value={searchInput}
                      onChangeText={(text) => setSearchInput(text)}
                      onSubmitEditing={handleSearchSubmit}
                      returnKeyType="search"
                    />
                    {!addManually && (
                      <TouchableOpacity className="ml-2.5 p-1.5" onPress={() => setAddManually(true)}>
                        <MaterialCommunityIcons name="plus" size={32} color="#4A90E2" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <ScrollView
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
                    className="flex-1"
                  >
                    {addManually ? (
                      <AddBookForm
                        initialBookData={searchedBook}
                        handleAddBook={handleAddBook}
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
                      <Text className="text-center text-gray-400 my-5 italic">No scanned books available yet</Text>
                    )}
                  </ScrollView>
                </View>
                {!addManually && scannedBooks.length > 0 && (
                  <View className="flex-row justify-between px-2.5 pb-4 pt-2.5">
                    <TouchableOpacity
                      className="flex-row items-center py-2 px-4 rounded-[20px] flex-1 mx-1.5 justify-center border-2 border-red-500 bg-transparent"
                      onPress={() => setScannedBooks([])}
                    >
                      <MaterialCommunityIcons name="delete-sweep" size={24} color="#FF3B30" />
                      <Text className="text-red-500 text-sm font-bold ml-1.5">clear</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-row items-center py-2 px-4 rounded-[20px] flex-1 mx-1.5 justify-center border-2 border-blue-500 bg-transparent"
                      onPress={uploadBooks}
                    >
                      <MaterialCommunityIcons name="book-plus" size={24} color="#4A90E2" />
                      <Text className="text-blue-500 text-sm font-bold ml-1.5">Add Books</Text>
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

export default ScanBookScreen;