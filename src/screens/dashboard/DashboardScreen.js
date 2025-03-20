import React, { useState, useEffect } from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl} from 'react-native';
import { Card, Title, Paragraph, Button, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import {getAllBooks,getLoanedBooks,getMostLoanedBooks} from '../../services/bookService';
import {getActiveLoans, getOverdueLoans} from '../../services/loanService';
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
      
      // Get all books
      const books = await getAllBooks();
      
      // Get loaned books
      const loaned = await getLoanedBooks();
      
      // Get active borrows
      const activeLoans = await getActiveLoans();
      
      // Get overdue borrows
      const overdueLoans = await getOverdueLoans();
      
      // Get most loaned books
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
    // console.log('currentUser :: ', currentUser)
    loadDashboardData();
  }, []);
  
  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#4A90E2']}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome, {currentUser?.display_name || 'User'}</Text>
        <Text style={styles.date}>{new Date().toDateString()}</Text>
      </View>
      
      <View style={styles.statsContainer}>
        <Card style={styles.statsCard}>
          <Card.Content>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="book-multiple" size={32} color="#4A90E2" />
                <Text style={styles.statValue}>{stats.totalBooks}</Text>
                <Text style={styles.statLabel}>Total Books</Text>
              </View>
              
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="book-open-variant" size={32} color="#FF9500" />
                <Text style={styles.statValue}>{stats.loanedBooks}</Text>
                <Text style={styles.statLabel}>Loaned</Text>
              </View>
            </View>
            
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="account-multiple" size={32} color="#4CD964" />
                <Text style={styles.statValue}>{stats.activeLoans}</Text>
                <Text style={styles.statLabel}>Active Loans</Text>
              </View>
              
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="alert-circle" size={32} color="#FF3B30" />
                <Text style={styles.statValue}>{stats.overdueLoans}</Text>
                <Text style={styles.statLabel}>Overdue</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </View>
      
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('DashboardTab', { screen: 'ScanQR' })}
          >
            <MaterialCommunityIcons name="qrcode-scan" size={32} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Lend Book</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('DashboardTab', { screen: 'ScanBook' })}
          >
            <MaterialCommunityIcons name="barcode-scan" size={32} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Add Book</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('LoanedTab')}
          >
            <MaterialCommunityIcons name="account-multiple" size={32} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Readers</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('ReportsTab')}
          >
            <MaterialCommunityIcons name="chart-bar" size={32} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Reports</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.popularBooksContainer}>
        <Text style={styles.sectionTitle}>Most Popular Books</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredBooksContainer}
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
            <Text style={styles.noDataText}>No borrowing data available yet</Text>
          )}
        </ScrollView>
        
        <Button 
          mode="text" 
          onPress={() => navigation.navigate('ReportsTab')}
          style={styles.viewAllButton}
        >
          View All Reports
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
  header: {
    padding: 20,
    backgroundColor: '#4A90E2',
    paddingBottom: 45,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  date: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 5,
  },
  statsContainer: {
    marginTop: -30,
    marginHorizontal: 20,
  },
  statsCard: {
    elevation: 4,
    borderRadius: 10,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  statItem: {
    alignItems: 'center',
    width: '45%',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
    color: '#333333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
  },
  actionsContainer: {
    marginTop: 20,
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333333',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionButtonText: {
    color: '#FFFFFF',
    marginTop: 5,
    fontWeight: 'bold',
  },
  popularBooksContainer: {
    marginTop: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  featuredBooksContainer: {
    paddingHorizontal: 15,
    paddingBottom: 5,
  },
  noDataText: {
    textAlign: 'center',
    color: '#999999',
    marginVertical: 20,
    fontStyle: 'italic',
  },
  viewAllButton: {
    marginTop: 10,
  },
  authorLink: {
    color: '#4A90E2',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  authorContainer: {
    marginBottom: 5,
  },
  authorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  authorItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default DashboardScreen;