import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { createGuestUser, checkUserExists, getGuestByContact } from '../../services/userService';
import { borrowBook } from '../../services/borrowService';
import { formatPhilippinesNumber, isValidPhilippinesNumber } from '../../utils/phoneUtils';

const GuestBorrowScreen = ({ route, navigation }) => {
  const { book } = route.params;
  const [step, setStep] = useState(1);
  const [inputType, setInputType] = useState('email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [initialContact, setInitialContact] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateStep1 = () => {
    let isValid = true;
    let errors = {};

    if (inputType === 'email') {
      if (!initialContact.trim()) {
        errors.initial = 'Email is required';
        isValid = false;
      } else if (!/\S+@\S+\.\S+/.test(initialContact)) {
        errors.initial = 'Email is invalid';
        isValid = false;
      }
    } else {
      if (!initialContact.trim()) {
        errors.initial = 'Phone number is required';
        isValid = false;
      } else if (!isValidPhilippinesNumber(initialContact)) {
        errors.initial = 'Invalid Philippines number';
        isValid = false;
      }
    }

    setErrors(errors);
    return isValid;
  };

  const validateStep2 = () => {
    let isValid = true;
    let errors = {};

    if (!name.trim()) {
      errors.name = 'Name is required';
      isValid = false;
    }

    if (!email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
      isValid = false;
    }

    if (!phone.trim()) {
      errors.phone = 'Phone number is required';
      isValid = false;
    } else if (!isValidPhilippinesNumber(phone)) {
      errors.phone = 'Please enter a valid Philippines mobile number (e.g., 09XXXXXXXXX)';
      isValid = false;
    }

    setErrors(errors);
    return isValid;
  };

  const handleCheckUser = async () => {
    if (!validateStep1()) return;

    setIsLoading(true);
    try {
      
      const contact = inputType === 'email' ? initialContact : formatPhilippinesNumber(initialContact);
      const userExists = await checkUserExists(contact);

      if (userExists) {
        try {
          const user = await getGuestByContact(contact);
          
          if (!user) {
            throw new Error('User not found despite existing contact');
          }
  
          const borrowerDetails = {
            user_id: user.id,
            name: user.profile.name,
            email: user.profile.email,
            phone: user.profile.phone
          };
          
          await borrowBook(book.id, borrowerDetails);
          
          Alert.alert(
            'Book Borrowed',
            'You have successfully borrowed this book. You can check your borrowed books in the My Books section.',
            [{ text: 'OK', onPress: () => navigation.navigate('CatalogTab') }]
          );
        } catch (error) {
          console.error('Error borrowing book for existing user:', error);
          Alert.alert(
            'Borrowing Failed',
            'There was an error borrowing the book. Please try again.',
            [{ text: 'OK' }]
          );
        }
      } else {
        setStep(2);
        if (inputType === 'email') {
          setEmail(initialContact);
        } else {
          setPhone(formatPhilippinesNumber(initialContact));
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
      Alert.alert('Error', 'Failed to check user existence. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBorrow = async () => {
    if (!validateStep2()) return;

    setIsLoading(true);
    try {
      // Format the phone number to international format
      const formattedPhone = formatPhilippinesNumber(phone);
      
      // Create a guest user
      const user = await createGuestUser(name, email, formattedPhone);
      
      // Create a borrower details object for the borrow record
      const borrowerDetails = {
        user_id: user.id,
        name: user.profile.name,
        email: user.profile.email,
        phone: user.profile.phone
      };
      
      // Borrow the book
      await borrowBook(book.id, borrowerDetails);
      
      // Show success message
      Alert.alert(
        'Book Borrowed',
        'You have successfully borrowed this book as a guest. You can check your borrowed books in the My Books section.',
        [{ text: 'OK', onPress: () => navigation.navigate('CatalogTab') }]
      );
    } catch (error) {
      console.error('Error borrowing book:', error);
      Alert.alert('Error', error.message || 'Failed to borrow the book. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Guest Book Borrowing</Text>
          <Text style={styles.subtitle}>
            Provide your details to borrow "{book.title}"
          </Text>
        </View>
  
        <View style={styles.formContainer}>
          {step === 1 ? (
            <>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleButton, inputType === 'email' && styles.activeToggle]}
                  onPress={() => setInputType('email')}
                >
                  <Text style={[styles.toggleText, inputType === 'email' && styles.activeToggleText]}>Email</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, inputType === 'phone' && styles.activeToggle]}
                  onPress={() => setInputType('phone')}
                >
                  <Text style={[styles.toggleText, inputType === 'phone' && styles.activeToggleText]}>Phone</Text>
                </TouchableOpacity>
              </View>
  
              <Text style={styles.label}>{inputType === 'email' ? 'Email Address' : 'Phone Number'}</Text>
              {inputType === 'email' ? (
                <TextInput
                  style={[styles.input, errors.initial && styles.inputError]}
                  placeholder="Your email address"
                  value={initialContact}
                  onChangeText={setInitialContact}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <View style={styles.phoneInputContainer}>
                  <View style={styles.phonePrefix}>
                    <Text style={styles.phonePrefixText}>+63</Text>
                  </View>
                  <TextInput
                    style={[styles.phoneInput, errors.initial && styles.inputError]}
                    placeholder="XXXXXXXXX"
                    value={initialContact}
                    onChangeText={(value) => setInitialContact(value.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                  />
                </View>
              )}
              {errors.initial && <Text style={styles.errorText}>{errors.initial}</Text>}
  
              <TouchableOpacity
                style={styles.borrowButton}
                onPress={handleCheckUser}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.borrowButtonText}>Continue</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="Your full name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
  
              {inputType === 'phone' && (
                <>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder="Your email address"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                </>
              )}
  
              {inputType === 'email' && (
                <>
                  <Text style={styles.label}>Phone Number</Text>
                  <View style={styles.phoneInputContainer}>
                    <View style={styles.phonePrefix}>
                      <Text style={styles.phonePrefixText}>+63</Text>
                    </View>
                    <TextInput
                      style={[styles.phoneInput, errors.phone && styles.inputError]}
                      placeholder="XXXXXXXXX"
                      value={phone}
                      onChangeText={(value) => setPhone(value.replace(/[^0-9]/g, ''))}
                      keyboardType="numeric"
                    />
                  </View>
                  {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
                </>
              )}
  
              <View style={styles.noteContainer}>
                <Text style={styles.noteText}>
                  By borrowing a book as a guest, you agree to our terms and conditions. Your information will be stored for book management purposes.
                </Text>
              </View>
  
              <TouchableOpacity
                style={styles.borrowButton}
                onPress={handleBorrow}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.borrowButtonText}>Borrow Now</Text>
                )}
              </TouchableOpacity>
            </>
          )}
  
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
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
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeToggle: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 16,
    color: '#666',
  },
  activeToggleText: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
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
    marginBottom: 16,
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
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: -12,
    marginBottom: 12,
  },
  helperText: {
    color: '#999',
    fontSize: 14,
    marginTop: -12,
    marginBottom: 12,
  },
  noteContainer: {
    backgroundColor: '#F0F7FF',
    borderRadius: 8,
    padding: 12,
    marginVertical: 16,
  },
  noteText: {
    fontSize: 14,
    color: '#4A90E2',
    lineHeight: 20,
  },
  borrowButton: {
    backgroundColor: '#4A90E2',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  borrowButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GuestBorrowScreen;