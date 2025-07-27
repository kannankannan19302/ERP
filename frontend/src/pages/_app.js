import React from 'react';
import Head from 'next/head';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from '../contexts/AuthContext';
import '../styles/globals.css';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32', // Green color for agriculture theme
    },
    secondary: {
      main: '#f57c00', // Orange for contrast
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

/**
 * Custom App component
 * @param {Object} props - Component props
 * @returns {JSX.Element} App component
 */
function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>AgriERP - Agricultural Enterprise Resource Planning</title>
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
        <meta name="description" content="Comprehensive ERP solution for agricultural businesses" />
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Component {...pageProps} />
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}

export default MyApp;