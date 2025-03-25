import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import LoadingOverlay from '../../components/LoadingOverlay';
import { TextInput, Button } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('supertest@test.com');
  const [password, setPassword] = useState('tup5ab8e');
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  
  const { signIn, error } = useAuth();
  
  const handleLogin = async () => {
    try {
      setLoading(true);
      const user = await signIn(email, password);
      if (user) {
        setLoading(false);
        navigation.navigate('User');
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Login Failed', error.message);
    }
  };
  
  useEffect(() => {
    console.log('LoginScreen mounted');
    return () => {
      setLoading(false);
    };
  }, []);
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <LoadingOverlay visible={loading} message="Logging in..." />
      
      <ScrollView className="flex-1 px-5 py-5" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View className="items-center mb-10">
          <Image 
            source={require('../../assets/logo.png')} 
            className="w-[100px] h-[100px]"
            resizeMode="contain"
            onError={(e) => {
              e.target = null;
            }}
          />
          {!require('../../assets/logo.png') && (
            <MaterialCommunityIcons name="book-open-page-variant" size={80} color="#4A90E2" />
          )}
          <Text className="text-2xl font-bold text-gray-800 mt-2.5">Library App</Text>
        </View>
        
        <View className="w-full">
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            className="mb-4"
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon="email" />}
          />
          
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            className="mb-4"
            secureTextEntry={secureTextEntry}
            autoCapitalize="none"
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon 
                icon={secureTextEntry ? "eye" : "eye-off"}
                onPress={() => setSecureTextEntry(!secureTextEntry)} 
              />
            }
          />
          
          <TouchableOpacity 
            className="self-end mb-5"
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text className="text-primary">Forgot Password?</Text>
          </TouchableOpacity>
          
          <Button 
            mode="contained" 
            onPress={handleLogin}
            className="py-1.5 bg-primary"
            loading={loading}
            disabled={loading}
          >
            Log In
          </Button>
          
          <View className="flex-row justify-center mt-5">
            <Text className="text-gray-800">Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text className="text-primary font-bold">Register</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            className="mt-6 items-center justify-center"
            onPress={() => navigation.navigate('AdminRegister')}
          >
            <Text className="text-gray-500 text-xs underline">Admin Registration</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;