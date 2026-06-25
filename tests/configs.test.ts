import { describe, expect, it } from 'vitest';
import plugin from '../src/index';

describe('recommended configs', () => {
  it('keeps flat recommended split between base and component/hook rules', () => {
    const flatRecommended = plugin.configs['flat/recommended'];

    expect(Array.isArray(flatRecommended)).toBe(true);
    expect(flatRecommended).toHaveLength(3);
    expect(flatRecommended[0].plugins['expo-performance']).toBe(plugin);

    expect(flatRecommended[1].rules).toMatchObject({
      'expo-performance/no-uncleaned-native-subscriptions': 'warn',
      'expo-performance/no-uncleaned-timers': 'warn',
      'expo-performance/require-location-watch-cleanup': 'warn',
    });
    expect(flatRecommended[1].rules).not.toHaveProperty(
      'expo-performance/no-heavy-work-in-render'
    );

    expect(flatRecommended[2].files).toContain(
      '**/{app,components,hooks,navigation,routes,screens}/**/*.{js,jsx,ts,tsx}'
    );
    expect(flatRecommended[2].rules).toMatchObject({
      'expo-performance/no-heavy-work-in-render': 'warn',
      'expo-performance/no-index-key-in-lists': 'warn',
      'expo-performance/use-window-dimensions': 'warn',
    });
  });

  it('uses overrides for scoped rules in legacy recommended config', () => {
    const recommended = plugin.configs.recommended;

    expect(recommended.rules).toMatchObject({
      'expo-performance/no-uncleaned-native-subscriptions': 'warn',
      'expo-performance/no-uncleaned-timers': 'warn',
    });
    expect(recommended.rules).not.toHaveProperty('expo-performance/no-index-key-in-lists');

    expect(recommended.overrides).toHaveLength(1);
    expect(recommended.overrides[0].rules).toMatchObject({
      'expo-performance/no-index-key-in-lists': 'warn',
      'expo-performance/no-inline-navigation-components': 'warn',
    });
  });
});
