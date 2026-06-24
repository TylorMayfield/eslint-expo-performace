import { RuleTester } from '@typescript-eslint/rule-tester';
import * as parser from '@typescript-eslint/parser';
import { useWindowDimensionsRule } from '../src/rules/use-window-dimensions';

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
});

ruleTester.run('use-window-dimensions', useWindowDimensionsRule, {
  valid: [
    {
      code: `
        const MyComponent = () => {
          const { width } = useWindowDimensions();
          return null;
        };
      `,
    },
    {
      code: `
        function getDims() {
          return Dimensions.get('window');
        }
      `, // Inside helper function, valid
    },
    {
      code: `
        const MyComponent = () => {
          const { width } = Dimensions.get('window');
          return null;
        };
      `, // Inside component body (though useWindowDimensions is better, it's not root scope)
    },
  ],
  invalid: [
    {
      code: `
        const { width } = Dimensions.get('window');
        const MyComponent = () => null;
      `,
      errors: [{ messageId: 'staticDimensions' }],
    },
    {
      code: `
        const screen = Dimensions.get('screen');
      `,
      errors: [{ messageId: 'staticDimensions' }],
    },
  ],
});
