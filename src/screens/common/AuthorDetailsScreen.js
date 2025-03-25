import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
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

  const authorId = route.params?.authorId;
  const authorName = route.params?.authorName || 'Author';

  useEffect(() => {
    const previousScreenName = navigation.getState().routes.length > 1
      ? navigation.getState().routes[navigation.getState().routes.length - 2].name
      : '';
    
    let headerTitle = 'Author Details';
    let backButtonLabel = '';
    
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
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text className="mt-2.5 text-gray-600">Loading author details...</Text>
      </View>
    );
  }

  if (!author && authorName) {
    return (
      <ScrollView className="flex-1 bg-gray-100" contentContainerStyle={{ padding: 15, paddingBottom: 30 }}>
        <Card className="rounded-lg shadow-sm">
          <Card.Content>
            <Title className="text-xl leading-7 mb-1">{authorName}</Title>
            <Paragraph className="text-base leading-6 text-gray-600 italic my-5">
              No detailed information available for this author.
            </Paragraph>
            <Button
              mode="outlined"
              icon="magnify"
              onPress={() => Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(authorName)}`)}
              className="border-blue-500"
            >
              Search Online
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-100" contentContainerStyle={{ padding: 15, paddingBottom: 30 }}>
      <Card className="rounded-lg shadow-sm">
        <Card.Content>
          <View className="flex-row mb-4">
            {author.photo_covers && author.photo_covers.length > 0 ? (
              <Image
                source={{ uri: author.photo_covers[0].urls.medium }}
                className="w-[120px] h-[160px] rounded-lg"
                resizeMode="cover"
              />
            ) : (
              <View className="w-[120px] h-[160px] rounded-lg bg-gray-200 justify-center items-center">
                <MaterialCommunityIcons name="account" size={64} color="#CCCCCC" />
              </View>
            )}
            
            <View className="ml-4 flex-1">
              <Title className="text-2xl leading-7 mb-1">{author.name}</Title>
              
              {(author.birth_date || author.death_date) && (
                <Paragraph className="text-base text-gray-600 mb-1">
                  {author.birth_date || '?'} - {author.death_date || 'Present'}
                </Paragraph>
              )}
              
              {author.personal_name && author.personal_name !== author.name && (
                <Paragraph className="text-sm text-gray-600 italic mb-1">
                  {author.personal_name}
                </Paragraph>
              )}
              
              <View className="flex-row items-center mt-2">
                {author.openLibrary_key && (
                  <Tooltip title="View on Open Library">
                    <IconButton
                      icon="book-open-variant"
                      size={28}
                      onPress={() => openExternalLink(`https://openlibrary.org${author.openLibrary_key}`)}
                      className="m-0.5 bg-blue-50"
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
                      className="m-0.5 bg-blue-50"
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
                      className="m-0.5 bg-blue-50"
                      iconColor="#4A90E2"
                    />
                  </Tooltip>
                )}
              </View>
            </View>
          </View>
          
          {author.bio && (
            <>
              <Divider className="my-4" />
              <View className="mb-4">
                <Text className="text-lg font-bold text-gray-800 mb-2">Biography</Text>
                <Text className="text-base leading-6 text-gray-800">{author.bio}</Text>
              </View>
            </>
          )}
          
          {author.alternate_names && author.alternate_names.length > 0 && (
            <>
              <Divider className="my-4" />
              <View className="mb-4">
                <Text className="text-lg font-bold text-gray-800 mb-2">Also Known As</Text>
                <View className="flex-row flex-wrap">
                  {author.alternate_names.map((name, index) => (
                    <Chip key={index} className="m-1 bg-blue-100">{name}</Chip>
                  ))}
                </View>
              </View>
            </>
          )}
          
          {author.photo_covers && author.photo_covers.length > 0 && (
            <>
              <Divider className="my-4" />
              <View className="mb-4">
                <Text className="text-lg font-bold text-gray-800 mb-2">Photos</Text>
                <FlatList
                  horizontal
                  data={author.photo_covers}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      className="mr-2.5"
                      onPress={() => openExternalLink(item.urls.large)}
                    >
                      <Image
                        source={{ uri: item.urls.medium }}
                        className="w-[120px] h-[160px] rounded-lg"
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
      
      <View className="mt-4">
        <Button
          mode="contained"
          icon="magnify"
          onPress={() => Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(author.name)}`)}
          className="bg-blue-600"
        >
          Search Online
        </Button>
      </View>
    </ScrollView>
  );
};

export default AuthorDetailsScreen;