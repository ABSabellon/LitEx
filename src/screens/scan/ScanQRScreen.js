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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { TextInput, Button, Title, Modal, Portal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getBookById } from '../../services/bookService';
import { batchLoanBooks } from '../../services/loanService';
import { Provider as PaperProvider } from 'react-native-paper';
import ScannedBook from '../../components/cards/ScannedBook';

const { height } = Dimensions.get('window');

const ScanQRScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertShown, setAlertShown] = useState(false);
  const [scannedBooks, setScannedBooks] = useState([]);
  const isProcessingRef = useRef(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerAnimation = useRef(new Animated.Value(0)).current;
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [guestDetails, setGuestDetails] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [loanLoading, setLoanLoading] = useState(false);
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

  const handleBarcodeScanned = async ({ data }) => {
    if (isProcessingRef.current) return;

    isProcessingRef.current = true;
    setScanned(true);
    setLoading(true);

    try {
      let qrData;
      try {
        qrData = JSON.parse(data);
      } catch (e) {
        Alert.alert('Invalid QR Code', 'This QR code does not contain valid book information.', [{
          text: 'OK',
          onPress: () => resetScan(),
        }]);
        setLoading(false);
        return;
      }

      if (!qrData.type || qrData.type !== 'library_book' || !qrData.id) {
        Alert.alert('Invalid QR Code', 'This QR code does not contain valid book information.', [{
          text: 'OK',
          onPress: () => resetScan(),
        }]);
        setLoading(false);
        return;
      }

      const bookData = await getBookById(qrData.id);

      if (bookData) {
        const isDuplicate = scannedBooks.some((book) => book.id === bookData.id);
        if (isDuplicate) {
          Alert.alert('Duplicate Scan', 'You can only loan one copy per book.', [{
            text: 'OK',
            onPress: () => resetScan(),
          }]);
        } else {
          setScannedBooks((prevBooks) => [...prevBooks, bookData]);
        }
      } else {
        Alert.alert('Book Not Found', 'We could not find this book in our library.', [{
          text: 'OK',
          onPress: () => resetScan(),
        }]);
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      Alert.alert('Error', 'Failed to process the QR code.', [{
        text: 'OK',
        onPress: () => resetScan(),
      }]);
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
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

  const openLoanModal = () => {
    setShowLoanModal(true);
  };

  const closeLoanModal = () => {
    setShowLoanModal(false);
    setGuestDetails({ name: '', email: '', phone: '' });
  };

  const handleLoanSubmit = async () => {
    if (!guestDetails.name.trim() || !guestDetails.email.trim() || !guestDetails.phone.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(guestDetails.email)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }
    if (!/^09\d{9}$/.test(guestDetails.phone)) {
      Alert.alert('Error', 'Please enter a valid Philippines mobile number (e.g., 09XXXXXXXXX).');
      return;
    }

    setLoanLoading(true);
    try {
      const bookIds = scannedBooks.map(book => book.id);
      const formattedPhone = `+63${guestDetails.phone.slice(1)}`;
      const result = await batchLoanBooks(bookIds, {
        name: guestDetails.name,
        email: guestDetails.email,
        phone: formattedPhone,
      });

      if (result.success) {
        Alert.alert('Success', result.message, [{
          text: 'OK',
          onPress: () => {
            setScannedBooks([]);
            closeLoanModal();
          },
        }]);
      } else {
        throw new Error('Batch loan process returned unsuccessful');
      }
    } catch (error) {
      console.error('Loan process failed:', error);
      Alert.alert('Error', `Failed to loan books: ${error.message}`);
    } finally {
      setLoanLoading(false);
    }
  };

  if (!permission) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text className="text-white text-base mt-5 text-center">
          Checking camera permissions...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <MaterialCommunityIcons name="camera-off" size={64} color="#FF3B30" />
        <Text className="text-white text-base mt-5 text-center">
          Camera access is required to scan QR codes.
        </Text>
        {permission.canAskAgain ? (
          <Button
            mode="contained"
            onPress={requestPermission}
            className="mt-5 w-48" // Width approximates 200px
            style={{ backgroundColor: '#4A90E2' }} // className may not override bg for Button, using style
          >
            Grant Permission
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={() => navigation.goBack()}
            className="mt-5 w-48"
            style={{ backgroundColor: '#4A90E2' }}
          >
            Go Back
          </Button>
        )}
      </View>
    );
  }

  return (
    <PaperProvider>
      <View className="flex-1 bg-black justify-center items-center">
        <CameraView
          className="flex-1 w-full"
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />

        <View className="absolute top-[50px] left-0 right-0 items-center px-5">
          <Text className="text-white text-xl font-bold text-center bg-black/50 px-4 py-2 rounded-[20px]">
            Scan Library QR Code
          </Text>
          <Text className="text-white text-sm text-center bg-black/50 px-4 py-1 rounded-[15px] mt-2">
            Position QR code within frame
          </Text>
        </View>

        {scanned && !loading && (
          <TouchableOpacity
            className="absolute bottom-[50px] flex-row items-center bg-[#4A90E2] p-[10px] rounded-[25px]"
            onPress={resetScan}
          >
            <MaterialCommunityIcons name="qrcode-scan" size={28} color="#FFFFFF" />
            <Text className="text-white ml-1.5 font-bold">Scan Again</Text>
          </TouchableOpacity>
        )}

        {loading && (
          <View className="absolute top-0 left-0 right-0 bottom-0 justify-center items-center bg-black/70">
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text className="text-white mt-2.5 text-base">
              Processing book information...
            </Text>
          </View>
        )}

        <View className="absolute bottom-5 right-5 p-2.5 z-10">
          <TouchableOpacity onPress={openDrawer}>
            <View className="relative">
              <MaterialCommunityIcons name="menu" size={28} color="#FFFFFF" />
              {!drawerOpen && scannedBooks.length > 0 && (
                <View className="absolute -top-1.5 -right-1.5 bg-red-500 rounded-full w-5 h-5 justify-center items-center">
                  <Text className="text-white text-xs font-bold">
                    {scannedBooks.length > 99 ? '99+' : scannedBooks.length}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Main Drawer */}
        {drawerOpen && (
          <>
            <TouchableOpacity
              className="absolute top-0 left-0 right-0 bottom-0 bg-black/50"
              onPress={closeDrawer}
            />
            <Animated.View
              className="absolute bottom-0 left-0 right-0 h-[75%] bg-white rounded-t-2xl"
              style={{ transform: [{ translateY: drawerTranslateY }] }}
            >
              <View className="flex-1 flex-col justify-between">
                <View className="p-2.5 flex-1 h-full">
                  <Text className="text-3 font-medium text-gray-700 text-center">
                    {scannedBooks.length} Scanned Books
                  </Text>

                  <View className="flex-row items-center mt-2.5 px-2.5">
                    {addManually && (
                      <TouchableOpacity
                        className="p-1.5 mr-2.5"
                        onPress={() => setAddManually(false)}
                      >
                        <MaterialCommunityIcons name="chevron-left" size={32} color="#4A90E2" />
                      </TouchableOpacity>
                    )}

                    <View className="flex-1">
                      <TextInput
                        mode="outlined"
                        placeholder={addManually ? "Enter ISBN, Book Name, Author..." : "Search scanned books..."}
                        className=" rounded-xl w-full"
                        left={<TextInput.Icon icon="magnify" />}
                        outlineStyle={{ borderRadius: 20 }} // Kept as style due to outlineStyle prop
                      />
                    </View>

                    {!addManually && (
                      <TouchableOpacity
                        className="ml-2.5 p-1.5"
                        onPress={() => setAddManually(true)}
                      >
                        <MaterialCommunityIcons name="plus" size={32} color="#4A90E2" />
                      </TouchableOpacity>
                    )}
                  </View>


                  <ScrollView>
                    {addManually ? (
                      <TouchableOpacity className="flex-row items-center justify-center p-5 mt-5 h-full">
                        <MaterialCommunityIcons name="book-plus" size={32} color="#4A90E2" />
                        <Text className="text-base text-[#4A90E2] ml-2.5 font-medium">
                          Add Manually
                        </Text>
                      </TouchableOpacity>
                    ) : scannedBooks.length > 0 ? (
                      scannedBooks.map((book, index) => (
                        <ScannedBook
                          key={book.id || index}
                          data={{
                            title: book.title,
                            authors: book.author
                              ? [{ name: book.author }]
                              : book.authorsData
                              ? book.authorsData.map((author) => ({ name: author.name }))
                              : [],
                            covers: book.media?.covers || {},
                            ratings: {
                              summary: {
                                average: book.average_rating || 0,
                              },
                            },
                          }}
                          onDelete={() => {
                            setScannedBooks((prev) =>
                              prev.filter((b) => b.id !== book.id || JSON.stringify(b) !== JSON.stringify(book))
                            );
                          }}
                        />
                      ))
                    ) : (
                      <Text className="text-center text-gray-400 mt-5 italic">
                        No scanned books available yet
                      </Text>
                    )}
                  </ScrollView>
                </View>

                {!addManually && scannedBooks.length > 0 && (
                  <View className="flex-row justify-between px-2.5 pb-4 pt-2.5">
                    <TouchableOpacity
                      className="flex-row items-center justify-center py-2 px-4 border-2 border-red-500 rounded-xl flex-1 mx-1.5 bg-transparent"
                      onPress={() => setScannedBooks([])}
                    >
                      <MaterialCommunityIcons name="delete-sweep" size={24} color="#FF3B30" />
                      <Text className="text-red-500 text-sm font-bold ml-1.5">Clear</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-row items-center justify-center py-2 px-4 border-2 border-[#4A90E2] rounded-xl flex-1 mx-1.5 bg-transparent"
                      onPress={openLoanModal}
                    >
                      <MaterialCommunityIcons name="book-arrow-right" size={24} color="#4A90E2" />
                      <Text className="text-[#4A90E2] text-sm font-bold ml-1.5">Loan Books</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </Animated.View>
          </>
        )}

        {/* Loan Modal */}
        <Portal>
          <Modal
            visible={showLoanModal}
            onDismiss={closeLoanModal}
            contentContainerStyle={{}} // Replaced with className on inner View
            style={{ justifyContent: 'flex-end', margin: 0 }} // Kept as style for Modal-specific props
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              className="flex-1"
            >
              <ScrollView className="px-5 pb-5">
                <Text className="text-xl font-bold text-gray-800 mb-2">
                  Loan {scannedBooks.length} Book(s)
                </Text>
                <Text className="text-sm text-gray-600 mb-5">Enter guest details</Text>

                <Text className="text-base font-medium text-gray-800 mb-2">Full Name</Text>
                <TextInput
                  className="bg-gray-100 h-12 rounded-lg px-4 text-base text-gray-800 border border-gray-200 mb-4"
                  placeholder="Patron's full name"
                  value={guestDetails.name}
                  onChangeText={(text) => setGuestDetails({ ...guestDetails, name: text })}
                  autoCapitalize="words"
                />

                <Text className="text-base font-medium text-gray-800 mb-2">Email Address</Text>
                <TextInput
                  className="bg-gray-100 h-12 rounded-lg px-4 text-base text-gray-800 border border-gray-200 mb-4"
                  placeholder="Patron's email address"
                  value={guestDetails.email}
                  onChangeText={(text) => setGuestDetails({ ...guestDetails, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Text className="text-base font-medium text-gray-800 mb-2">Phone Number</Text>
                <View className="flex-row items-center mb-4">
                  <View className="bg-gray-200 px-3 py-4 rounded-lg border border-gray-300 h-12 justify-center mr-2">
                    <Text className="text-base font-medium text-gray-700">+63</Text>
                  </View>
                  <TextInput
                    className="flex-1 bg-gray-100 h-12 rounded-lg px-4 text-base text-gray-800 border border-gray-200"
                    placeholder="XXXXXXXXX"
                    value={guestDetails.phone}
                    onChangeText={(value) => setGuestDetails({ ...guestDetails, phone: value.replace(/[^0-9]/g, '') })}
                    keyboardType="numeric"
                  />
                </View>

                <Button
                  mode="contained"
                  onPress={handleLoanSubmit}
                  className="mt-5 py-1"
                  style={{ backgroundColor: '#4A90E2' }} // className bg doesn’t override, using style
                  disabled={loanLoading}
                  loading={loanLoading}
                >
                  Submit Loan
                </Button>
                <Button
                  mode="text"
                  onPress={closeLoanModal}
                  className="mt-2.5"
                >
                  Cancel
                </Button>
              </ScrollView>
            </KeyboardAvoidingView>
          </Modal>
        </Portal>
      </View>
    </PaperProvider>
  );
};

export default ScanQRScreen;