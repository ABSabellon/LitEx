import React from 'react';
import { View, Text } from 'react-native';
import { Chip } from 'react-native-paper';

const LoanedBook = ({ borrow }) => {
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  };

  return (
    <View className="mb-2.5">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-sm font-medium" numberOfLines={1} ellipsizeMode="tail">
          {borrow.guest.name} ({borrow.guest.email})
        </Text>
        <Chip 
          className={`h-[30px] ${borrow.status === 'returned' ? 'bg-[#E0F7E0]' : 'bg-[#FFF0E0]'}`}
          textStyle={{ 
            color: borrow.status === 'returned' ? '#4CD964' : '#FF9500',
            fontWeight: '500'
          }}
        >
          {borrow.status === 'returned' ? 'Returned' : 'Borrowed'}
        </Chip>
      </View>
      <View className="mb-1.5">
        <View className="flex-row mb-0.5">
          <Text className="w-[65px] text-xs text-gray-600">Loaned:</Text>
          <Text className="text-xs text-gray-800">{formatDate(borrow.loaned_date)}</Text>
        </View>
        <View className="flex-row mb-0.5">
          <Text className="w-[65px] text-xs text-gray-600">Due:</Text>
          <Text className="text-xs text-gray-800">{formatDate(borrow.due_date)}</Text>
        </View>
        {borrow.return_date && (
          <View className="flex-row mb-0.5">
            <Text className="w-[65px] text-xs text-gray-600">Returned:</Text>
            <Text className="text-xs text-gray-800">{formatDate(borrow.return_date)}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default LoanedBook;