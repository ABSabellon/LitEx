import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { resetPassword, error } = useAuth();
  
  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    
    try {
      setLoading(true);
      await resetPassword(email);
      Alert.alert(
        'Password Reset Email Sent',
        'Check your email inbox and follow the instructions to reset your password',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ flexGrow: 1 }}>
        <View className={`flex-row items-center mb-7 ${Platform.OS === 'ios' ? 'mt-10' : 'mt-5'}`}>
          <TouchableOpacity
            className="mr-2.5"
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#333333" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-800">Reset Password</Text>
        </View>
        
        <View className="w-full">
          <Text className="text-base text-gray-600 mb-5 leading-[22px]">
            Enter your email address below. We'll send you an email with instructions to reset your password.
          </Text>
          
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            className="mb-6"
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon="email" />}
          />
          
          <Button 
            mode="contained" 
            onPress={handleResetPassword}
            className="py-1.5 bg-primary"
            loading={loading}
            disabled={loading}
          >
            Send Reset Email
          </Button>
          
          <View className="flex-row justify-center mt-5">
            <Text className="text-gray-800">Remember your password? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text className="text-primary font-bold">Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ForgotPasswordScreen;