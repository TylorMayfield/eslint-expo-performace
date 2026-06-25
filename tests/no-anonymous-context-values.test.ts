import { RuleTester } from '@typescript-eslint/rule-tester';
import * as parser from '@typescript-eslint/parser';
import { noAnonymousContextValuesRule } from '../src/rules/no-anonymous-context-values';

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

ruleTester.run('no-anonymous-context-values', noAnonymousContextValuesRule, {
  valid: [
    {
      code: `
        const value = useMemo(() => ({ user, logout }), [user, logout]);
        <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
      `,
    },
    {
      code: '<ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;',
    },
    {
      code: '<View value={{ ignored: true }} />;',
    },
  ],
  invalid: [
    {
      code: '<SessionContext.Provider value={{ user, logout }}>{children}</SessionContext.Provider>;',
      errors: [{ messageId: 'anonymousContextValue' }],
    },
    {
      code: '<FiltersContext.Provider value={[filters, setFilters]}>{children}</FiltersContext.Provider>;',
      errors: [{ messageId: 'anonymousContextValue' }],
    },
    {
      code: '<CallbackContext.Provider value={() => refresh()}>{children}</CallbackContext.Provider>;',
      errors: [{ messageId: 'anonymousContextValue' }],
    },
  ],
});
