import { RuleTester } from '@typescript-eslint/rule-tester';
import * as parser from '@typescript-eslint/parser';
import { useNativeDriverRule } from '../src/rules/use-native-driver';

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
});

ruleTester.run('use-native-driver', useNativeDriverRule, {
  valid: [
    {
      code: "Animated.timing(val, { toValue: 1, useNativeDriver: true });",
    },
    {
      code: "Animated.spring(val, { toValue: 1, useNativeDriver: true });",
    },
    {
      code: "Animated.decay(val, { velocity: 1, useNativeDriver: true });",
    },
    {
      code: "Animated.timing(val, config);", // Ignored if not object literal
    },
  ],
  invalid: [
    {
      code: "Animated.timing(val, { toValue: 1 });",
      errors: [{ messageId: 'missingUseNativeDriver' }],
      output: "Animated.timing(val, { toValue: 1, useNativeDriver: true });",
    },
    {
      code: "Animated.spring(val, { toValue: 1, useNativeDriver: false });",
      errors: [{ messageId: 'nativeDriverFalse' }],
      output: "Animated.spring(val, { toValue: 1, useNativeDriver: true });",
    },
    {
      code: "Animated.decay(val, {});",
      errors: [{ messageId: 'missingUseNativeDriver' }],
      output: "Animated.decay(val, { useNativeDriver: true });",
    },
  ],
});
