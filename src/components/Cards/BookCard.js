import React from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import StarRating from '../StarRating'; // Adjust the path as needed
import { getBookCoverUrl } from '../../services/bookService'; // Adjust the path as needed

const BookCard = ({ book, navigation,bookNavigateTo,authorNavigateTo, admin=false }) => {
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
    <Card 
      style={styles.bookCard}
      onPress={handleCardPress}
    >
      <Card.Content style={styles.bookCardContent}>
        <View style={styles.bookInfo}>
          <Title style={styles.bookTitle}>{book.title}</Title>
          <View style={styles.authorContainer}>
            {book.authorsData && Array.isArray(book.authorsData) && book.authorsData.length > 0 ? (
              <Text style={styles.authorByText}>by </Text>
            ) : (
              <Text style={styles.authorByText}>by </Text>
            )}
            
            {book.authorsData && Array.isArray(book.authorsData) && book.authorsData.length > 0 ? (
              book.authorsData.map((author, index) => (
                <View key={index} style={styles.authorItemContainer}>
                  <TouchableOpacity
                    onPress={() => handleAuthorPress(author)}
                  >
                    <Text style={styles.authorLink}>
                      {index === 0 ? '' : ', '}{author.name}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.bookAuthor}>{book.author}</Text>
            )}
          </View>
          
          {!admin && (
            <View>
              {(book.categories && book.categories.length > 0) && (
                <View style={styles.categoriesContainer}>
                  {book.categories.slice(0, 2).map((category, index) => (
                    <Chip 
                      key={index} 
                      style={styles.categoryChip}
                      textStyle={styles.categoryChipText}
                    >
                      {category}
                    </Chip>
                  ))}
                  {book.categories.length > 2 && (
                    <Text style={styles.moreCategoriesText}>+{book.categories.length - 2} more</Text>
                  )}
                </View>
              )}
              
              <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(book.status) }]}>
                  <Text style={styles.statusText}>
                    {book.status ? book.status.charAt(0).toUpperCase() + book.status.slice(1) : 'Unknown'}
                  </Text>
                </View>
                
                {book.average_rating > 0 && (
                  <View style={styles.ratingContainer}>
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
          
          {admin &&(
            <View style={styles.bookDetails}>
              <View style={styles.bookDetailRow}>
                <Text style={styles.detailLabel}>ISBN:</Text>
                <Text style={styles.detailValue}>
                  {book.identifiers?.isbn_13 || book.identifiers?.isbn_10 || book.isbn || 'N/A'}
                </Text>
              </View>
              
              <View style={styles.bookDetailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(book.status) }]}>
                  <Text style={styles.statusText}>
                    {book.status ? book.status.charAt(0).toUpperCase() + book.status.slice(1) : 'Unknown'}
                  </Text>
                </View>
              </View>

              {(book.categories && book.categories.length > 0) && (
                <View style={styles.categoriesContainer}>
                  {book.categories.slice(0, 2).map((category, index) => (
                    <Chip 
                      key={index} 
                      style={styles.categoryChip}
                      textStyle={styles.categoryChipText}
                    >
                      {category}
                    </Chip>
                  ))}
                  {book.categories.length > 2 && (
                    <Text style={styles.moreCategoriesText}>+{book.categories.length - 2} more</Text>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
        
        {getBookCoverUrl(book) ? (
          <Image
            source={{ uri: getBookCoverUrl(book) }}
            style={styles.bookCover}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.bookCoverPlaceholder}>
            <MaterialCommunityIcons name="book-open-page-variant" size={40} color="#CCCCCC" />
          </View>
        )}
      </Card.Content>
      {/* Bottom container with QR and trash */}
      {admin && (
        <Card.Content style={styles.cardFooter}>
          <Button
            icon="qrcode"
            mode="text"
            onPress={() => navigation.navigate('GenerateQR', { book_id: book.id })}
          >
            QR Code
          </Button>
          
          <TouchableOpacity
            style={styles.trashButton}
            onPress={() => handleDeleteBook(book.id)}
          >
            <MaterialCommunityIcons name="delete" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </Card.Content>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  bookCard: {
    marginBottom: 10,
    elevation: 2,
    borderRadius: 8,
  },
  bookCardContent: {
    flexDirection: 'row',
    height: 150
  },
  bookInfo: {
    flex: 1,
    marginRight: 10,
  },
  bookTitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  bookDetails: {
    marginTop: 10,
  },
  bookDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666666',
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
  authorByText: {
    fontSize: 14,
    color: '#666666',
  },
  authorLink: {
    fontSize: 14,
    color: '#4A90E2',
    textDecorationLine: 'underline',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // marginTop: 4,
    alignItems: 'center',
  },
  categoryChip: {
    marginRight: 5,
    marginBottom: 5,
    height: 30,
    backgroundColor: '#F0F0F0',
  },
  categoryChipText: {
    fontSize: 10,
    margin: 0,
  },
  moreCategoriesText: {
    fontSize: 10,
    color: '#999999',
    marginLeft: 5,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  ratingText: {
    marginLeft: 3,
    fontSize: 12,
    color: '#666666',
  },
  bookCover: {
    width: 80,
    height: 120,
    borderRadius: 4,
  },
  bookCoverPlaceholder: {
    width: 80,
    height: 120,
    borderRadius: 4,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    // paddingTop: 8,
    // marginTop: 8,
  },
  trashButton: {
    padding: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
    marginRight: 5,
    width: 50,
  },
  detailValue: {
    fontSize: 14,
    color: '#333333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
})

export default BookCard;