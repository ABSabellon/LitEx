import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const StarRating = ({ rating, count, style }) => {
  // Ensure rating is a number and between 0-5
  const numericRating = Number(rating) || 0;
  const safeRating = Math.min(Math.max(numericRating, 0), 5);
  
  // Generate stars based on rating
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(safeRating);
    const halfStar = safeRating % 1 >= 0.5;
    
    // Add filled stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <MaterialCommunityIcons 
          key={`full_${i}`} 
          name="star" 
          size={16} 
          color="#FFD700" 
        />
      );
    }
    
    // Add half star if needed
    if (halfStar) {
      stars.push(
        <MaterialCommunityIcons 
          key="half" 
          name="star-half-full" 
          size={16} 
          color="#FFD700" 
        />
      );
    }
    
    // Add empty stars to reach 5
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <MaterialCommunityIcons 
          key={`empty_${i}`} 
          name="star-outline" 
          size={16} 
          color="#FFD700" 
        />
      );
    }
    
    return stars;
  };
  
  return (
    <View className="flex-row items-center" style={style}>
      <View className="flex-row mr-1.5">
        {renderStars()}
      </View>
      <Text className="text-sm text-gray-600">
        {safeRating.toFixed(2)} {count ? `(${count})` : ''}
      </Text>
    </View>
  );
};

export default StarRating;