import { RuleTester } from '@typescript-eslint/rule-tester';
import * as parser from '@typescript-eslint/parser';
import { noHeavyWorkInRenderRule } from '../src/rules/no-heavy-work-in-render';

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

ruleTester.run('no-heavy-work-in-render', noHeavyWorkInRenderRule, {
  valid: [
    {
      code: `
        const Profile = ({ raw }) => {
          const parsed = useMemo(() => JSON.parse(raw), [raw]);
          return <Text>{parsed.name}</Text>;
        };
      `,
    },
    {
      code: `
        const Profile = ({ raw }) => {
          const handlePress = () => JSON.parse(raw);
          return <Button onPress={handlePress} />;
        };
      `,
    },
  ],
  invalid: [
    {
      code: `
        const Profile = ({ raw }) => {
          const parsed = JSON.parse(raw);
          return <Text>{parsed.name}</Text>;
        };
      `,
      errors: [{ messageId: 'heavyWorkInRender' }],
    },
    {
      code: `
        function Feed({ query }) {
          const matcher = new RegExp(query, 'i');
          return null;
        }
      `,
      errors: [{ messageId: 'heavyWorkInRender' }],
    },
    {
      code: `
        const Dashboard = ({ rows }) => {
          const summary = calculateSummary(rows);
          return null;
        };
      `,
      errors: [{ messageId: 'heavyWorkInRender' }],
    },
  ],
});
