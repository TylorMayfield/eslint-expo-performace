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
      'expo-performance/prefer-flash-list-for-large-lists': 'warn',
      'expo-performance/no-inline-list-render-props': 'warn',
      'expo-performance/require-location-watch-cleanup': 'error',
      'expo-performance/no-anonymous-context-values': 'warn',
      'expo-performance/no-heavy-work-in-render': 'warn',
      'expo-performance/prefer-interaction-manager-for-noncritical-work': 'warn',
      'expo-performance/no-index-key-in-lists': 'error',
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
      'expo-performance/prefer-flash-list-for-large-lists': 'warn',
      'expo-performance/no-inline-list-render-props': 'warn',
      'expo-performance/require-location-watch-cleanup': 'error',
      'expo-performance/no-anonymous-context-values': 'warn',
      'expo-performance/no-heavy-work-in-render': 'warn',
      'expo-performance/prefer-interaction-manager-for-noncritical-work': 'warn',
      'expo-performance/no-index-key-in-lists': 'error',
    },
  },
};

export = plugin;
