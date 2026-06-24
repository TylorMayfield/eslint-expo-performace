import { RuleTester } from '@typescript-eslint/rule-tester';
import * as parser from '@typescript-eslint/parser';
import { noHighAccuracyLocationRule } from '../src/rules/no-high-accuracy-location';

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
});

ruleTester.run('no-high-accuracy-location', noHighAccuracyLocationRule, {
  valid: [
    {
      code: "Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced }, callback);",
    },
    {
      code: "Location.watchPositionAsync({ accuracy: Location.Accuracy.High }, callback);",
    },
    {
      code: "Location.getCurrentPositionAsync({ accuracy: 3 });", // 3 = Balanced
    },
    {
      code: "const accuracy = 6; // outside call, ignored if numeric",
    },
  ],
  invalid: [
    {
      code: "Location.watchPositionAsync({ accuracy: Location.Accuracy.BestForNavigation }, callback);",
      errors: [{ messageId: 'highAccuracyLocation' }],
    },
    {
      code: "Location.watchPositionAsync({ accuracy: Location.Accuracy.Highest }, callback);",
      errors: [{ messageId: 'highAccuracyLocation' }],
    },
    {
      code: "Location.watchPositionAsync({ accuracy: 6 }, callback);", // 6 = BestForNavigation
      errors: [{ messageId: 'highAccuracyLocation' }],
    },
    {
      code: "Location.getCurrentPositionAsync({ accuracy: 5 });", // 5 = Highest
      errors: [{ messageId: 'highAccuracyLocation' }],
    },
    {
      code: "import { Accuracy } from 'expo-location';\nconst config = { accuracy: Accuracy.Highest };",
      errors: [{ messageId: 'highAccuracyLocation' }],
    },
  ],
});
