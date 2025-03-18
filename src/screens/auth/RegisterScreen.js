import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import LoadingOverlay from '../../components/LoadingOverlay';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatPhilippinesNumber, isValidPhilippinesNumber } from '../../utils/phoneUtils';

const RegisterScreen = ({ navigation, route }) => {
  // Check if we were passed initial values from borrowing flow
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

  // Validate phone number
  const validatePhone = (value) => {
    if (!value) {
      setPhoneError('');
      return true; // Phone is optional
    }
    
    if (!isValidPhilippinesNumber(value)) {
      setPhoneError('Please enter a valid Philippines mobile number (e.g., 09XXXXXXXXX)');
      return false;
    }
    
    setPhoneError('');
    return true;
  };
  
  // Handle phone input change
  const handlePhoneChange = (value) => {
    // Only allow numeric input
    const numericValue = value.replace(/[^0-9]/g, '');
    setPhone(numericValue);
    validatePhone(numericValue);
  };

  const handleRegister = async () => {
    // Validate inputs
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
    
    // Validate phone number
    if (phone && !validatePhone(phone)) {
      return; // Don't proceed if phone number is invalid
    }
    
    try {
      setLoading(true);
      
      // Format phone number to international format
      const formattedPhone = phone ? formatPhilippinesNumber(phone) : '';
      
      // Create the user
      await signUp(email, password, name, 'borrower', formattedPhone);
      // await signUp('test@test.com', 'tup5ab8e', 'test tester', 'borrower', '09178181996');
      
      console.log('Registration complete - navigating directly to Borrower home');
      
      // Force navigation to Borrower screen immediately
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Borrower' }],
        });
      }, 500); // Small delay to ensure auth state is updated
      // Don't set loading to false on success - keep loader visible during navigation
    } catch (error) {
      setLoading(false); // Only hide loader on error
      Alert.alert('Registration Failed', error.message);
    }
  };
  
  // Use effect to cleanup loading state when component unmounts
  useEffect(() => {
    return () => {
      // Reset loading state when component unmounts
      setLoading(false);
    };
  }, []);
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Use the centralized loading overlay component */}
      <LoadingOverlay visible={loading} message="Creating your account..." />
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#333333" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Create Account</Text>
        </View>
        
        <View style={styles.formContainer}>
          <TextInput
            label="Full Name"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            autoCapitalize="words"
            left={<TextInput.Icon icon="account" />}
          />
          
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon="email" />}
          />
          
          <View style={styles.phoneInputContainer}>
            <View style={styles.phonePrefix}>
              <Text style={styles.phonePrefixText}>+639</Text>
            </View>
            <TextInput
              label="Phone Number"
              value={phone}
              onChangeText={handlePhoneChange}
              mode="outlined"
              style={[styles.phoneInput, phoneError ? { marginBottom: 4 } : null]}
              keyboardType="numeric"
              left={<TextInput.Icon icon="phone" />}
              placeholder="XXXXXXXXX"
              error={!!phoneError}
            />
          </View>
          {phoneError ? (
            <HelperText type="error" visible={!!phoneError} style={{marginBottom: 10}}>
              {phoneError}
            </HelperText>
          ) : (
            <HelperText type="info" visible={true} style={{marginBottom: 10}}>
              Philippines mobile format (+639XXXXXXXXX)
            </HelperText>
          )}
          
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            style={styles.input}
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
            style={styles.input}
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
          
          <View style={styles.infoContainer}>
            <MaterialCommunityIcons name="information-outline" size={16} color="#666666" />
            <Text style={styles.infoText}>
              By registering, you'll be able to borrow books from our library
            </Text>
          </View>
          
          <Button 
            mode="contained" 
            onPress={handleRegister}
            style={styles.button}
            loading={loading}
            disabled={loading}
          >
            Create Account
          </Button>
          
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // Removed redundant loading styles
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: Platform.OS === 'ios' ? 40 : 20,
  },
  backButton: {
    marginRight: 10,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 15,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  phonePrefix: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 4,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#c0c0c0',
    alignSelf: 'center',
    height: 56,
    justifyContent: 'center',
  },
  phonePrefixText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  phoneInput: {
    flex: 1,
  },
  infoContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  infoText: {
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  button: {
    padding: 5,
    backgroundColor: '#4A90E2',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#333333',
  },
  loginLink: {
    color: '#4A90E2',
    fontWeight: 'bold',
  },
});

export default RegisterScreen;