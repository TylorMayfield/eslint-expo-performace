import { rules } from './rules';

const baseRecommendedRules = {
  'expo-performance/use-native-driver': 'warn',
  'expo-performance/no-uncleaned-native-subscriptions': 'warn',
  'expo-performance/no-high-accuracy-location': 'warn',
  'expo-performance/no-uncleaned-timers': 'warn',
  'expo-performance/require-location-watch-cleanup': 'warn',
};

const componentAndHookFiles = [
  '**/App.{js,jsx,ts,tsx}',
  '**/{app,components,hooks,navigation,routes,screens}/**/*.{js,jsx,ts,tsx}',
  '**/*.{component,hook,screen,route}.{js,jsx,ts,tsx}',
];

const componentAndHookRecommendedRules = {
  'expo-performance/use-expo-image': 'warn',
  'expo-performance/no-unmemoized-array-operations': 'warn',
  'expo-performance/no-inline-navigation-components': 'warn',
  'expo-performance/use-window-dimensions': 'warn',
  'expo-performance/prefer-flash-list-for-large-lists': 'warn',
  'expo-performance/no-inline-list-render-props': 'warn',
  'expo-performance/no-anonymous-context-values': 'warn',
  'expo-performance/no-heavy-work-in-render': 'warn',
  'expo-performance/prefer-interaction-manager-for-noncritical-work': 'warn',
  'expo-performance/no-index-key-in-lists': 'warn',
};

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
    rules: baseRecommendedRules,
    overrides: [
      {
        files: componentAndHookFiles,
        rules: componentAndHookRecommendedRules,
      },
    ],
  },
  // Modern flat configuration preset
  'flat/recommended': [
    {
      plugins: {
        'expo-performance': plugin,
      },
    },
    {
      rules: baseRecommendedRules,
    },
    {
      files: componentAndHookFiles,
      rules: componentAndHookRecommendedRules,
    },
  ],
};

export = plugin;
