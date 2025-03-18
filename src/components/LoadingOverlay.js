import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Modal } from 'react-native';

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
      <View style={styles.loadingOverlay}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '600',
  },
});

export default LoadingOverlay;