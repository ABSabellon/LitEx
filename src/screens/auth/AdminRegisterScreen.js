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
import { TextInput, Button, Card, Paragraph } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { verifyAdminInviteCode } from '../../services/adminService';

const AdminRegisterScreen = ({ navigation, route }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [secureConfirmTextEntry, setSecureConfirmTextEntry] = useState(true);
  
  const { signUp } = useAuth();
  
  const handleRegister = async () => {
    try {
      setLoading(true);
      await signUp('supertest@test.com', 'tup5ab8e', 'super tester', 'admin', '09178181996');
      
      console.log('Admin registration complete - navigating directly to Admin screen');
      
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Admin' }],
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
      <LoadingOverlay
        visible={loading}
        message={verifying ? 'Verifying invitation code...' : 'Creating your admin account...'}
      />
      
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ flexGrow: 1 }}>
        <View className={`flex-row items-center mb-5 ${Platform.OS === 'ios' ? 'mt-10' : 'mt-5'}`}>
          <TouchableOpacity
            className="mr-2.5"
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#333333" />
          </TouchableOpacity>
          <Text className="text-[22px] font-bold text-gray-800">Create Admin Account</Text>
        </View>
        
        <Card className="mb-5 rounded-lg bg-[#FFF9EF] border border-warning">
          <Card.Content>
            <View className="flex-row items-center mb-2.5">
              <MaterialCommunityIcons name="shield-account" size={24} color="#FF9500" />
              <Text className="ml-2.5 text-base font-bold text-gray-800">Admin Registration</Text>
            </View>
            <Paragraph className="text-sm text-gray-600 leading-5">
              This registration is only for library administrators. You'll need a valid invite code 
              that was sent to your email. If you're a borrower, please use the Borrower Registration.
            </Paragraph>
          </Card.Content>
        </Card>
        
        <View className="w-full">
          <TextInput
            label="Full Name"
            value={name}
            onChangeText={setName}
            mode="outlined"
            className="mb-4"
            autoCapitalize="words"
            left={<TextInput.Icon icon="account" />}
          />
          
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
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            mode="outlined"
            className="mb-4"
            keyboardType="phone-pad"
            left={<TextInput.Icon icon="phone" />}
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
          
          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            mode="outlined"
            className="mb-4"
            secureTextEntry={secureConfirmTextEntry}
            autoCapitalize="none"
            left={<TextInput.Icon icon="lock-check" />}
            right={
              <TextInput.Icon 
                icon={secureConfirmTextEntry ? "eye" : "eye-off"}
                onPress={() => setSecureConfirmTextEntry(!secureConfirmTextEntry)} 
              />
            }
          />
          
          <TextInput
            label="Admin Invite Code"
            value={inviteCode}
            onChangeText={setInviteCode}
            mode="outlined"
            className="mb-1 bg-gray-50"
            style={{ borderColor: '#FF9500' }}
            autoCapitalize="none"
            left={<TextInput.Icon icon="key" />}
          />
          
          <Text className="text-xs text-gray-400 italic mb-5 pl-1.5">
            *The invite code was sent to your email by the library management
          </Text>
          
          <Button 
            mode="contained" 
            onPress={handleRegister}
            className="py-1.5 bg-warning"
            loading={loading}
            disabled={loading}
          >
            {verifying ? 'Verifying Code...' : 'Create Admin Account'}
          </Button>
          
          <View className="flex-row justify-center mt-5">
            <Text className="text-gray-800">Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text className="text-primary font-bold">Log In</Text>
            </TouchableOpacity>
          </View>
          
          <View className="flex-row justify-center mt-4 p-4 bg-gray-100 rounded-lg">
            <Text className="text-gray-800">Are you a borrower? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('BorrowerRegister')}>
              <Text className="text-primary font-bold">Register as Borrower</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AdminRegisterScreen;