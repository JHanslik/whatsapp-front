import React, { createContext, useState, useContext } from 'react';

const themes = {
  light: {
    primary: '#075E54',
    secondary: '#128C7E',
    accent: '#25D366',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#000000',
    textSecondary: '#666666',
    border: '#E0E0E0',
    error: '#DC3545',
    success: '#28A745',
    warning: '#FFC107',
    info: '#17A2B8',
  },
  dark: {
    primary: '#128C7E',
    secondary: '#075E54',
    accent: '#25D366',
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    border: '#333333',
    error: '#DC3545',
    success: '#28A745',
    warning: '#FFC107',
    info: '#17A2B8',
  },
  custom: {
    primary: '#4A90E2',
    secondary: '#5C6BC0',
    accent: '#7C4DFF',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#000000',
    textSecondary: '#666666',
    border: '#E0E0E0',
    error: '#DC3545',
    success: '#28A745',
    warning: '#FFC107',
    info: '#17A2B8',
  }
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('light');
  const [customTheme, setCustomTheme] = useState(themes.custom);

  const toggleTheme = () => {
    setCurrentTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setTheme = (themeName) => {
    setCurrentTheme(themeName);
  };

  const updateCustomTheme = (newTheme) => {
    setCustomTheme(newTheme);
  };

  const getTheme = () => {
    return currentTheme === 'custom' ? customTheme : themes[currentTheme];
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        theme: getTheme(),
        toggleTheme,
        setTheme,
        updateCustomTheme,
        themes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 