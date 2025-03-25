import React from 'react';
import {
  View,
  Text,
  TouchableOpacity
} from 'react-native';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';

const AuthPromptScreen = ({ navigation }) => {
  const navigateToAuth = (screen) => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          { 
            name: 'Auth',
            state: {
              routes: [{ name: screen }]
            }
          }
        ],
      })
    );
  };

  return (
    <View className="flex-1 p-5 items-center justify-center bg-white">
      <View className="mb-5">
        <MaterialCommunityIcons name="account-lock" size={80} color="#4A90E2" />
      </View>
      
      <Text className="text-2xl font-bold mb-4 text-gray-800 text-center">
        Sign In Required
      </Text>
      
      <Text className="text-base text-center mb-8 text-gray-600 leading-5">
        You need to sign in or create an account to access your profile and 
        borrowing features.
      </Text>
      
      <View className="w-full mb-5">
        <Button
          mode="contained"
          className="mb-4 bg-blue-600 py-1"
          onPress={() => navigateToAuth('Login')}
        >
          Sign In
        </Button>
        
        <Button
          mode="outlined"
          className="border-blue-600 py-1"
          onPress={() => navigateToAuth('Register')}
        >
          Create Account
        </Button>
      </View>
      
      <TouchableOpacity 
        className="mt-2.5 p-2.5"
        onPress={() => navigation.navigate('HomeTab')}
      >
        <Text className="text-gray-600 text-base">
          Continue Browsing
        </Text>
      </TouchableOpacity>
      
      <View className="mt-8 p-4 bg-gray-100 rounded-lg w-full">
        <Text className="text-sm text-gray-600 text-center leading-5">
          As a guest, you can still browse the catalog or borrow books, 
          but you'll need an account to access personalized features.
        </Text>
      </View>
    </View>
  );
};

export default AuthPromptScreen;