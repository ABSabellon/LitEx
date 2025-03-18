import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';

// Import navigators
import AuthNavigator from './AuthNavigator';
import UserNavigator from './UserNavigator';

// Import loading screen
import LoadingScreen from '../screens/common/LoadingScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { currentUser, loading, userRole } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!currentUser ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <Stack.Screen name="User" component={UserNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;