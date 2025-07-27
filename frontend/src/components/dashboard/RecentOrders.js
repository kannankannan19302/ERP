import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Box,
  Button,
  useTheme
} from '@mui/material';
import { MoreVert as MoreVertIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import Link from 'next/link';

const getStatusColor = (status) => {
  switch (status) {
    case 'draft':
      return 'default';
    case 'confirmed':
      return 'primary';
    case 'processing':
      return 'info';
    case 'shipped':
      return 'warning';
    case 'delivered':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

const RecentOrders = ({ orders = [] }) => {
  const theme = useTheme();
  
  return (
    <Card sx={{ height: '100%', boxShadow: theme.shadows[2] }}>
      <CardHeader 
        title="Recent Orders" 
        action={
          <IconButton aria-label="settings">
            <MoreVertIcon />
          </IconButton>
        }
      />
      <CardContent>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Order #</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length > 0 ? (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.orderNumber}</TableCell>
                    <TableCell>{order.customer.name}</TableCell>
                    <TableCell>
                      {new Date(order.orderDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      ${order.total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={order.status.charAt(0).toUpperCase() + order.status.slice(1)} 
                        color={getStatusColor(order.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Link href={`/dashboard/sales/orders/${order.id}`} passHref>
                        <IconButton size="small" color="primary">
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No recent orders
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Link href="/dashboard/sales/orders" passHref>
            <Button variant="text" size="small">
              View All Orders
            </Button>
          </Link>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RecentOrders;