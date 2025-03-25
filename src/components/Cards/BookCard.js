import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Button,
  Title,
  Chip,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StarRating from '../StarRating';
import { getBookCoverUrl } from '../../services/bookService';

const BookCard = ({ book, navigation, bookNavigateTo, authorNavigateTo, admin = false }) => {
  const categories = Array.isArray(book.categories)
    ? book.categories
    : typeof book.categories === 'string'
      ? book.categories.split(', ')
      : [];

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
    <Card 
      className="mb-2.5 rounded-lg shadow"
      onPress={handleCardPress}
    >
      <Card.Content className="flex-row h-[150px]">
        <View className="flex-1 mr-2.5">
          <Title className="text-base leading-[22px]">{book.title}</Title>
          <View className="flex-row flex-wrap items-center">
            {book.authorsData && Array.isArray(book.authorsData) && book.authorsData.length > 0 ? (
              <Text className="text-sm text-gray-600">by </Text>
            ) : (
              <Text className="text-sm text-gray-600">by </Text>
            )}
            
            {book.authorsData && Array.isArray(book.authorsData) && book.authorsData.length > 0 ? (
              book.authorsData.map((author, index) => (
                <View key={index} className="flex-row items-center">
                  <TouchableOpacity
                    onPress={() => handleAuthorPress(author)}
                  >
                    <Text className="text-sm text-primary underline">
                      {index === 0 ? '' : ', '}{author.name}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text className="text-sm text-gray-600">{book.author}</Text>
            )}
          </View>
          
          {!admin && (
            <View>
              {categories.length > 0 && (
                <View className="flex-row flex-wrap items-center">
                  {categories.slice(0, 2).map((category, index) => (
                    <Chip 
                      key={index} 
                      className="mr-1.5 mb-1.5 h-[30px] bg-gray-100"
                      textStyle="text-xs m-0"
                    >
                      {category}
                    </Chip>
                  ))}
                  {categories.length > 2 && (
                    <Text className="text-xs text-gray-500 ml-1.5">+{categories.length - 2} more</Text>
                  )}
                </View>
              )}
              
              <View className="flex-row items-center mt-2">
                <View style={{ backgroundColor: getStatusColor(book.status) }} className="px-2 py-0.5 rounded-xl">
                  <Text className="text-white text-xs font-bold">
                    {book.status ? book.status.charAt(0).toUpperCase() + book.status.slice(1) : 'Unknown'}
                  </Text>
                </View>
                
                {book.average_rating > 0 && (
                  <View className="flex-row items-center ml-2.5">
                    <StarRating
                      rating={book.average_rating}
                      count={null}
                      style={{ transform: [{ scale: 0.8 }] }}
                    />
                  </View>
                )}
              </View>
            </View>
          )}
          
          {admin && (
            <View className="mt-2.5">
              <View className="flex-row items-center mb-1.5">
                <Text className="text-sm text-gray-600 mr-1.5 w-[50px]">ISBN:</Text>
                <Text className="text-sm text-gray-800">
                  {book.identifiers?.isbn_13 || book.identifiers?.isbn_10 || book.isbn || 'N/A'}
                </Text>
              </View>
              
              <View className="flex-row items-center mb-1.5">
                <Text className="text-sm text-gray-600 mr-1.5 w-[50px]">Status:</Text>
                <View style={{ backgroundColor: getStatusColor(book.status) }} className="px-2 py-0.5 rounded-xl">
                  <Text className="text-white text-xs font-bold">
                    {book.status ? book.status.charAt(0).toUpperCase() + book.status.slice(1) : 'Unknown'}
                  </Text>
                </View>
              </View>

              {categories.length > 0 && (
                <View className="flex-row flex-wrap items-center">
                  {categories.slice(0, 2).map((category, index) => (
                    <Chip 
                      key={index} 
                      className="mr-1.5 mb-1.5 h-[30px] bg-gray-100"
                      textStyle="text-xs m-0"
                    >
                      {category}
                    </Chip>
                  ))}
                  {categories.length > 2 && (
                    <Text className="text-xs text-gray-500 ml-1.5">+{categories.length - 2} more</Text>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
        
        {getBookCoverUrl(book) ? (
          <Image
            source={{ uri: getBookCoverUrl(book) }}
            className="w-[80px] h-[120px] rounded"
            resizeMode="cover"
          />
        ) : (
          <View className="w-[80px] h-[120px] rounded bg-gray-100 justify-center items-center">
            <MaterialCommunityIcons name="book-open-page-variant" size={40} color="#CCCCCC" />
          </View>
        )}
      </Card.Content>
      
      {admin && (
        <Card.Content className="flex-row justify-between items-center border-t border-gray-100">
          <Button
            icon="qrcode"
            mode="text"
            onPress={() => navigation.navigate('GenerateQR', { book_id: book.id })}
          >
            QR Code
          </Button>
          
          <TouchableOpacity
            className="p-2 bg-gray-50 rounded-full"
            onPress={() => handleDeleteBook(book.id)}
          >
            <MaterialCommunityIcons name="delete" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </Card.Content>
      )}
    </Card>
  );
};

export default BookCard;