import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { Divider } from 'react-native-paper';
import { getBookLoanHistory } from '../../services/loanService';
import LoanedBook from '../../components/cards/LoanedBook';

const LoanedHistoryScreen = ({ navigation, route }) => {
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const book_id = route.params?.book_id;

  useEffect(() => {
    const fetchBook = async () => {
      if (!book_id) {
        navigation.goBack();
        return;
      }

      try {
        setLoading(true);
        const loanedBookData = await getBookLoanHistory(book_id);

        if (loanedBookData) {
          setBorrows(loanedBookData.data);
        } else {
          Alert.alert('Error', 'Book not found');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error loading book:', error);
        Alert.alert('Error', 'Failed to load book details');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [book_id]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-5">
        <Text className="text-red-500 text-base text-center">Error: {error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={borrows}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View>
            <LoanedBook borrow={item} />
            <Divider className="my-2.5" />
          </View>
        )}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center mt-12">
            <Text className="text-base text-gray-600">No borrowing history found</Text>
          </View>
        }
      />
    </View>
  );
};

export default LoanedHistoryScreen;