import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ScanSelectorScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View className={`flex-1 bg-gray-100 p-5 pt-[${insets.top + 10}px]`}>
      <View className="flex-1 justify-around items-center max-h-[500px]">
        <TouchableOpacity 
          className="bg-white rounded-xl p-5 w-full items-center shadow my-4"
          onPress={() => navigation.navigate('ScanQR')}
        >
          <View className="w-32 h-32 rounded-full bg-blue-50 justify-center items-center mb-5">
            <MaterialCommunityIcons name="qrcode-scan" size={64} color="#4A90E2" />
          </View>
          <Text className="text-xl font-bold text-gray-800 mb-2">Lend Books</Text>
          <Text className="text-sm text-gray-600 text-center px-2.5">
            Scan a QR code to view book details in the library
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="bg-white rounded-xl p-5 w-full items-center shadow my-4"
          onPress={() => navigation.navigate('AdminScanISBN')}
        >
          <View className="w-32 h-32 rounded-full bg-blue-50 justify-center items-center mb-5">
            <MaterialCommunityIcons name="barcode-scan" size={64} color="#4A90E2" />
          </View>
          <Text className="text-xl font-bold text-gray-800 mb-2">Add Books</Text>
          <Text className="text-sm text-gray-600 text-center px-2.5">
            Scan a book's ISBN barcode to add it to the library
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ScanSelectorScreen;