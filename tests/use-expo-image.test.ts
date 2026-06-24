import { RuleTester } from '@typescript-eslint/rule-tester';
import * as parser from '@typescript-eslint/parser';
import { useExpoImageRule } from '../src/rules/use-expo-image';

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

ruleTester.run('use-expo-image', useExpoImageRule, {
  valid: [
    {
      code: "import { Image } from 'expo-image';",
    },
    {
      code: "import { View, Text } from 'react-native';",
    },
    {
      code: "import { Image } from 'expo-image';\nimport { View } from 'react-native';",
    },
    {
      code: "const MyComponent = () => <View><Text>Hello</Text></View>;",
    },
  ],
  invalid: [
    {
      code: "import { Image } from 'react-native';",
      errors: [{ messageId: 'useExpoImage' }],
      output: "import { Image } from 'expo-image';",
    },
    {
      code: "import { View, Image, Text } from 'react-native';",
      errors: [{ messageId: 'useExpoImage' }],
      output: "import { View, Text } from 'react-native';\nimport { Image } from 'expo-image';",
    },
    {
      code: "const element = <img src='logo.png' />;",
      errors: [{ messageId: 'useExpoImage' }],
    },
  ],
});
