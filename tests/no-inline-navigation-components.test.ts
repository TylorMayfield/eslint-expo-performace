import { RuleTester } from '@typescript-eslint/rule-tester';
import * as parser from '@typescript-eslint/parser';
import { noInlineNavigationComponentsRule } from '../src/rules/no-inline-navigation-components';

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

ruleTester.run('no-inline-navigation-components', noInlineNavigationComponentsRule, {
  valid: [
    {
      code: '<Stack.Screen name="Home" component={HomeScreen} />;',
    },
    {
      code: '<Tab.Screen name="Settings" component={SettingsScreen} />;',
    },
    {
      code: '<Screen name="Details" component={DetailsScreen} />;',
    },
    {
      code: '<MyCustomComponent component={() => <Home />} />;', // ignored since element name is not *.Screen or Screen
    },
  ],
  invalid: [
    {
      code: '<Stack.Screen name="Home" component={() => <HomeScreen />} />;',
      errors: [{ messageId: 'noInlineNavigationComponent' }],
    },
    {
      code: '<Tab.Screen name="Settings" component={function() { return <SettingsScreen />; }} />;',
      errors: [{ messageId: 'noInlineNavigationComponent' }],
    },
    {
      code: '<Screen name="Details" component={(props) => <DetailsScreen {...props} />} />;',
      errors: [{ messageId: 'noInlineNavigationComponent' }],
    },
  ],
});
