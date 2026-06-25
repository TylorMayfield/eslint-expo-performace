# eslint-plugin-expo-performance

An ESLint plugin for Expo and React Native projects designed to catch common AI-generated code smells that lead to high battery usage, memory leaks, render churn, and CPU performance bottlenecks.

The rules intentionally focus on high-signal patterns that AI assistants often produce: missing cleanup, inline render work, unstable list/context values, overly expensive location settings, and Expo/React Native APIs used in subtly wrong ways.

## Installation

Since this package is not yet published to npm, you can install it directly from the Git repository:

```bash
# Using pnpm
pnpm add -D github:TylorMayfield/eslint-expo-performace

# Using npm
npm install --save-dev github:TylorMayfield/eslint-expo-performace

# Using yarn
yarn add -D github:TylorMayfield/eslint-expo-performace
```

---

## Configuration

### 1. Modern Flat Configuration (`eslint.config.js`)

Enable the plugin using the modern Flat Config format:

```javascript
import expoPerformance from 'eslint-plugin-expo-performance';

export default [
  // Extend the recommended configuration
  ...expoPerformance.configs['flat/recommended'],
  
  // Or manually configure individual rules
  {
    plugins: {
      'expo-performance': expoPerformance,
    },
    rules: {
      'expo-performance/no-uncleaned-native-subscriptions': 'warn',
      'expo-performance/no-uncleaned-timers': 'warn',
      'expo-performance/no-high-accuracy-location': 'warn',
      'expo-performance/no-unmemoized-array-operations': 'warn',
      'expo-performance/no-inline-navigation-components': 'warn',
      'expo-performance/use-window-dimensions': 'warn',
      'expo-performance/use-expo-image': 'warn',
      'expo-performance/use-native-driver': 'warn',
      'expo-performance/prefer-flash-list-for-large-lists': 'warn',
      'expo-performance/no-inline-list-render-props': 'warn',
      'expo-performance/require-location-watch-cleanup': 'warn',
      'expo-performance/no-anonymous-context-values': 'warn',
      'expo-performance/no-heavy-work-in-render': 'warn',
      'expo-performance/prefer-interaction-manager-for-noncritical-work': 'warn',
      'expo-performance/no-index-key-in-lists': 'warn',
    },
  },
];
```

### 2. Legacy Configuration (`.eslintrc.json` / `.eslintrc.js`)

Enable the plugin in legacy eslintrc configurations:

```json
{
  "plugins": ["expo-performance"],
  "extends": ["plugin:expo-performance/recommended"]
}
```

---

## Supported Rules

This plugin includes the following rules to flag commonly generated Expo and React Native mistakes:

The recommended preset is intentionally advisory. Cleanup, animation, and location rules run across the project as warnings. Render, list, navigation, context, and image rules are scoped to common React component, route, screen, app, and hook paths so service modules do not inherit React-specific heuristics by default. Tighten selected rules to `error` once the warnings are clean in your project.

| Rule | Category | Severity | Description |
| :--- | :--- | :--- | :--- |
| [`no-uncleaned-native-subscriptions`](#no-uncleaned-native-subscriptions) | Battery / Memory | `warn` | Ensures hardware sensor subscriptions (Accelerometer, Gyroscope, etc.) are cleaned up inside hooks. |
| [`no-uncleaned-timers`](#no-uncleaned-timers) | Battery / CPU | `warn` | Ensures `setInterval` and `setTimeout` are cleared. |
| [`no-high-accuracy-location`](#no-high-accuracy-location) | Battery | `warn` | Flags energy-intensive accuracy levels (Highest/BestForNavigation) in Expo Location. |
| [`no-unmemoized-array-operations`](#no-unmemoized-array-operations) | CPU | `warn` | Flags unmemoized heavy array transformations (`filter`/`sort`/`reduce`) inside component renders. |
| [`no-inline-navigation-components`](#no-inline-navigation-components) | CPU / Render | `warn` | Prevents screen unmount/remount loops caused by inline functions in screen component definitions. |
| [`use-window-dimensions`](#use-window-dimensions) | Layout | `warn` | Enforces `useWindowDimensions` hook instead of static module-level `Dimensions.get` queries. |
| [`use-expo-image`](#use-expo-image) | CPU / Memory | `warn` | Enforces using `expo-image` instead of `react-native` Image for optimized caching and memory. |
| [`use-native-driver`](#use-native-driver) | CPU / FPS | `warn` | Enforces `useNativeDriver: true` for React Native Animated transitions. |
| [`prefer-flash-list-for-large-lists`](#prefer-flash-list-for-large-lists) | Memory / Scroll | `warn` | Suggests FlashList for dynamic FlatList/SectionList datasets. |
| [`no-inline-list-render-props`](#no-inline-list-render-props) | Render | `warn` | Prevents unstable inline render callbacks and object props on list components. |
| [`require-location-watch-cleanup`](#require-location-watch-cleanup) | Battery / Location | `warn` | Ensures async Expo Location watchers are captured and removed. |
| [`no-anonymous-context-values`](#no-anonymous-context-values) | Render | `warn` | Prevents new context provider values from being allocated on every render. |
| [`no-heavy-work-in-render`](#no-heavy-work-in-render) | CPU | `warn` | Flags obvious expensive work in component render bodies. |
| [`prefer-interaction-manager-for-noncritical-work`](#prefer-interaction-manager-for-noncritical-work) | Navigation / FPS | `warn` | Defers expensive focus work until after navigation interactions. |
| [`no-index-key-in-lists`](#no-index-key-in-lists) | Correctness / Render | `warn` | Prevents array indexes from being used as list keys. |

---

### Rule Details

#### `no-uncleaned-native-subscriptions`
Leaving sensor or emitter subscriptions active keeps the hardware active in the background, consuming substantial battery power even when the component is unmounted.

* **Incorrect**:
  ```javascript
  useEffect(() => {
    Accelerometer.addListener(data => { console.log(data); });
  }, []);
  ```
* **Correct**:
  ```javascript
  useEffect(() => {
    const sub = Accelerometer.addListener(data => { console.log(data); });
    return () => sub.remove();
  }, []);
  ```

#### `no-uncleaned-timers`
Timers (`setInterval` / `setTimeout`) that are not cleared on unmount continue running in the background, consuming CPU resources and draining the battery.

* **Incorrect**:
  ```javascript
  useEffect(() => {
    setInterval(() => { syncData(); }, 5000);
  }, []);
  ```
* **Correct**:
  ```javascript
  useEffect(() => {
    const timer = setInterval(() => { syncData(); }, 5000);
    return () => clearInterval(timer);
  }, []);
  ```

#### `no-high-accuracy-location`
Using `Location.Accuracy.BestForNavigation` or `Location.Accuracy.Highest` fires up high-frequency GPS tracking. Consider using `Balanced` or `High` unless absolute precision is required.

* **Incorrect**:
  ```javascript
  Location.watchPositionAsync({ accuracy: Location.Accuracy.BestForNavigation }, callback);
  ```
* **Correct**:
  ```javascript
  Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced }, callback);
  ```

#### `no-unmemoized-array-operations`
Running heavy array methods (like `.filter()`, `.sort()`, or `.reduce()`) inside the component's render body computes the operation on *every single render cycle*, causing frame drops on the JS thread.

* **Incorrect**:
  ```javascript
  const MyComponent = ({ items }) => {
    const activeItems = items.filter(item => item.active);
    return <FlatList data={activeItems} ... />;
  };
  ```
* **Correct**:
  ```javascript
  const MyComponent = ({ items }) => {
    const activeItems = useMemo(() => items.filter(item => item.active), [items]);
    return <FlatList data={activeItems} ... />;
  };
  ```

#### `no-inline-navigation-components`
Passing an inline function component to React Navigation's `component` prop creates a brand new component type on every single render. This forces React to destroy and recreate the screen state and DOM tree, causing inputs to lose focus, scroll positions to reset, and visual lag.

* **Incorrect**:
  ```javascript
  <Stack.Screen name="Home" component={() => <HomeScreen user={user} />} />
  ```
* **Correct**:
  ```javascript
  <Stack.Screen name="Home" component={HomeScreen} initialParams={{ userId: user.id }} />
  ```

#### `use-window-dimensions`
Querying screen dimensions using static `Dimensions.get` calls at the module scope level is calculated only once when the file loads. It won't update when the device rotates, goes into split-screen mode, or a foldable phone unfolds, breaking the UI layout.

* **Incorrect**:
  ```javascript
  import { Dimensions } from 'react-native';
  const { width } = Dimensions.get('window'); // Static!
  
  const MyComponent = () => <View style={{ width: width / 2 }} />;
  ```
* **Correct**:
  ```javascript
  import { useWindowDimensions } from 'react-native';
  
  const MyComponent = () => {
    const { width } = useWindowDimensions(); // Dynamic!
    return <View style={{ width: width / 2 }} />;
  };
  ```

#### `use-expo-image`
React Native's core `Image` lacks native disk and memory caching features, causing repeated downloads and high CPU overhead. `expo-image` compiles to highly-efficient native implementations.

* **Incorrect**:
  ```javascript
  import { Image } from 'react-native';
  ```
* **Correct**:
  ```javascript
  import { Image } from 'expo-image';
  ```

#### `use-native-driver`
Running animations on the JavaScript thread will lag if the JS thread is busy with business logic or state updates. Setting `useNativeDriver: true` offloads the animation work to the native UI thread.

* **Incorrect**:
  ```javascript
  Animated.timing(fadeAnim, { toValue: 1, duration: 500 }).start();
  ```
* **Correct**:
  ```javascript
  Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  ```

#### `prefer-flash-list-for-large-lists`
Dynamic `FlatList` and `SectionList` data can become expensive as feeds grow. Prefer `FlashList` for large or unknown-size lists.

* **Incorrect**:
  ```javascript
  <FlatList data={messages} renderItem={renderMessage} />
  ```
* **Correct**:
  ```javascript
  <FlashList data={messages} renderItem={renderMessage} estimatedItemSize={72} />
  ```

Use `performanceExempt` on a list when a dynamic data source is intentionally small.

#### `no-inline-list-render-props`
Inline list callbacks and style objects create new identities on every render, which can invalidate memoized rows.

* **Incorrect**:
  ```javascript
  <FlatList renderItem={({ item }) => <Row item={item} />} contentContainerStyle={{ padding: 16 }} />
  ```
* **Correct**:
  ```javascript
  <FlatList renderItem={renderItem} contentContainerStyle={contentStyle} />
  ```

#### `require-location-watch-cleanup`
Expo Location watcher subscriptions resolve asynchronously. Capture the resolved subscription and remove it in hook cleanup.

* **Incorrect**:
  ```javascript
  useEffect(() => {
    const sub = Location.watchPositionAsync(options, onLocation);
    return () => sub.remove();
  }, []);
  ```
* **Correct**:
  ```javascript
  useEffect(() => {
    let sub;
    Location.watchPositionAsync(options, onLocation).then(nextSub => {
      sub = nextSub;
    });
    return () => sub?.remove();
  }, []);
  ```

#### `no-anonymous-context-values`
Passing anonymous values to context providers causes all consumers to see a new value on every render.

* **Incorrect**:
  ```javascript
  <SessionContext.Provider value={{ user, logout }}>{children}</SessionContext.Provider>
  ```
* **Correct**:
  ```javascript
  const value = useMemo(() => ({ user, logout }), [user, logout]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
  ```

#### `no-heavy-work-in-render`
Obvious CPU-heavy work in render competes with gestures and animations on the JavaScript thread.

* **Incorrect**:
  ```javascript
  const Profile = ({ raw }) => {
    const parsed = JSON.parse(raw);
    return <Text>{parsed.name}</Text>;
  };
  ```
* **Correct**:
  ```javascript
  const Profile = ({ raw }) => {
    const parsed = useMemo(() => JSON.parse(raw), [raw]);
    return <Text>{parsed.name}</Text>;
  };
  ```

#### `prefer-interaction-manager-for-noncritical-work`
Expensive work started on navigation focus can block transition animations. Defer non-critical work until after interactions settle.

* **Incorrect**:
  ```javascript
  useFocusEffect(() => {
    hydrateDashboard();
  });
  ```
* **Correct**:
  ```javascript
  useFocusEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => hydrateDashboard());
    return () => task.cancel();
  });
  ```

#### `no-index-key-in-lists`
AI-generated list code often falls back to array indexes for keys. This works until items are inserted, removed, filtered, or sorted, then rows can keep the wrong state.

* **Incorrect**:
  ```javascript
  <FlatList data={items} keyExtractor={(item, index) => index.toString()} />
  ```
* **Correct**:
  ```javascript
  <FlatList data={items} keyExtractor={(item) => item.id} />
  ```

---

## Future Proposed Rules

Future rules should stay focused on common AI failure modes: code that looks plausible, passes TypeScript, but usually needs a human cleanup pass before it is production-ready.

1. **`no-complex-svg-in-render`**: Flag large inline SVG trees inside component render paths instead of memoized or extracted components.
2. **`no-duplicate-location-watchers`**: Flag multiple location watchers started without checking whether an existing session is already active.
3. **`no-unbounded-image-cache`**: Flag dynamic remote images that omit dimensions, cache policy, or placeholder strategy.
4. **`no-placeholder-error-handling`**: Flag empty `catch` blocks, `console.error`-only recovery, and TODO placeholder fallbacks in async code.
