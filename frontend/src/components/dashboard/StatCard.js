import React from 'react';
import { Card, CardContent, Typography, Box, useTheme } from '@mui/material';

const StatCard = ({ title, value, icon, color, subtitle, trend }) => {
  const theme = useTheme();
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        boxShadow: theme.shadows[2],
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4]
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {value}
            </Typography>
            {subtitle && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
                {trend && (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      ml: 1,
                      color: trend.direction === 'up' ? 'success.main' : 'error.main',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {trend.icon}
                    {trend.value}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
          <Box 
            sx={{ 
              backgroundColor: `${color}.light`,
              color: `${color}.main`,
              p: 1,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;