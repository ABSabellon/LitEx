import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getBookById } from '../../services/bookService';

const ScanQRScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertShown, setAlertShown] = useState(false); // Prevent multiple alerts

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
    if (scanned) return;

    setScanned(true);
    setLoading(true);

    try {
      let qrData;
      try {
        qrData = JSON.parse(data);
      } catch (e) {
        Alert.alert('Invalid QR Code', 'This QR code does not contain valid book information.', [{ text: 'OK', onPress: () => setScanned(false) }]);
        setLoading(false);
        return;
      }

      if (!qrData.type || qrData.type !== 'library_book' || !qrData.id) {
        Alert.alert('Invalid QR Code', 'This QR code does not contain valid book information.', [{ text: 'OK', onPress: () => setScanned(false) }]);
        setLoading(false);
        return;
      }

      const bookData = await getBookById(qrData.id);

      if (bookData) {
        // Navigate to admin book details screen
        navigation.navigate('AdminScanBookDetails', { book_id: bookData.id });
      } else {
        Alert.alert('Book Not Found', 'We could not find this book in our library.', [{ text: 'OK', onPress: () => setScanned(false) }]);
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      Alert.alert('Error', 'Failed to process the QR code.', [{ text: 'OK', onPress: () => setScanned(false) }]);
    } finally {
      setLoading(false);
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
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />

      {/* Header Text */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Scan Library QR Code</Text>
        <Text style={styles.subHeaderText}>Position QR code within frame</Text>
      </View>

      {/* Scan Again Button */}
      {scanned && !loading && (
        <TouchableOpacity style={styles.scanButton} onPress={() => setScanned(false)}>
          <MaterialCommunityIcons name="qrcode-scan" size={28} color="#FFFFFF" />
          <Text style={styles.scanButtonText}>Scan Again</Text>
        </TouchableOpacity>
      )}

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Processing book information...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  camera: { 
    flex: 1, 
    width: '100%' 
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
    textAlign: 'center' 
  },
  button: { 
    marginTop: 20, 
    width: 200, 
    backgroundColor: '#4A90E2' 
  },
  torchButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 5,
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
    fontWeight: 'bold' 
  },
  loadingOverlay: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.7)' 
  },
  loadingText: { 
    color: '#FFFFFF', 
    marginTop: 10, 
    fontSize: 16 
  }
});

export default ScanQRScreen;