import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  Typography,
  useTheme,
  useMediaQuery,
  IconButton
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  ShoppingCart as ShoppingCartIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  Receipt as ReceiptIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  ChevronLeft,
  Agriculture as AgricultureIcon,
  Build as BuildIcon,
  Person as PersonIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 240;

const Sidebar = ({ open, onClose }) => {
  const theme = useTheme();
  const router = useRouter();
  const { logout, user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [openMenus, setOpenMenus] = useState({
    sales: false,
    inventory: false,
    agriculture: false,
    settings: false
  });
  
  const handleMenuToggle = (menu) => {
    setOpenMenus({
      ...openMenus,
      [menu]: !openMenus[menu]
    });
  };
  
  const isActive = (path) => {
    return router.pathname === path || router.pathname.startsWith(`${path}/`);
  };
  
  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };
  
  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      permission: 'dashboard.view'
    },
    {
      text: 'Sales',
      icon: <ShoppingCartIcon />,
      submenu: true,
      permission: 'sales.view',
      items: [
        {
          text: 'Customers',
          path: '/dashboard/sales/customers',
          permission: 'customers.view'
        },
        {
          text: 'Sales Orders',
          path: '/dashboard/sales/orders',
          permission: 'sales.view'
        },
        {
          text: 'Invoices',
          path: '/dashboard/sales/invoices',
          permission: 'invoices.view'
        }
      ]
    },
    {
      text: 'Inventory',
      icon: <InventoryIcon />,
      submenu: true,
      permission: 'inventory.view',
      items: [
        {
          text: 'Products',
          path: '/dashboard/inventory/products',
          permission: 'inventory.view'
        },
        {
          text: 'Categories',
          path: '/dashboard/inventory/categories',
          permission: 'inventory.view'
        },
        {
          text: 'Stock Levels',
          path: '/dashboard/inventory/stock',
          permission: 'inventory.view'
        }
      ]
    },
    {
      text: 'Agriculture',
      icon: <AgricultureIcon />,
      submenu: true,
      permission: 'agriculture.view',
      items: [
        {
          text: 'Farms',
          path: '/dashboard/agriculture/farms',
          permission: 'agriculture.view'
        },
        {
          text: 'Crops',
          path: '/dashboard/agriculture/crops',
          permission: 'agriculture.view'
        },
        {
          text: 'Activities',
          path: '/dashboard/agriculture/activities',
          permission: 'agriculture.view'
        }
      ]
    },
    {
      text: 'Builder',
      icon: <BuildIcon />,
      path: '/dashboard/builder',
      permission: 'builder.view'
    },
    {
      text: 'Settings',
      icon: <SettingsIcon />,
      submenu: true,
      permission: 'settings.view',
      items: [
        {
          text: 'Users',
          path: '/dashboard/settings/users',
          permission: 'users.view'
        },
        {
          text: 'Roles',
          path: '/dashboard/settings/roles',
          permission: 'roles.view'
        },
        {
          text: 'Company',
          path: '/dashboard/settings/company',
          permission: 'settings.view'
        }
      ]
    }
  ];
  
  const drawer = (
    <Box sx={{ overflow: 'auto' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 2
        }}
      >
        <Typography variant="h6" noWrap component="div">
          AgriERP
        </Typography>
        {isMobile && (
          <IconButton onClick={onClose}>
            <ChevronLeft />
          </IconButton>
        )}
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => {
          // Check if user has permission to view this menu item
          // For simplicity, we're not implementing actual permission checks here
          const hasPermission = true; // Replace with actual permission check
          
          if (!hasPermission) return null;
          
          if (item.submenu) {
            return (
              <React.Fragment key={item.text}>
                <ListItem 
                  button 
                  onClick={() => handleMenuToggle(item.text.toLowerCase())}
                  sx={{
                    backgroundColor: openMenus[item.text.toLowerCase()] ? 'rgba(0, 0, 0, 0.04)' : 'transparent'
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                  {openMenus[item.text.toLowerCase()] ? <ExpandLess /> : <ExpandMore />}
                </ListItem>
                <Collapse in={openMenus[item.text.toLowerCase()]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.items.map((subItem) => {
                      // Check if user has permission to view this submenu item
                      const hasSubPermission = true; // Replace with actual permission check
                      
                      if (!hasSubPermission) return null;
                      
                      return (
                        <Link href={subItem.path} passHref key={subItem.text}>
                          <ListItem 
                            button 
                            component="a"
                            sx={{ 
                              pl: 4,
                              backgroundColor: isActive(subItem.path) ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
                              '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.04)'
                              }
                            }}
                            onClick={isMobile ? onClose : undefined}
                          >
                            <ListItemText primary={subItem.text} />
                          </ListItem>
                        </Link>
                      );
                    })}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          } else {
            return (
              <Link href={item.path} passHref key={item.text}>
                <ListItem 
                  button 
                  component="a"
                  sx={{ 
                    backgroundColor: isActive(item.path) ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                  onClick={isMobile ? onClose : undefined}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItem>
              </Link>
            );
          }
        })}
      </List>
      <Divider />
      <List>
        <Link href="/dashboard/profile" passHref>
          <ListItem 
            button 
            component="a"
            sx={{ 
              backgroundColor: isActive('/dashboard/profile') ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
            onClick={isMobile ? onClose : undefined}
          >
            <ListItemIcon><PersonIcon /></ListItemIcon>
            <ListItemText primary="Profile" />
          </ListItem>
        </Link>
        <ListItem button onClick={handleLogout}>
          <ListItemIcon><LogoutIcon /></ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Box>
  );
  
  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={open}
          onClose={onClose}
          ModalProps={{
            keepMounted: true // Better open performance on mobile
          }}
          sx={{
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: `1px solid ${theme.palette.divider}`
            }
          }}
        >
          {drawer}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          open
          sx={{
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: `1px solid ${theme.palette.divider}`
            }
          }}
        >
          {drawer}
        </Drawer>
      )}
    </Box>
  );
};

export default Sidebar;