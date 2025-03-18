import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getBookCoverUrl } from '../../services/bookService';

const FeaturedBook = ({ book, navigation,bookNavigateTo,authorNavigateTo, admin=false }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return '#4CD964';
      case 'borrowed':
        return '#FF9500';
      case 'unavailable':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const handleCardPress = () => {
    if (bookNavigateTo && navigation) {
      navigation.navigate(bookNavigateTo, { book_id: book.id, });
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
    <TouchableOpacity
      onPress={handleCardPress}
    >
      <Card style={styles.featuredCard}>
        <Card.Cover
          source={{
            uri: getBookCoverUrl(book) || 'https://via.placeholder.com/150x200?text=No+Cover'
          }}
          style={styles.featuredCardImage}
        />
        <Card.Content style={styles.featuredCardContent}>
          <Title numberOfLines={1} style={styles.featuredCardTitle}>
            {book.title}
          </Title>
          <View style={styles.authorContainer}>
            {book.authorsData && Array.isArray(book.authorsData) && book.authorsData.length > 0 ? (
              book.authorsData.map((author, index) => (
                <View key={index} style={styles.authorItemContainer}>
                  <TouchableOpacity onPress={() => handleAuthorPress(author)}>
                    <Text style={styles.authorLink} numberOfLines={1}>
                      {index === 0 ? '' : ', '}{author.name}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Paragraph numberOfLines={1} style={styles.featuredCardAuthor}>
                {book.author}
              </Paragraph>
            )}
          </View>
          <View style={styles.bookStats}>
            <View style={styles.bookStat}>
              <MaterialCommunityIcons name="book-open-page-variant" size={16} color="#4A90E2" />
              <Text style={styles.bookStatText}>{book.borrow_count? book.borrow_count : 0}</Text>
            </View>
            {book.average_rating > 0 && (
              <View style={styles.bookStat}>
                <MaterialCommunityIcons name="star" size={16} color="#FF9500" />
                <Text style={styles.bookStatText}>{book.average_rating.toFixed(1)}</Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = {
  featuredCard: {
    width: 150,
    marginHorizontal: 5,
    elevation: 3,
    overflow: 'hidden',
  },
  featuredCardImage: {
    height: 200,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  featuredCardContent: {
    padding: 8,
    paddingBottom: 10,
  },
  featuredCardTitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  featuredCardAuthor: {
    fontSize: 12,
    lineHeight: 16,
  },
  authorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  authorItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorLink: {
    fontSize: 12,
    lineHeight: 16,
    color: '#4A90E2',
    textDecorationLine: 'underline',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 3,
    color: '#666666',
  },

  bookStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  bookStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookStatText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666666',
  },
};

export default FeaturedBook;