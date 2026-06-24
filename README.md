# eslint-plugin-expo-performance

An ESLint plugin for Expo and React Native projects designed to identify bad practices that lead to high battery usage, memory leaks, and CPU performance bottlenecks.

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
  expoPerformance.configs['flat/recommended'],
  
  // Or manually configure individual rules
  {
    plugins: {
      'expo-performance': expoPerformance,
    },
    rules: {
      'expo-performance/no-uncleaned-native-subscriptions': 'error',
      'expo-performance/no-uncleaned-timers': 'error',
      'expo-performance/no-high-accuracy-location': 'warn',
      'expo-performance/no-unmemoized-array-operations': 'warn',
      'expo-performance/no-inline-navigation-components': 'error',
      'expo-performance/use-window-dimensions': 'error',
      'expo-performance/use-expo-image': 'warn',
      'expo-performance/use-native-driver': 'warn',
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

This plugin includes the following rules to target battery usage and performance:

| Rule | Category | Severity | Description |
| :--- | :--- | :--- | :--- |
| [`no-uncleaned-native-subscriptions`](#no-uncleaned-native-subscriptions) | Battery / Memory | `error` | Ensures hardware sensor subscriptions (Accelerometer, Gyroscope, etc.) are cleaned up inside hooks. |
| [`no-uncleaned-timers`](#no-uncleaned-timers) | Battery / CPU | `error` | Ensures `setInterval` and `setTimeout` are cleared. |
| [`no-high-accuracy-location`](#no-high-accuracy-location) | Battery | `warn` | Flags energy-intensive accuracy levels (Highest/BestForNavigation) in Expo Location. |
| [`no-unmemoized-array-operations`](#no-unmemoized-array-operations) | CPU | `warn` | Flags unmemoized heavy array transformations (`filter`/`sort`/`reduce`) inside component renders. |
| [`no-inline-navigation-components`](#no-inline-navigation-components) | CPU / Render | `error` | Prevents screen unmount/remount loops caused by inline functions in screen component definitions. |
| [`use-window-dimensions`](#use-window-dimensions) | Layout | `error` | Enforces `useWindowDimensions` hook instead of static module-level `Dimensions.get` queries. |
| [`use-expo-image`](#use-expo-image) | CPU / Memory | `warn` | Enforces using `expo-image` instead of `react-native` Image for optimized caching and memory. |
| [`use-native-driver`](#use-native-driver) | CPU / FPS | `warn` | Enforces `useNativeDriver: true` for React Native Animated transitions. |

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

---

## Future Proposed Rules

These rules represent additional opportunities to optimize React Native/Expo performance:

1. **`use-flash-list`**: Enforce utilizing Shopify's `@shopify/flash-list` instead of standard React Native `<FlatList>` for large, scrollable datasets. `FlashList` recycles views rather than re-creating them, resulting in smoother scrolling and lower memory churn.
2. **`no-inline-jsx-objects-in-lists`**: Warn against passing new object or array literals in JSX properties inside lists or frequently rendered components (e.g. `style={{ margin: 10 }}` or `renderItem={({ item }) => <Row item={item} />`), as this forces re-rendering of all children because of new identity allocation.
3. **`no-complex-svg-in-render`**: Enforce rendering complex SVG code through compiled components or memoization rather than embedding large raw SVG structures directly in the rendering path, avoiding recalculation of SVG paths.
4. **`no-duplicate-location-watchers`**: Flag cases where multiple location watching operations are started concurrently without checking if an existing session is running.
