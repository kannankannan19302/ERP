import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  Button,
  Divider,
  useTheme
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import Link from 'next/link';

const LowStockAlert = ({ products = [] }) => {
  const theme = useTheme();
  
  return (
    <Card sx={{ height: '100%', boxShadow: theme.shadows[2] }}>
      <CardHeader 
        title="Low Stock Alert" 
        avatar={
          <Avatar sx={{ bgcolor: theme.palette.warning.main }}>
            <WarningIcon />
          </Avatar>
        }
      />
      <CardContent>
        {products.length > 0 ? (
          <List sx={{ width: '100%', maxHeight: 300, overflow: 'auto' }}>
            {products.map((product, index) => (
              <React.Fragment key={product.id}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar 
                      alt={product.name} 
                      src={product.imageUrl || '/placeholder.png'} 
                      variant="rounded"
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={product.name}
                    secondary={
                      <React.Fragment>
                        <Typography
                          sx={{ display: 'inline' }}
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          SKU: {product.sku}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                          <Typography variant="body2" color="error">
                            Current: {product.currentStock}
                          </Typography>
                          <Typography variant="body2">
                            Minimum: {product.minimumLevel}
                          </Typography>
                        </Box>
                      </React.Fragment>
                    }
                  />
                </ListItem>
                {index < products.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body1" color="text.secondary">
              No products with low stock
            </Typography>
          </Box>
        )}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Link href="/dashboard/inventory/stock" passHref>
            <Button variant="text" size="small">
              View All Stock
            </Button>
          </Link>
        </Box>
      </CardContent>
    </Card>
  );
};

export default LowStockAlert;