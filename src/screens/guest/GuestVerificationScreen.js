import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getBorrowsByEmail } from '../../services/borrowService';
import { formatPhilippinesNumber, isValidPhilippinesNumber } from '../../utils/phoneUtils';

const GuestVerificationScreen = ({ navigation }) => {
  const [identifier, setIdentifier] = useState('');
  const [identifierType, setIdentifierType] = useState('email'); // 'email' or 'phone'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');


  const handleIdentifierChange = (value) => {
    if (identifierType === 'phone') {
      // Only allow numeric input for phone
      const numericValue = value.replace(/[^0-9]/g, '');
      setIdentifier(numericValue);
    } else {
      setIdentifier(value);
    }
  };

  const validateIdentifier = () => {
    if (!identifier.trim()) {
      setError('Please enter your email or phone number');
      return false;
    }

    if (identifierType === 'email' && !/\S+@\S+\.\S+/.test(identifier)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (identifierType === 'phone' && !isValidPhilippinesNumber(identifier)) {
      setError('Please enter a valid Philippines mobile number');
      return false;
    }

    setError('');
    return true;
  };

  const handleVerification = async () => {
    if (!validateIdentifier()) return;

    setIsLoading(true);
    try {
      let borrows = [];
      let searchIdentifier = identifier;
      
      // Format phone number to international format if using phone
      if (identifierType === 'phone') {
        searchIdentifier = formatPhilippinesNumber(identifier);
      }
      
      // For now, we only search by email since that's what our borrowService supports
      // Future enhancement: Add search by phone number
      borrows = await getBorrowsByEmail(searchIdentifier);

      if (borrows.length === 0) {
        setError('No borrowed books found with this information');
        setIsLoading(false);
        return;
      }

      // Navigate to MyBooksScreen with guest info
      navigation.navigate('MyBooksTab', {
        screen: 'MyBooks',
        params: {
          guestEmail: searchIdentifier,
          guestVerified: true
        }
      });
    } catch (error) {
      console.error('Error fetching borrowed books:', error);
      setError('Failed to verify. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleIdentifierType = () => {
    setIdentifierType(identifierType === 'email' ? 'phone' : 'email');
    setIdentifier('');
    setError('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="bookshelf" size={64} color="#4A90E2" />
          <Text style={styles.title}>My Borrowed Books</Text>
          <Text style={styles.subtitle}>
            Enter your {identifierType} to view books you've borrowed as a guest
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>
            {identifierType === 'email' ? 'Email Address' : 'Phone Number'}
          </Text>
          {identifierType === 'email' ? (
            <TextInput
              style={[styles.input, error && styles.inputError]}
              placeholder="Your email address"
              value={identifier}
              onChangeText={handleIdentifierChange}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          ) : (
            <View style={styles.phoneInputContainer}>
              <View style={styles.phonePrefix}>
                <Text style={styles.phonePrefixText}>+639</Text>
              </View>
              <TextInput
                style={[styles.phoneInput, error && styles.inputError]}
                placeholder="XXXXXXXXX"
                value={identifier}
                onChangeText={handleIdentifierChange}
                keyboardType="numeric"
                autoCapitalize="none"
              />
            </View>
          )}
          
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <Text style={styles.helperText}>
              We'll use this to find books you've borrowed as a guest
            </Text>
          )}

          <TouchableOpacity
            style={styles.toggleContainer}
            onPress={toggleIdentifierType}
          >
            <Text style={styles.toggleText}>
              Use {identifierType === 'email' ? 'phone number' : 'email'} instead
            </Text>
          </TouchableOpacity>

          <Button
            mode="contained"
            style={styles.verifyButton}
            loading={isLoading}
            disabled={isLoading}
            onPress={handleVerification}
          >
            {isLoading ? 'Verifying...' : 'View My Books'}
          </Button>

          <View style={styles.separatorContainer}>
            <View style={styles.separator} />
            <Text style={styles.separatorText}>OR</Text>
            <View style={styles.separator} />
          </View>
          
          <Button
            mode="contained"
            style={styles.signInButton}
            onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
            icon="account"
            disabled={isLoading}
          >
            Sign In Instead
          </Button>
          
          <Button
            mode="outlined"
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  separator: {
    flex: 1,
    height: 1,
    backgroundColor: '#CCCCCC',
  },
  separatorText: {
    color: '#999999',
    paddingHorizontal: 10,
    fontSize: 14,
  },
  signInButton: {
    marginBottom: 15,
    backgroundColor: '#4A90E2',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  phonePrefix: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    alignSelf: 'center',
    height: 50,
    justifyContent: 'center',
  },
  phonePrefixText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9F9F9',
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    marginBottom: 8,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 16,
  },
  helperText: {
    color: '#999',
    fontSize: 14,
    marginBottom: 16,
  },
  toggleContainer: {
    marginVertical: 16,
    alignSelf: 'center',
  },
  toggleText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '500',
  },
  verifyButton: {
    marginBottom: 12,
    backgroundColor: '#4A90E2',
  },
  cancelButton: {
    borderColor: '#CCCCCC',
  },
});

export default GuestVerificationScreen;