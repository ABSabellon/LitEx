import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
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
    <TouchableOpacity onPress={handleCardPress}>
      <Card className="w-[150px] mx-1.5 shadow">
        <Card.Cover
          source={{
            uri: getBookCoverUrl(book) || 'https://via.placeholder.com/150x200?text=No+Cover'
          }}
          className="h-[200px] rounded-t-lg"
        />
        <Card.Content className="p-2 pb-2.5">
          <Title numberOfLines={1} className="text-sm leading-[18px]">
            {book.title}
          </Title>
          <View className="flex-row flex-wrap items-center">
            {book.authorsData && Array.isArray(book.authorsData) && book.authorsData.length > 0 ? (
              book.authorsData.map((author, index) => (
                <View key={index} className="flex-row items-center">
                  <TouchableOpacity onPress={() => handleAuthorPress(author)}>
                    <Text className="text-xs leading-4 text-primary underline" numberOfLines={1}>
                      {index === 0 ? '' : ', '}{author.name}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Paragraph numberOfLines={1} className="text-xs leading-4">
                {book.author}
              </Paragraph>
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
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

export default FeaturedBook;