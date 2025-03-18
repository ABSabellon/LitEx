import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ScannedBook = ({ data, copyCount, onDelete, onAdd }) => {
  const {
    title,
    authors = [],
    covers = {},
    ratings = {},
  } = data;

  const authorName = authors.length > 0 ? authors[0].name : 'Unknown Author';
  const coverImage = covers.cover_medium || 'https://via.placeholder.com/80';
  const ratingAverage = ratings.summary?.average || 0;

  useEffect(() => {
    // console.log('data :: ', data);
    // Add any side effects if needed when data changes
  }, [data]);

  return (
    <View style={styles.card}>
      {/* Left: Cover Image */}
      <Image
        source={{ uri: coverImage }}
        style={styles.coverImage}
        resizeMode="cover"
      />

      {/* Middle: Book Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.row}>
          {copyCount && <Chip style={styles.copyChip} textStyle={styles.copyText}>
            {copyCount}x
          </Chip>}
          <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
            {title}
          </Text>
        </View>
        <Text style={styles.author}>
          By <Text style={styles.authorName}>{authorName}</Text>
        </Text>
        <View style={styles.ratingContainer}>
          <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
          <Text style={styles.ratingText}>{ratingAverage.toFixed(1)}</Text>
        </View>
      </View>

      {/* Right: Plus and Delete Buttons */}
      <View style={styles.buttonContainer}>
        {onAdd && 
          <TouchableOpacity onPress={onAdd} style={styles.addButton}>
            <MaterialCommunityIcons name="plus" size={24} color="#4A90E2" />
          </TouchableOpacity>
        }
        <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
          <MaterialCommunityIcons name="trash-can-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  coverImage: {
    width: 60,
    height: 90,
    borderRadius: 4,
    marginRight: 10,
  },
  detailsContainer: {
    flex: 1, // Takes available space but respects boundaries
    justifyContent: 'center',
    marginRight: 10, // Adds space between details and buttons
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap', // Allows title to wrap to next line
  },
  copyChip: {
    backgroundColor: '#E0E0E0',
    marginRight: 8,
  },
  copyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flexShrink: 1, // Allows title to shrink and wrap
  },
  author: {
    fontSize: 14,
    color: '#666',
    marginVertical: 2,
  },
  authorName: {
    color: '#666',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 4,
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50, // Fixed width to prevent overlap
  },
  addButton: {
    padding: 5,
    marginBottom: 5,
  },
  deleteButton: {
    padding: 5,
  },
});

export default ScannedBook;