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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { TextInput, Button, Title, Modal, Portal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getBookById } from '../../services/bookService';
import { batchLoanBooks } from '../../services/loanService';
import { Provider as PaperProvider } from 'react-native-paper';
import ScannedBook from '../../components/Cards/ScannedBook';

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
        // Check if the book is already in scannedBooks
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
    outputRange: [600, 0],
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

  return (
    <PaperProvider>
      <View style={styles.container}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />

        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Scan Library QR Code</Text>
          <Text style={styles.subHeaderText}>Position QR code within frame</Text>
        </View>

        {scanned && !loading && (
          <TouchableOpacity style={styles.scanButton} onPress={resetScan}>
            <MaterialCommunityIcons name="qrcode-scan" size={28} color="#FFFFFF" />
            <Text style={styles.scanButtonText}>Scan Again</Text>
          </TouchableOpacity>
        )}

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Processing book information...</Text>
          </View>
        )}

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

        {/* Main Drawer */}
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
                    <TextInput
                      mode="outlined"
                      placeholder="Search scanned books..."
                      style={styles.searchInput}
                      contentStyle={styles.searchContent}
                      left={<TextInput.Icon icon="magnify" />}
                      outlineStyle={styles.searchOutline}
                    />
                  </View>

                  <ScrollView>
                    {scannedBooks.length > 0 ? (
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
                      <Text style={styles.noDataText}>No scanned books available yet</Text>
                    )}
                  </ScrollView>
                </View>

                {scannedBooks.length > 0 && (
                  <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteAllButton]}
                      onPress={() => setScannedBooks([])}
                    >
                      <MaterialCommunityIcons name="delete-sweep" size={24} color="#FF3B30" />
                      <Text style={styles.deleteAllButtonText}>Clear</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.loanBooksButton]}
                      onPress={openLoanModal}
                    >
                      <MaterialCommunityIcons name="book-arrow-right" size={24} color="#4A90E2" />
                      <Text style={styles.loanBooksButtonText}>Loan Books</Text>
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
            contentContainerStyle={styles.loanModalContainer}
            style={styles.modalStyle}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.loanModalContent}
            >
              <ScrollView contentContainerStyle={styles.loanModalScrollContent}>
                <Text style={styles.loanModalTitle}>Loan {scannedBooks.length} Book(s)</Text>
                <Text style={styles.loanModalSubtitle}>Enter guest details</Text>

                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Patron's full name"
                  value={guestDetails.name}
                  onChangeText={(text) => setGuestDetails({ ...guestDetails, name: text })}
                  autoCapitalize="words"
                />

                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Patron's email address"
                  value={guestDetails.email}
                  onChangeText={(text) => setGuestDetails({ ...guestDetails, email: text })}
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
                    value={guestDetails.phone}
                    onChangeText={(value) => setGuestDetails({ ...guestDetails, phone: value.replace(/[^0-9]/g, '') })}
                    keyboardType="numeric"
                  />
                </View>

                <Button
                  mode="contained"
                  onPress={handleLoanSubmit}
                  style={styles.loanSubmitButton}
                  disabled={loanLoading}
                  loading={loanLoading}
                >
                  Submit Loan
                </Button>
                <Button
                  mode="text"
                  onPress={closeLoanModal}
                  style={styles.cancelModalButton}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
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
  text: {
    color: '#FFF',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
  button: {
    marginTop: 20,
    width: 200,
    backgroundColor: '#4A90E2',
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
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
    height: 600,
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
  searchOutline: {
    borderRadius: 20,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: '#FF3B30',
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: 'transparent',
  },
  loanBooksButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: '#4A90E2',
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: 'transparent',
  },
  deleteAllButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  loanBooksButtonText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  modalStyle: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  loanModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: Dimensions.get('window').height * 0.6,
    paddingTop: 20,
  },
  loanModalContent: {
    flex: 1,
  },
  loanModalScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loanModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  loanModalSubtitle: {
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
  loanSubmitButton: {
    backgroundColor: '#4A90E2',
    marginTop: 20,
    paddingVertical: 5,
  },
  cancelModalButton: {
    marginTop: 10,
  },
});

export default ScanQRScreen;