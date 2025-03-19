import React, { useState, useEffect, useRef }  from 'react';
import { 
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    Image,
    Alert,
    FlatList,
    ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ManualAddBook = ({ rating, count, style }) => {
  // Ensure rating is a number and between 0-5
  
  return (
    <View style={[styles.container, style]}>
      
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