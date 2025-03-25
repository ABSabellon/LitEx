import React from 'react';
import { View, Text, ActivityIndicator, Modal } from 'react-native';

/**
 * Reusable loading overlay component
 * @param {boolean} visible - Whether the overlay is visible
 * @param {string} message - The message to display (default: "Loading...")
 * @returns {JSX.Element} - The loading overlay component
 */
const LoadingOverlay = ({ visible, message = "Loading..." }) => {
  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
    >
      <View className="flex-1 bg-black/70 justify-center items-center">
        <View className="bg-white rounded-lg p-5 items-center shadow-lg">
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text className="mt-2.5 text-base text-primary font-semibold">{message}</Text>
        </View>
      </View>
    </Modal>
  );
};

export default LoadingOverlay;