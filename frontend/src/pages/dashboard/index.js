import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Typography, 
  Paper, 
  Box,
  useTheme
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShoppingCart as ShoppingCartIcon,
  Inventory as InventoryIcon,
  Receipt as ReceiptIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import RecentOrders from '../../components/dashboard/RecentOrders';
import LowStockAlert from '../../components/dashboard/LowStockAlert';
import { useAuth } from '../../contexts/AuthContext';
import { withProtectedRoute } from '../../hoc/withProtectedRoute';

const Dashboard = ({ darkMode, toggleDarkMode }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate API call to fetch dashboard data
    const fetchDashboardData = async () => {
      try {
        // In a real application, these would be API calls
        // For now, we'll use mock data
        
        // Mock stats
        setStats({
          totalSales: 15750.25,
          totalOrders: 124,
          totalProducts: 87,
          totalCustomers: 42
        });
        
        // Mock recent orders
        setRecentOrders([
          {
            id: '1',
            orderNumber: 'SO-2307-0001',
            customer: { name: 'John Doe' },
            orderDate: '2023-07-15T10:30:00Z',
            total: 1250.75,
            status: 'delivered'
          },
          {
            id: '2',
            orderNumber: 'SO-2307-0002',
            customer: { name: 'Jane Smith' },
            orderDate: '2023-07-16T14:45:00Z',
            total: 875.50,
            status: 'processing'
          },
          {
            id: '3',
            orderNumber: 'SO-2307-0003',
            customer: { name: 'Robert Johnson' },
            orderDate: '2023-07-17T09:15:00Z',
            total: 2340.00,
            status: 'confirmed'
          },
          {
            id: '4',
            orderNumber: 'SO-2307-0004',
            customer: { name: 'Emily Davis' },
            orderDate: '2023-07-18T16:20:00Z',
            total: 450.25,
            status: 'shipped'
          },
          {
            id: '5',
            orderNumber: 'SO-2307-0005',
            customer: { name: 'Michael Wilson' },
            orderDate: '2023-07-19T11:10:00Z',
            total: 1875.30,
            status: 'draft'
          }
        ]);
        
        // Mock low stock products
        setLowStockProducts([
          {
            id: '1',
            name: 'Organic Fertilizer',
            sku: 'P2307-0001',
            imageUrl: '',
            currentStock: 5,
            minimumLevel: 10
          },
          {
            id: '2',
            name: 'Tomato Seeds',
            sku: 'P2307-0015',
            imageUrl: '',
            currentStock: 8,
            minimumLevel: 20
          },
          {
            id: '3',
            name: 'Irrigation Pipe',
            sku: 'P2307-0042',
            imageUrl: '',
            currentStock: 3,
            minimumLevel: 15
          }
        ]);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  return (
    <DashboardLayout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Welcome back, {user?.name || 'User'}!
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Sales"
            value={`$${stats.totalSales.toLocaleString()}`}
            icon={<ShoppingCartIcon />}
            color="primary"
            subtitle="This month"
            trend={{
              direction: 'up',
              value: '12%',
              icon: <TrendingUpIcon fontSize="small" />
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Orders"
            value={stats.totalOrders}
            icon={<ReceiptIcon />}
            color="info"
            subtitle="This month"
            trend={{
              direction: 'up',
              value: '5%',
              icon: <TrendingUpIcon fontSize="small" />
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Products"
            value={stats.totalProducts}
            icon={<InventoryIcon />}
            color="warning"
            subtitle="In inventory"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Customers"
            value={stats.totalCustomers}
            icon={<PeopleIcon />}
            color="success"
            subtitle="Total customers"
            trend={{
              direction: 'up',
              value: '8%',
              icon: <TrendingUpIcon fontSize="small" />
            }}
          />
        </Grid>
        
        {/* Recent Orders */}
        <Grid item xs={12} md={8}>
          <RecentOrders orders={recentOrders} />
        </Grid>
        
        {/* Low Stock Alert */}
        <Grid item xs={12} md={4}>
          <LowStockAlert products={lowStockProducts} />
        </Grid>
      </Grid>
    </DashboardLayout>
  );
};

export default withProtectedRoute(Dashboard);