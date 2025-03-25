import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Button, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getAllBooks, getLoanedBooks, getMostLoanedBooks } from '../../services/bookService';
import { getActiveLoans, getOverdueLoans } from '../../services/loanService';
import FeaturedBook from '../../components/cards/FeaturedBook';

const DashboardScreen = ({ navigation }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalBooks: 0,
    loanedBooks: 0,
    activeLoans: 0,
    overdueLoans: 0,
  });
  const [popularBooks, setPopularBooks] = useState([]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const books = await getAllBooks();
      const loaned = await getLoanedBooks();
      const activeLoans = await getActiveLoans();
      const overdueLoans = await getOverdueLoans();
      const mostLoaned = await getMostLoanedBooks(5);

      setStats({
        totalBooks: books.length,
        loanedBooks: loaned.length,
        activeLoans: activeLoans.length,
        overdueLoans: overdueLoans.length,
      });

      setPopularBooks(mostLoaned);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <ScrollView
      className="flex-1 bg-gray-100"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#4A90E2']}
        />
      }
    >
      <View className="p-5 bg-blue-600 pb-11">
        <Text className="text-2xl font-bold text-white">
          Welcome, {currentUser?.display_name || 'User'}
        </Text>
        <Text className="text-sm text-white opacity-80 mt-1">
          {new Date().toDateString()}
        </Text>
      </View>

      <View className="mt-[-30px] mx-5">
        <Card className="shadow-md rounded-lg">
          <Card.Content>
            <View className="flex-row justify-between my-2.5">
              <View className="items-center w-[45%]">
                <MaterialCommunityIcons name="book-multiple" size={32} color="#4A90E2" />
                <Text className="text-2xl font-bold mt-1 text-gray-800">{stats.totalBooks}</Text>
                <Text className="text-sm text-gray-600">Total Books</Text>
              </View>
              <View className="items-center w-[45%]">
                <MaterialCommunityIcons name="book-open-variant" size={32} color="#FF9500" />
                <Text className="text-2xl font-bold mt-1 text-gray-800">{stats.loanedBooks}</Text>
                <Text className="text-sm text-gray-600">Loaned</Text>
              </View>
            </View>
            <View className="flex-row justify-between my-2.5">
              <View className="items-center w-[45%]">
                <MaterialCommunityIcons name="account-multiple" size={32} color="#4CD964" />
                <Text className="text-2xl font-bold mt-1 text-gray-800">{stats.activeLoans}</Text>
                <Text className="text-sm text-gray-600">Active Loans</Text>
              </View>
              <View className="items-center w-[45%]">
                <MaterialCommunityIcons name="alert-circle" size={32} color="#FF3B30" />
                <Text className="text-2xl font-bold mt-1 text-gray-800">{stats.overdueLoans}</Text>
                <Text className="text-sm text-gray-600">Overdue</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </View>

      <View className="mt-5 mx-5">
        <Text className="text-lg font-bold mb-2.5 text-gray-800">Quick Actions</Text>
        <View className="flex-row flex-wrap justify-between">
          <TouchableOpacity
            className="w-[48%] bg-blue-600 p-4 rounded-lg items-center mb-2.5"
            onPress={() => navigation.navigate('DashboardTab', { screen: 'ScanQR' })}
          >
            <MaterialCommunityIcons name="qrcode-scan" size={32} color="#FFFFFF" />
            <Text className="text-white mt-1 font-bold">Lend Book</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="w-[48%] bg-blue-600 p-4 rounded-lg items-center mb-2.5"
            onPress={() => navigation.navigate('DashboardTab', { screen: 'ScanBook' })}
          >
            <MaterialCommunityIcons name="barcode-scan" size={32} color="#FFFFFF" />
            <Text className="text-white mt-1 font-bold">Add Book</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="w-[48%] bg-blue-600 p-4 rounded-lg items-center mb-2.5"
            onPress={() => navigation.navigate('LoanedTab')}
          >
            <MaterialCommunityIcons name="account-multiple" size={32} color="#FFFFFF" />
            <Text className="text-white mt-1 font-bold">Readers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="w-[48%] bg-blue-600 p-4 rounded-lg items-center mb-2.5"
            onPress={() => navigation.navigate('ReportsTab')}
          >
            <MaterialCommunityIcons name="chart-bar" size={32} color="#FFFFFF" />
            <Text className="text-white mt-1 font-bold">Reports</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="mt-5 mx-5 mb-5">
        <Text className="text-lg font-bold mb-2.5 text-gray-800">Most Popular Books</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 5 }}
        >
          {popularBooks.length > 0 ? (
            popularBooks.data.map((book) => (
              <FeaturedBook
                key={book.id}
                book={book}
                navigation={navigation}
                bookNavigateTo="BookDetails"
                authorNavigateTo="AuthorDetails"
              />
            ))
          ) : (
            <Text className="text-center text-gray-400 my-5 italic">No borrowing data available yet</Text>
          )}
        </ScrollView>
        <Button
          mode="text"
          onPress={() => navigation.navigate('ReportsTab')}
          className="mt-2.5"
        >
          View All Reports
        </Button>
      </View>
    </ScrollView>
  );
};

export default DashboardScreen;