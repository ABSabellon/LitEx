import React, { useState, useEffect,useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal
} from 'react-native';
import ViewShot, { captureRef }  from 'react-native-view-shot';
import { Card, Title, Paragraph, Button, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { getBookById, generateBookQR } from '../../services/bookService';

const GenerateQRScreen = ({ navigation, route }) => {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrRef, setQrRef] = useState(null);
  const [hasMediaPermission, setHasMediaPermission] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false); 
  const viewShotRef = useRef(null);
  
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
  
  // Check for media library permissions
  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasMediaPermission(status === 'granted');
    })();
  }, []);

  // Save QR code
  const handleSaveQR = async () => {
   
    try {

      setPreviewVisible(true);

    } catch (error) {
      console.error('Error show Label preview:', error);
      Alert.alert('Error', 'Failed to show Label preview');
    }
  };

  const confirmSave = async () => {
    try {
      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1.0,
      });
      if (!hasMediaPermission) {
        Alert.alert(
          'Permission Denied',
          'Media library access is required to save the QR code. Please enable it in Settings.'
        );
        setPreviewVisible(false);
        return;
      }
  
      await MediaLibrary.saveToLibraryAsync(uri);
      console.log('Image saved to Photo Library');
  
      setPreviewVisible(false);
  
      Alert.alert('Success', 'QR code label saved to your Photo Library!');
    } catch (error) {
      console.error('Error saving QR to Photo Library:', error);
      Alert.alert('Error', 'Failed to save QR code to Photo Library');
    }
  };

  const renderSaveLayout = () => (
      <View style={styles.saveLayoutContainer}>

        <ViewShot style={styles.viewShotLayout} ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
          <Text style={styles.saveTitle}>Property of Aileen Sabellon</Text>
          <View style={styles.saveLayout}>
            <View style={styles.saveQrSection}>
              <QRCode
                value={JSON.stringify({
                  id: book.id,
                  title: book.title,
                  author: book.author,
                  type: 'library_book'
                })}
                size={120} // Reduced from 150 to fit better with header
                backgroundColor="white"
                color="black"
                getRef={(ref) => setQrRef(ref)}
              />
            </View>
            <View style={styles.saveDetailsSection}>
              <Text style={styles.saveBookTitle}>{book.title}</Text>
              <Text style={styles.saveSubtitle}>by {book.author}</Text>
            </View>
          </View>
          <Text style={styles.saveInfoText}>{book.library_info?.location} </Text>
      
        </ViewShot>
      </View>
   
  );
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading book details...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Card style={styles.bookCard}>
        <Card.Content>
          <Title style={styles.bookTitle}>{book.title}</Title>
          <Paragraph style={styles.bookAuthor}>by {book.author}</Paragraph>
          <Divider style={styles.divider} />
          
          <View style={styles.qrContainer}>
            <QRCode
              value={JSON.stringify({
                id: book.id,
                title: book.title,
                author: book.author,
                type: 'library_book'
              })}
              size={200}
              backgroundColor="white"
              color="black"
              getRef={(ref) => setQrRef(ref)}
            />
            <Text style={styles.qrText}>Scan for the book details</Text>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.bookInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ISBN:</Text>
              <Text style={styles.infoValue}>{book.isbn || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <View style={[
                styles.statusBadge, 
                { backgroundColor: getStatusColor(book.status) }
              ]}>
                <Text style={styles.statusText}>
                  {book.status ? book.status.charAt(0).toUpperCase() + book.status.slice(1) : 'Unknown'}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location:</Text>
              <Text style={styles.infoValue}>{book.library_info.location || 'Not specified'}</Text>
            </View>

          </View>
        </Card.Content>
      </Card>

      <Button
        mode="outlined"
        icon="download"
        onPress={handleSaveQR}
        style={styles.qrButton}
      >
        Save
      </Button>
      
      <TouchableOpacity 
        style={styles.printHint}
        onPress={() => Alert.alert(
          'Printing the label',
          'For best results, print the label at 300 DPI or higher. Stick the QR code on the book cover or inside the front cover for easy access.'
        )}
      >
        <MaterialCommunityIcons name="information" size={20} color="#4A90E2" />
        <Text style={styles.printHintText}>Printing tips</Text>
      </TouchableOpacity>

      <Modal
        visible={previewVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>Label Preview</Text>
            <View style={styles.previewLayoutContainer}>
              {renderSaveLayout()}
            </View>
            <View style={styles.previewActions}>
              <Button
                mode="outlined"
                onPress={confirmSave}
                style={styles.printSave}
              >
                Save
              </Button>
              <Button
                mode="outlined"
                onPress={() => setPreviewVisible(false)}
                textColor="#FF3B30"
                style={styles.printCancel}
              >
                Cancel
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

// Helper function to determine status color
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
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
  bookCard: {
    borderRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  bookTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  bookAuthor: {
    color: '#666666',
    marginBottom: 10,
  },
  divider: {
    marginVertical: 5,
  },
  qrContainer: {
    alignItems: 'center',
    padding: 10,
  },
  qrText: {
    marginTop: 10,
    color: '#666666',
    fontSize: 14,
  },
  bookInfo: {
    marginTop: 5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    width: 70,
    fontSize: 14,
    color: '#666666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
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
  printHint: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  printHintText: {
    marginLeft: 5,
    color: '#4A90E2',
    fontSize: 14,
  },

  printSave: {
    marginLeft:5,
    marginRight:5,
    marginBottom: 5,
    borderColor: '#4A90E2',
  },
  printCancel: {
    marginLeft:5,
    marginRight:5,
    marginBottom: 5,
    borderColor: '#FF3B30',
  },
  saveLayoutContainer: {
    flexDirection: 'column',
    backgroundColor: 'white',
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewShotLayout: {
    flexDirection: 'column',
    backgroundColor: 'white',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveLayout: {
    flexDirection: 'row',
    backgroundColor: 'white',
    width: '100%',
  },
  saveQrSection: {
    width: '50%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveDetailsSection: {
    width: '50%',
    // paddingLeft: 5,
    justifyContent: 'center',
  },
  saveTitle: {
    fontSize: 20,
    fontWeight: 'bold', 
    marginBottom: 10,
  },
  saveBookTitle: {  
    fontSize: 15,
    fontWeight: '600', 
    marginBottom: 5,
  },
  saveSubtitle: {
    fontSize: 12,  
    color: '#666',
    marginBottom: 5,
  },
  saveInfoText: {
    fontSize: 12,
    marginTop: 5,
    marginBottom:5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  previewContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  previewLayoutContainer: {
    width: 300, 
    height: 180, 
    marginBottom: 20,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  previewButton: {
    flex: 1,
    backgroundColor: '#4A90E2',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  previewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default GenerateQRScreen;