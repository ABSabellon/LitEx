import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ScanSelectorScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
   
      <View style={styles.optionsContainer}>
        <TouchableOpacity 
          style={styles.option}
          onPress={() => navigation.navigate('ScanQR')}
        >
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="qrcode-scan" size={64} color="#4A90E2" />
          </View>
          <Text style={styles.optionTitle}>Lend Books</Text>
          <Text style={styles.optionDescription}>
            Scan a QR code to view book details in the library
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.option}
          onPress={() => navigation.navigate('AdminScanISBN')}
        >
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="barcode-scan" size={64} color="#4A90E2" />
          </View>
          <Text style={styles.optionTitle}>Add Books</Text>
          <Text style={styles.optionDescription}>
            Scan a book's ISBN barcode to add it to the library
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  optionsContainer: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    maxHeight: 500,
  },
  option: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginVertical: 15,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
});

export default ScanSelectorScreen;