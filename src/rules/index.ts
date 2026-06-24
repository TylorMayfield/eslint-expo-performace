import { useExpoImageRule } from './use-expo-image';
import { useNativeDriverRule } from './use-native-driver';
import { noUncleanedNativeSubscriptionsRule } from './no-uncleaned-native-subscriptions';
import { noHighAccuracyLocationRule } from './no-high-accuracy-location';
import { noUncleanedTimersRule } from './no-uncleaned-timers';
import { noUnmemoizedArrayOperationsRule } from './no-unmemoized-array-operations';
import { noInlineNavigationComponentsRule } from './no-inline-navigation-components';
import { useWindowDimensionsRule } from './use-window-dimensions';

export const rules = {
  'use-expo-image': useExpoImageRule,
  'use-native-driver': useNativeDriverRule,
  'no-uncleaned-native-subscriptions': noUncleanedNativeSubscriptionsRule,
  'no-high-accuracy-location': noHighAccuracyLocationRule,
  'no-uncleaned-timers': noUncleanedTimersRule,
  'no-unmemoized-array-operations': noUnmemoizedArrayOperationsRule,
  'no-inline-navigation-components': noInlineNavigationComponentsRule,
  'use-window-dimensions': useWindowDimensionsRule,
};
