import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { Divider } from 'react-native-paper';
import { getBookBorrowHistory } from '../../services/borrowService';
import BorrowedBook from '../../components/Cards/BorrowedBook';

const BorrowingHistoryScreen = ({navigation, route}) => {
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
          const borrowedBookData = await getBookBorrowHistory(book_id);
          
          if (borrowedBookData) {
            setBorrows(borrowedBookData.data);
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={borrows}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View>
            <BorrowedBook borrow={item} />
            <Divider style={styles.historyDivider} />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No borrowing history found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  historyDivider: {
    marginVertical: 10,
  },
});



export default BorrowingHistoryScreen;