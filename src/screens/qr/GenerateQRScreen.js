import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
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
import ViewShot, { captureRef } from 'react-native-view-shot';
import { Card, Title, Paragraph, Button, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { getBookById, generateBookQR } from '../../services/bookService';
import { useAuth } from '../../context/AuthContext';

const GenerateQRScreen = ({ navigation, route }) => {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrRef, setQrRef] = useState(null);
  const [hasMediaPermission, setHasMediaPermission] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const viewShotRef = useRef(null);

  const { currentUser } = useAuth();
  const book_id = route.params?.book_id;

  // Fetch book data
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

  // Check media library permissions
  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasMediaPermission(status === 'granted');
    })();
  }, []);

  // Handle QR code save
  const handleSaveQR = async () => {
    try {
      setPreviewVisible(true);
    } catch (error) {
      console.error('Error showing label preview:', error);
      Alert.alert('Error', 'Failed to show label preview');
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
      console.log('Image saved to Photo Library ::', uri);
      setPreviewVisible(false);
      Alert.alert('Success', 'QR code label saved to your Photo Library!');
    } catch (error) {
      console.error('Error saving QR to Photo Library:', error);
      Alert.alert('Error', 'Failed to save QR code to Photo Library');
    }
  };

  // Determine status background class
  const getStatusClass = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'loaned':
        return 'bg-orange-500';
      case 'unavailable':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Render layout for saving QR code
  const renderSaveLayout = () => (
    <View className="flex-col bg-white w-full h-full border border-black rounded-[10px] p-1.25 items-center justify-center">
      <Text className="text-lg font-medium mb-2.5">Property of {currentUser.display_name}</Text>
      <ViewShot className="flex-col bg-white w-full h-full border border-black rounded-[10px] items-center justify-center">
        <View className="flex-row bg-white w-full">
          <View className="w-1/2 justify-center items-center">
            <QRCode
              value={JSON.stringify({
                id: book.id,
                title: book.title,
                author: book.author,
                type: 'library_book'
              })}
              size={120}
              backgroundColor="white"
              color="black"
              getRef={(ref) => setQrRef(ref)}
            />
          </View>
          <View className="w-1/2 justify-center">
            <Text className="text-[15px] font-semibold mb-1.25">{book.title}</Text>
            <Text className="text-xs text-gray-600 mb-1.25">by {book.author}</Text>
            <Text className="text-xs mt-1.25 mb-1.25">{book.library_info?.location}</Text>
          </View>
        </View>
      </ViewShot>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text className="mt-2.5 text-gray-600">Loading book details...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-100">
      <View className="p-5 pb-10">
        <Card className="rounded-lg shadow-md mb-5">
          <Card.Content>
            <Title className="text-xl font-bold">{book.title}</Title>
            <Paragraph className="text-gray-600 mb-2.5">by {book.author}</Paragraph>
            <Divider className="my-1.25" />
            <View className="items-center p-2.5">
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
              <Text className="mt-2.5 text-gray-600 text-sm">Scan for the book details</Text>
            </View>
            <Divider className="my-1.25" />
            <View className="mt-1.25">
              <View className="flex-row items-center mb-2">
                <Text className="w-[70px] text-sm text-gray-600">ISBN:</Text>
                <Text className="text-sm text-gray-800 flex-1">{book.isbn || 'N/A'}</Text>
              </View>
              <View className="flex-row items-center mb-2">
                <Text className="w-[70px] text-sm text-gray-600">Status:</Text>
                <View className={`px-2 py-0.5 rounded-[12px] ${getStatusClass(book.status)}`}>
                  <Text className="text-white text-xs font-bold">
                    {book.status ? book.status.charAt(0).toUpperCase() + book.status.slice(1) : 'Unknown'}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center mb-2">
                <Text className="w-[70px] text-sm text-gray-600">Location:</Text>
                <Text className="text-sm text-gray-800 flex-1">{book.library_info.location || 'Not specified'}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
        <Button
          mode="outlined"
          icon="download"
          onPress={handleSaveQR}
          className="mb-5"
          style={{ borderColor: '#4A90E2' }}
        >
          Save
        </Button>
        <TouchableOpacity
          className="flex-row items-center justify-center mt-2.5"
          onPress={() => Alert.alert(
            'Printing the label',
            'For best results, print the label at 300 DPI or higher. Stick the QR code on the book cover or inside the front cover for easy access.'
          )}
        >
          <MaterialCommunityIcons name="information" size={20} color="#4A90E2" />
          <Text className="ml-1.25 text-[#4A90E2] text-sm">Printing tips</Text>
        </TouchableOpacity>
      </View>
      <Modal
        visible={previewVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-lg p-5 w-[90%] items-center">
            <Text className="text-lg font-bold mb-3.75">Label Preview</Text>
            <View className="w-[300px] h-[180px] mb-5">
              <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
                {renderSaveLayout()}
              </ViewShot>
            </View>
            <View className="flex-row justify-between w-full">
              <Button
                mode="outlined"
                onPress={confirmSave}
                className="flex-1 mx-1.25 mb-1.25"
                style={{ borderColor: '#4A90E2' }}
              >
                Save
              </Button>
              <Button
                mode="outlined"
                onPress={() => setPreviewVisible(false)}
                className="flex-1 mx-1.25 mb-1.25"
                style={{ borderColor: '#FF3B30' }}
                textColor="#FF3B30"
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

export default GenerateQRScreen;