import { rules } from './rules';

const plugin = {
  meta: {
    name: 'eslint-plugin-expo-performance',
    version: '1.0.0',
  },
  rules,
  configs: {} as Record<string, any>,
};

plugin.configs = {
  // Legacy eslintrc configuration
  recommended: {
    plugins: ['expo-performance'],
    rules: {
      'expo-performance/use-expo-image': 'warn',
      'expo-performance/use-native-driver': 'warn',
      'expo-performance/no-uncleaned-native-subscriptions': 'error',
      'expo-performance/no-high-accuracy-location': 'warn',
      'expo-performance/no-uncleaned-timers': 'error',
      'expo-performance/no-unmemoized-array-operations': 'warn',
      'expo-performance/no-inline-navigation-components': 'error',
      'expo-performance/use-window-dimensions': 'error',
    },
  },
  // Modern flat configuration preset
  'flat/recommended': {
    plugins: {
      'expo-performance': plugin,
    },
    rules: {
      'expo-performance/use-expo-image': 'warn',
      'expo-performance/use-native-driver': 'warn',
      'expo-performance/no-uncleaned-native-subscriptions': 'error',
      'expo-performance/no-high-accuracy-location': 'warn',
      'expo-performance/no-uncleaned-timers': 'error',
      'expo-performance/no-unmemoized-array-operations': 'warn',
      'expo-performance/no-inline-navigation-components': 'error',
      'expo-performance/use-window-dimensions': 'error',
    },
  },
};

export = plugin;
