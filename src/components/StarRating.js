import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
    <View style={[styles.container, style]}>
      <View style={styles.starsContainer}>
        {renderStars()}
      </View>
      <Text style={styles.ratingText}>
        {safeRating.toFixed(2)} {count ? `(${count})` : ''}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 5,
  },
  ratingText: {
    fontSize: 14,
    color: '#666666',
  }
});

export default StarRating;