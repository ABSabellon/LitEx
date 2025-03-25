import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#4A90E2" />
      <Text className="mt-2.5 text-base text-gray-800">{message}</Text>
    </View>
  );
};

export default LoadingScreen;