import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import {
  Avatar,
  Card,
  Button,
  List,
  Divider,
  Portal,
  Dialog
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const { currentUser, getUserProfile, signOut, userRole } = useAuth();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        if (currentUser && currentUser.uid) {
          const profile = await getUserProfile(currentUser.uid);
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, [currentUser]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text className="mt-2.5 text-gray-600">Loading profile...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100">
      <Portal>
        <Dialog
          visible={showSignOutDialog}
          onDismiss={() => setShowSignOutDialog(false)}
        >
          <Dialog.Title>Confirm Sign Out</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to sign out?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowSignOutDialog(false)}>Cancel</Button>
            <Button onPress={handleSignOut}>Sign Out</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <ScrollView>
        <View className="bg-white p-5 items-center border-b border-gray-200">
          <View className="mt-2.5 mb-3.75">
            <Avatar.Text
              size={80}
              label={getInitials(userProfile?.name)}
              style={{ backgroundColor: '#4A90E2' }}
            />
          </View>
          <Text className="text-[22px] font-bold text-gray-800">{userProfile?.name}</Text>
          <Text className="text-base text-gray-600 mt-1.25">{userProfile?.email}</Text>
          <View className="bg-[#F0F8FF] px-4 py-1.5 rounded-full mt-3.75 border border-[#4A90E2]">
            <Text className="text-[#4A90E2] font-bold">Library Owner</Text>
          </View>
        </View>

        <Card className="m-[15px] rounded-lg shadow-md">
          <Card.Content>
            <List.Section>
              <List.Subheader>Admin Tools</List.Subheader>
              <List.Item
                title="Manage Admin Invitations"
                description="Create and manage invites for new administrators"
                left={props => <List.Icon {...props} icon="email-plus" color="#FF9500" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => navigation.navigate('ManageInvites')}
                className="py-2"
              />
              <Divider />
              <List.Item
                title="Edit Profile"
                description="Update your name, phone, and other details"
                left={props => <List.Icon {...props} icon="account-edit" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => Alert.alert('Coming Soon', 'This feature will be available in a future update.')}
                className="py-2"
              />
              <Divider />
              <List.Item
                title="Change Password"
                description="Update your account password"
                left={props => <List.Icon {...props} icon="lock-reset" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => Alert.alert('Coming Soon', 'This feature will be available in a future update.')}
                className="py-2"
              />
              <Divider />
              <List.Item
                title="App Settings"
                description="Notifications, theme, and other preferences"
                left={props => <List.Icon {...props} icon="cog" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => Alert.alert('Coming Soon', 'This feature will be available in a future update.')}
                className="py-2"
              />
              <Divider />
              <List.Item
                title="About Library App"
                description="Version 1.0.0"
                left={props => <List.Icon {...props} icon="information" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => Alert.alert('About', 'Library App v1.0.0\nA complete library management solution.')}
                className="py-2"
              />
            </List.Section>
          </Card.Content>
        </Card>

        <Button
          mode="outlined"
          onPress={() => setShowSignOutDialog(true)}
          className="m-[15px] mb-[30px]"
          style={{ borderColor: '#FF3B30', borderWidth: 1 }}
          icon="logout"
        >
          Sign Out
        </Button>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;