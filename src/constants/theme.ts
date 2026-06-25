import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1B5E20',
    primaryContainer: '#A5D6A7',
    secondary: '#00695C',
    secondaryContainer: '#B2DFDB',
    tertiary: '#E65100',
    tertiaryContainer: '#FFCC80',
    error: '#B71C1C',
    errorContainer: '#FFCDD2',
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    background: '#FAFAFA',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#81C784',
    primaryContainer: '#1B5E20',
    secondary: '#80CBC4',
    secondaryContainer: '#00695C',
    tertiary: '#FFB74D',
    tertiaryContainer: '#E65100',
    error: '#EF9A9A',
    errorContainer: '#B71C1C',
    surface: '#1E1E1E',
    surfaceVariant: '#2C2C2C',
    background: '#121212',
  },
};
