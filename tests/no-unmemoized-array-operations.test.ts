import { RuleTester } from '@typescript-eslint/rule-tester';
import * as parser from '@typescript-eslint/parser';
import { noUnmemoizedArrayOperationsRule } from '../src/rules/no-unmemoized-array-operations';

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

ruleTester.run('no-unmemoized-array-operations', noUnmemoizedArrayOperationsRule, {
  valid: [
    {
      code: "const items = [1, 2, 3].filter(x => x > 1);", // Outside component
    },
    {
      code: `
        const MyComponent = () => {
          const active = useMemo(() => items.filter(x => x.active), [items]);
          return null;
        };
      `,
    },
    {
      code: `
        const MyComponent = () => {
          const handlePress = () => {
            const active = items.filter(x => x.active);
          };
          return null;
        };
      `,
    },
    {
      code: `
        const MyComponent = () => {
          useEffect(() => {
            const active = items.filter(x => x.active);
          }, []);
          return null;
        };
      `,
    },
    {
      code: `
        const MyComponent = () => {
          // Mapping items for JSX rendering directly in JSX is standard and ignored by this rule
          return (
            <View>
              {items.map(item => <Text>{item.name}</Text>)}
            </View>
          );
        };
      `,
    },
  ],
  invalid: [
    {
      code: `
        const MyComponent = () => {
          const active = items.filter(x => x.active);
          return null;
        };
      `,
      errors: [{ messageId: 'unmemoizedArrayOp' }],
    },
    {
      code: `
        function MyComponent() {
          const sorted = items.sort((a, b) => b.val - a.val);
          return null;
        }
      `,
      errors: [{ messageId: 'unmemoizedArrayOp' }],
    },
    {
      code: `
        const MyComponent = () => {
          const total = items.reduce((sum, item) => sum + item.val, 0);
          return null;
        };
      `,
      errors: [{ messageId: 'unmemoizedArrayOp' }],
    },
  ],
});
