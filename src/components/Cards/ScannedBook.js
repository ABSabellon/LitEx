import React, { useEffect } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getBookCoverUrl } from '../../services/bookService';

const ScannedBook = ({ data, copyCount, onDelete, onAdd }) => {
  const {
    title,
    authors = [],
    covers = {},
    ratings = {},
  } = data;

  const authorName = authors.length > 0 ? authors[0].name : 'Unknown Author';
  const ratingAverage = ratings.summary?.average || 0;

  useEffect(() => {
    // Add any side effects if needed when data changes
  }, [data]);

  return (
    <View className="flex-row items-center p-2.5 bg-white rounded-lg my-1.5 shadow">
      {/* Left: Cover Image */}
      {getBookCoverUrl(book) ? (
        <Image
          source={{ uri: getBookCoverUrl(book) }}
          className="w-[60px] h-[90px] rounded mr-2.5"
          resizeMode="cover"
        />
      ) : (
        <View className="w-[60px] h-[90px] rounded mr-2.5 bg-gray-100 justify-center items-center">
          <MaterialCommunityIcons name="book-open-page-variant" size={40} color="#CCCCCC" />
        </View>
      )}

      {/* Middle: Book Details */}
      <View className="flex-1 justify-center mr-2.5">
        <View className="flex-row items-center flex-wrap">
          {copyCount && 
            <Chip 
              className="bg-gray-200 mr-2"
              textStyle="text-xs font-bold text-gray-800"
            >
              {copyCount}x
            </Chip>
          }
          <Text className="text-base font-semibold text-gray-800 flex-shrink-1" numberOfLines={2} ellipsizeMode="tail">
            {title}
          </Text>
        </View>
        <Text className="text-sm text-gray-600 my-0.5">
          By <Text className="text-gray-600">{authorName}</Text>
        </Text>
        <View className="flex-row items-center">
          <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
          <Text className="text-sm text-gray-800 ml-1">{ratingAverage.toFixed(1)}</Text>
        </View>
      </View>

      {/* Right: Plus and Delete Buttons */}
      <View className="items-center justify-center w-[50px]">
        {onAdd && 
          <TouchableOpacity onPress={onAdd} className="p-1.5 mb-1.5">
            <MaterialCommunityIcons name="plus" size={24} color="#4A90E2" />
          </TouchableOpacity>
        }
        <TouchableOpacity onPress={onDelete} className="p-1.5">
          <MaterialCommunityIcons name="trash-can-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ScannedBook;