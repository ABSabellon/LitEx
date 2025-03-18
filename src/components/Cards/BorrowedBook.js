import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Chip, Divider } from 'react-native-paper';

const BorrowedBook = ({  borrow }) => {
  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  };

  return (
    <View style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <Text style={styles.borrowerName} numberOfLines={1} ellipsizeMode="tail">{borrow.borrower.name} ({borrow.borrower.email})</Text>
        <Chip 
          style={[
            styles.historyStatusChip, 
            { backgroundColor: borrow.status === 'returned' ? '#E0F7E0' : '#FFF0E0' }
          ]}
          textStyle={{ 
            color: borrow.status === 'returned' ? '#4CD964' : '#FF9500',
            fontWeight: '500'
          }}
        >
          {borrow.status === 'returned' ? 'Returned' : 'Borrowed'}
        </Chip>
      </View>
      <View style={styles.dateContainer}>
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>Borrowed:</Text>
          <Text style={styles.dateValue}>{formatDate(borrow.borrow_date)}</Text>
        </View>
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>Due:</Text>
          <Text style={styles.dateValue}>{formatDate(borrow.due_date)}</Text>
        </View>
        {borrow.return_date && (
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Returned:</Text>
            <Text style={styles.dateValue}>{formatDate(borrow.return_date)}</Text>
          </View>
        )}
      </View>
      {/* Remove the divider condition since it's handled by the parent */}
    </View>
  );
};

const styles = StyleSheet.create({
  historyItem: {
    marginBottom: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  borrowerName: {
    fontSize: 14,
    fontWeight: '500',
  },
  historyStatusChip: {
    height: 30,
  },
  dateContainer: {
    marginBottom: 5,
  },
  dateItem: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  dateLabel: {
    width: 65,
    fontSize: 12,
    color: '#666666',
  },
  dateValue: {
    fontSize: 12,
    color: '#333333',
  },
});

export default BorrowedBook;