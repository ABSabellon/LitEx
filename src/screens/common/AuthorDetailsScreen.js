import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  FlatList
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  IconButton,
  Divider,
  Chip,
  List,
  Button,
  Tooltip
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuthorById } from '../../services/bookService';

const AuthorDetailsScreen = ({ navigation, route }) => {
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get author ID from route params
  const authorId = route.params?.authorId;
  const authorName = route.params?.authorName || 'Author';

  // Set up appropriate header based on where we came from
  useEffect(() => {
    // Get the previous screen name
    const previousScreenName = navigation.getState().routes.length > 1
      ? navigation.getState().routes[navigation.getState().routes.length - 2].name
      : '';
    
    let headerTitle = 'Author Details';
    let backButtonLabel = '';
    
    // Set custom header title and back button label based on source screen
    if (previousScreenName.includes('Home')) {
      backButtonLabel = 'Home';
    } else if (previousScreenName.includes('Catalog')) {
      backButtonLabel = 'Catalog';
    } else if (previousScreenName.includes('MyBooks')) {
      backButtonLabel = 'My Books';
    } else if (previousScreenName.includes('Scan')) {
      backButtonLabel = 'Scan';
    }
    
    navigation.setOptions({
      title: headerTitle,
      headerBackTitle: backButtonLabel || undefined,
    });
  }, [navigation]);

  // Load author data
  useEffect(() => {
    const fetchAuthor = async () => {
      if (!authorId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const authorData = await getAuthorById(authorId);
        
        if (authorData) {
          setAuthor(authorData);
        }
      } catch (error) {
        console.error('Error loading author:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthor();
  }, [authorId]);

  const openExternalLink = (url) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading author details...</Text>
      </View>
    );
  }

  // If no author data was found but we have the name
  if (!author && authorName) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>{authorName}</Title>
            <Paragraph style={styles.noDataText}>
              No detailed information available for this author.
            </Paragraph>
            <Button
              mode="outlined"
              icon="magnify"
              onPress={() => Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(authorName)}`)}
              style={styles.searchButton}
            >
              Search Online
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    );
  }

  // Render author details if we have data
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.headerContainer}>
            {author.photo_covers && author.photo_covers.length > 0 ? (
              <Image
                source={{ uri: author.photo_covers[0].urls.medium }}
                style={styles.authorImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.authorPlaceholder}>
                <MaterialCommunityIcons name="account" size={64} color="#CCCCCC" />
              </View>
            )}
            
            <View style={styles.headerInfo}>
              <Title style={styles.title}>{author.name}</Title>
              
              {(author.birth_date || author.death_date) && (
                <Paragraph style={styles.dates}>
                  {author.birth_date || '?'} - {author.death_date || 'Present'}
                </Paragraph>
              )}
              
              {author.personal_name && author.personal_name !== author.name && (
                <Paragraph style={styles.personalName}>
                  {author.personal_name}
                </Paragraph>
              )}
              
              <View style={styles.externalLinks}>
                {author.openLibrary_key && (
                  <Tooltip title="View on Open Library">
                    <IconButton
                      icon="book-open-variant"
                      size={28}
                      onPress={() => openExternalLink(`https://openlibrary.org${author.openLibrary_key}`)}
                      style={styles.iconButton}
                      iconColor="#4A90E2"
                    />
                  </Tooltip>
                )}
                
                {author.wikipedia && (
                  <Tooltip title="View on Wikipedia">
                    <IconButton
                      icon="wikipedia"
                      size={28}
                      onPress={() => openExternalLink(author.wikipedia)}
                      style={styles.iconButton}
                      iconColor="#4A90E2"
                    />
                  </Tooltip>
                )}
                
                {author.wikidata_id && (
                  <Tooltip title="View on Wikidata">
                    <IconButton
                      icon="database"
                      size={28}
                      onPress={() => openExternalLink(`https://www.wikidata.org/wiki/${author.wikidata_id}`)}
                      style={styles.iconButton}
                      iconColor="#4A90E2"
                    />
                  </Tooltip>
                )}
              </View>
            </View>
          </View>
          
          {author.bio && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.bioContainer}>
                <Text style={styles.sectionTitle}>Biography</Text>
                <Text style={styles.bioText}>{author.bio}</Text>
              </View>
            </>
          )}
          
          {author.alternate_names && author.alternate_names.length > 0 && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.alternateNamesContainer}>
                <Text style={styles.sectionTitle}>Also Known As</Text>
                <View style={styles.chipsContainer}>
                  {author.alternate_names.map((name, index) => (
                    <Chip key={index} style={styles.chip}>{name}</Chip>
                  ))}
                </View>
              </View>
            </>
          )}
          
          {author.photo_covers && author.photo_covers.length > 0 && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.photosContainer}>
                <Text style={styles.sectionTitle}>Photos</Text>
                <FlatList
                  horizontal
                  data={author.photo_covers}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.photoItem}
                      onPress={() => openExternalLink(item.urls.large)}
                    >
                      <Image
                        source={{ uri: item.urls.medium }}
                        style={styles.photoImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  )}
                  showsHorizontalScrollIndicator={false}
                />
              </View>
            </>
          )}
        </Card.Content>
      </Card>
      
      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          icon="magnify"
          onPress={() => Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(author.name)}`)}
          style={styles.searchButton}
        >
          Search Online
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    padding: 15,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666666',
  },
  card: {
    borderRadius: 10,
    elevation: 2,
  },
  headerContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  authorImage: {
    width: 120,
    height: 160,
    borderRadius: 8,
  },
  authorPlaceholder: {
    width: 120,
    height: 160,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    marginLeft: 15,
    flex: 1,
  },
  title: {
    fontSize: 22,
    lineHeight: 26,
    marginBottom: 4,
  },
  dates: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 4,
  },
  personalName: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  externalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  iconButton: {
    margin: 2,
    backgroundColor: '#F0F8FF',
  },
  divider: {
    marginVertical: 15,
  },
  bioContainer: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333333',
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
  },
  alternateNamesContainer: {
    marginBottom: 15,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    margin: 4,
    backgroundColor: '#E8EAF6',
  },
  photosContainer: {
    marginBottom: 15,
  },
  photoItem: {
    marginRight: 10,
  },
  photoImage: {
    width: 120,
    height: 160,
    borderRadius: 8,
  },
  actionButtons: {
    marginTop: 15,
  },
  searchButton: {
    backgroundColor: '#4A90E2',
  },
  noDataText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666666',
    marginVertical: 20,
    fontStyle: 'italic',
  },
});

export default AuthorDetailsScreen;