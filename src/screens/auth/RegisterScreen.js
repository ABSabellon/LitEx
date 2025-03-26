import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import LoadingOverlay from '../../components/LoadingOverlay';
import { Button, TextInput, HelperText } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatPhilippinesNumber, isValidPhilippinesNumber } from '../../utils/phoneUtils';
import InputForm from '../../components/forms/InputForm';

const RegisterScreen = ({ navigation, route }) => {
  const initialValues = route.params?.initialValues || {};
  
  const [name, setName] = useState(initialValues.name || '');
  const [email, setEmail] = useState(initialValues.email || '');
  const [phone, setPhone] = useState(initialValues.phone || '');
  const [phoneError, setPhoneError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [secureConfirmTextEntry, setSecureConfirmTextEntry] = useState(true);
  
  const { signUp } = useAuth();

  const validatePhone = (value) => {
    if (!value) {
      setPhoneError('');
      return true;
    }
    
    if (!isValidPhilippinesNumber(value)) {
      setPhoneError('Please enter a valid Philippines mobile number (e.g., 09XXXXXXXXX)');
      return false;
    }
    
    setPhoneError('');
    return true;
  };
  
  const handlePhoneChange = (value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setPhone(numericValue);
    validatePhone(numericValue);
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      Alert.alert('Error', 'Password should be at least 6 characters');
      return;
    }
    
    if (phone && !validatePhone(phone)) {
      return;
    }
    
    try {
      setLoading(true);
      const formattedPhone = phone ? formatPhilippinesNumber(phone) : '';
      await signUp(email, password, name, 'borrower', formattedPhone);
      
      console.log('Registration complete - navigating directly to Borrower home');
      
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Borrower' }],
        });
      }, 500);
    } catch (error) {
      setLoading(false);
      Alert.alert('Registration Failed', error.message);
    }
  };
  
  useEffect(() => {
    return () => {
      setLoading(false);
    };
  }, []);
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <LoadingOverlay visible={loading} message="Creating your account..." />
      
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ flexGrow: 1 }}>
        <View className={`flex-row items-center mb-7 ${Platform.OS === 'ios' ? 'mt-10' : 'mt-5'}`}>
          <TouchableOpacity
            className="mr-2.5"
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#333333" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-800">Create Account</Text>
        </View>
        
        <View className="w-full">
          <InputForm
            type="text"
            label="Full Name"
            value={name}
            onChange={setName}
            mode="outlined"
            className="mb-4"
            autoCapitalize="words"
            leftIcon={<TextInput.Icon icon="account" />}
          />
          
          <InputForm
            type="email"
            label="Email"
            value={email}
            onChange={setEmail}
            mode="outlined"
            className="mb-4"
            leftIcon={<TextInput.Icon icon="email" />}
          />
          
          <View className="flex-row items-center mb-0">
            <View className="bg-gray-100 px-3 py-4 rounded border border-gray-300 mr-2 h-[56px] justify-center">
              <Text className="text-base font-medium text-gray-800">+639</Text>
            </View>
            <InputForm
              type="phone"
              label="Phone Number"
              value={phone}
              onChange={handlePhoneChange}
              mode="outlined"
              className="flex-1"
              leftIcon={<TextInput.Icon icon="phone" />}
              placeholder="XXXXXXXXX"
              error={phoneError}
            />
          </View>
          {phoneError ? (
            <HelperText type="error" visible={!!phoneError} className="mb-2.5">
              {phoneError}
            </HelperText>
          ) : (
            <HelperText type="info" visible={true} className="mb-2.5">
              Philippines mobile format (+639XXXXXXXXX)
            </HelperText>
          )}
          
          <InputForm
            type="password"
            label="Password"
            value={password}
            onChange={setPassword}
            mode="outlined"
            className="mb-4"
            secureTextEntry={secureTextEntry}
            leftIcon={<TextInput.Icon icon="lock" />}
            rightIcon={
              <TextInput.Icon 
                icon={secureTextEntry ? "eye" : "eye-off"}
                onPress={() => setSecureTextEntry(!secureTextEntry)} 
              />
            }
          />
          
          <InputForm
            type="password"
            label="Confirm Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            mode="outlined"
            className="mb-4"
            secureTextEntry={secureConfirmTextEntry}
            leftIcon={<TextInput.Icon icon="lock-check" />}
            rightIcon={
              <TextInput.Icon 
                icon={secureConfirmTextEntry ? "eye" : "eye-off"}
                onPress={() => setSecureConfirmTextEntry(!secureConfirmTextEntry)} 
              />
            }
          />
          
          <View className="flex-row p-3 bg-gray-100 rounded-lg mb-5 items-start">
            <MaterialCommunityIcons name="information-outline" size={16} color="#666666" />
            <Text className="ml-2.5 flex-1 text-sm text-gray-600 leading-5">
              By registering, you'll be able to borrow books from our library
            </Text>
          </View>
          
          <Button 
            mode="contained" 
            onPress={handleRegister}
            className="py-1.5 bg-primary"
            loading={loading}
            disabled={loading}
          >
            Create Account
          </Button>
          
          <View className="flex-row justify-center mt-5">
            <Text className="text-gray-800">Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text className="text-primary font-bold">Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;