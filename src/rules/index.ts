import { useExpoImageRule } from './use-expo-image';
import { useNativeDriverRule } from './use-native-driver';
import { noUncleanedNativeSubscriptionsRule } from './no-uncleaned-native-subscriptions';
import { noHighAccuracyLocationRule } from './no-high-accuracy-location';
import { noUncleanedTimersRule } from './no-uncleaned-timers';
import { noUnmemoizedArrayOperationsRule } from './no-unmemoized-array-operations';
import { noInlineNavigationComponentsRule } from './no-inline-navigation-components';
import { useWindowDimensionsRule } from './use-window-dimensions';
import { preferFlashListForLargeListsRule } from './prefer-flash-list-for-large-lists';
import { noInlineListRenderPropsRule } from './no-inline-list-render-props';
import { requireLocationWatchCleanupRule } from './require-location-watch-cleanup';
import { noAnonymousContextValuesRule } from './no-anonymous-context-values';
import { noHeavyWorkInRenderRule } from './no-heavy-work-in-render';
import { preferInteractionManagerForNoncriticalWorkRule } from './prefer-interaction-manager-for-noncritical-work';
import { noIndexKeyInListsRule } from './no-index-key-in-lists';

export const rules = {
  'use-expo-image': useExpoImageRule,
  'use-native-driver': useNativeDriverRule,
  'no-uncleaned-native-subscriptions': noUncleanedNativeSubscriptionsRule,
  'no-high-accuracy-location': noHighAccuracyLocationRule,
  'no-uncleaned-timers': noUncleanedTimersRule,
  'no-unmemoized-array-operations': noUnmemoizedArrayOperationsRule,
  'no-inline-navigation-components': noInlineNavigationComponentsRule,
  'use-window-dimensions': useWindowDimensionsRule,
  'prefer-flash-list-for-large-lists': preferFlashListForLargeListsRule,
  'no-inline-list-render-props': noInlineListRenderPropsRule,
  'require-location-watch-cleanup': requireLocationWatchCleanupRule,
  'no-anonymous-context-values': noAnonymousContextValuesRule,
  'no-heavy-work-in-render': noHeavyWorkInRenderRule,
  'prefer-interaction-manager-for-noncritical-work': preferInteractionManagerForNoncriticalWorkRule,
  'no-index-key-in-lists': noIndexKeyInListsRule,
};
