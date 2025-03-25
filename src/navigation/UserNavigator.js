import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Import admin screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import BookListScreen from '../screens/books/BookListScreen';
import BookDetailsScreen from '../screens/books/BookDetailsScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ReportsScreen from '../screens/admin/ReportsScreen';
import LoanedHistoryScreen from '../screens/loans/LoanedHistoryScreen';
import ScanBookScreen from '../screens/scan/ScanBookScreen';
import ScanQRScreen from '../screens/scan/ScanQRScreen';
import ScanSelectorScreen from '../screens/scan/ScanSelectorScreen';
import GenerateQRScreen from '../screens/qr/GenerateQRScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import AuthorDetailsScreen from '../screens/common/AuthorDetailsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigators for each tab
const DashboardStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="AdminDashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
    <Stack.Screen name="BookDetails" component={BookDetailsScreen} options={{ title: 'Book Details' }} />
    <Stack.Screen name="AuthorDetails" component={AuthorDetailsScreen} options={{ title: 'Author Details' }} />
    <Stack.Screen name="ScanBook" component={ScanBookScreen} options={{ title: 'Scan Book' }} />
    <Stack.Screen name="ScanQR" component={ScanQRScreen} options={{ title: 'Scan Library QR' }} />
    <Stack.Screen name="GenerateQR" component={GenerateQRScreen} options={{ title: 'Generate QR Code' }} />
    <Stack.Screen name="BorrowingHistory" component={LoanedHistoryScreen} options={{ title: 'Borrowing History' }} />
  </Stack.Navigator>
);

const BooksStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="BookList" component={BookListScreen} options={{ title: 'Library Books' }} />
    <Stack.Screen name="BookDetails" component={BookDetailsScreen} options={{ title: 'Book Details' }} />
    <Stack.Screen name="ScanBook" component={ScanBookScreen} options={{ title: 'Scan Book' }} />
    <Stack.Screen name="GenerateQR" component={GenerateQRScreen} options={{ title: 'Generate QR Code' }} />
    <Stack.Screen name="AuthorDetails" component={AuthorDetailsScreen} options={{ title: 'Author Details' }} />
    <Stack.Screen name="BorrowingHistory" component={LoanedHistoryScreen} options={{ title: 'Borrowing History' }} />
  </Stack.Navigator>
);

const ScanStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="ScanSelector" component={ScanSelectorScreen} options={{ title: 'Scan Options' }} />
    <Stack.Screen name="ScanQR" component={ScanQRScreen} options={{ title: 'Scan Library QR' }} />
    <Stack.Screen name="AdminScanISBN" component={ScanBookScreen} options={{ title: 'Scan ISBN Barcode' }} />
    <Stack.Screen name="AdminScanBookDetails" component={BookDetailsScreen} options={{ title: 'Book Details' }} />
    <Stack.Screen name="AdminGenerateQR" component={GenerateQRScreen} options={{ title: 'Generate QR Code' }} />
    <Stack.Screen name="AdminAuthorDetails" component={AuthorDetailsScreen} options={{ title: 'Author Details' }} />
  </Stack.Navigator>
);

const ReadersStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Readers" component={RegisterScreen} options={{ title: 'Readers' }} />
  </Stack.Navigator>
);

const ReportsStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Reports & Analytics' }} />
    <Stack.Screen name="BorrowingHistory" component={LoanedHistoryScreen} options={{ title: 'Borrowing History' }} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="AdminProfile" component={ProfileScreen} options={{ title: 'My Profile' }} />
  </Stack.Navigator>
);

const UserNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#4A90E2',
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 3,
        },
        headerShown: false,
        tabBarStyle: {
          className: 'bg-white shadow-md'
        },
        tabBarItemStyle: {
          className: 'py-1'
        }
      }}
    >
      <Tab.Screen 
        name="DashboardTab" 
        component={DashboardStack} 
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="BooksTab"
        component={BooksStack}
        options={{
          tabBarLabel: 'Books',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="book-open-variant" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ScanTab"
        component={ScanStack}
        options={{
          tabBarLabel: 'Scan',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="qrcode-scan" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ReaderTab"
        component={ReadersStack}
        options={{
          tabBarLabel: 'Readers',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileStack} 
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default UserNavigator;