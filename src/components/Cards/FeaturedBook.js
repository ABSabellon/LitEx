import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getBookCoverUrl } from '../../services/bookService';

const FeaturedBook = ({ book, navigation, bookNavigateTo, authorNavigateTo, admin = false }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return '#4CD964';
      case 'loaned':
        return '#FF9500';
      case 'unavailable':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const handleCardPress = () => {
    if (bookNavigateTo && navigation) {
      navigation.navigate(bookNavigateTo, { book_id: book.id });
    }
  };

  const handleAuthorPress = (author) => {
    if (authorNavigateTo && navigation) {
      navigation.navigate(authorNavigateTo, {
        authorId: author.openLibrary_id,
        authorName: author.name,
      });
    }
  };

  return (
    <TouchableOpacity onPress={handleCardPress} className="w-[150px] mx-1.5 shadow-lg rounded-lg overflow-hidden bg-white">
      <Image
        source={{
          uri: getBookCoverUrl(book) || 'https://via.placeholder.com/150x200?text=No+Cover'
        }}
        className="h-[200px] w-full"
      />
      <View className="p-2">
        <Text numberOfLines={1} className="text-sm font-semibold leading-[18px]">
          {book.title}
        </Text>
        <View className="flex-row flex-wrap items-center mt-1">
          {book.authorsData && Array.isArray(book.authorsData) && book.authorsData.length > 0 ? (
            book.authorsData.map((author, index) => (
              <TouchableOpacity key={index} onPress={() => handleAuthorPress(author)}>
                <Text className="text-xs leading-4 text-primary underline" numberOfLines={1}>
                  {index === 0 ? '' : ', '}{author.name}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text numberOfLines={1} className="text-xs leading-4 text-gray-500">
              {book.author}
            </Text>
          )}
        </View>
        <View className="flex-row justify-between mt-2.5">
          <View className="flex-row items-center">
            <MaterialCommunityIcons name="book-open-page-variant" size={16} color="#4A90E2" />
            <Text className="ml-1.5 text-sm text-gray-600">{book.loan_count ? book.loan_count : 0}</Text>
          </View>
          {book.average_rating > 0 && (
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="star" size={16} color="#FF9500" />
              <Text className="ml-1.5 text-sm text-gray-600">{book.average_rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default FeaturedBook;