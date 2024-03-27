import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './app/App';
import { CssBaseline, ThemeProvider } from '@material-ui/core';
import { createTheme } from '@material-ui/core/styles';
// import colors from './theme/colors';
// import reportWebVitals from './reportWebVitals';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4EBAC5',
    },
    secondary: {
      main: '#d26d87',
    }
  },
  overrides: {
    MuiButton: {
      label: {
        color: 'white',
        fontWeight: 'bold'
      }
    }
  },
  props: {
    MuiDivider: {
      
    },
    MuiTextField: {
      fullWidth: true,
      margin: 'normal',
      size: 'medium',
      variant: 'outlined'
    },
    MuiButton: {
      color: 'primary',
      fullWidth: true,
      size: 'large',
      variant: 'contained',
    }
  }
});


ReactDOM.render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
      <App/>
  </ThemeProvider>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();