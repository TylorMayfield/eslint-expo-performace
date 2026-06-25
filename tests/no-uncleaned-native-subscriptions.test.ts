import { RuleTester } from '@typescript-eslint/rule-tester';
import * as parser from '@typescript-eslint/parser';
import { noUncleanedNativeSubscriptionsRule } from '../src/rules/no-uncleaned-native-subscriptions';

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
});

ruleTester.run('no-uncleaned-native-subscriptions', noUncleanedNativeSubscriptionsRule, {
  valid: [
    {
      code: `
        useEffect(() => {
          const sub = Accelerometer.addListener(data => {});
          return () => sub.remove();
        }, []);
      `,
    },
    {
      code: `
        useEffect(() => {
          const sub = AppState.addEventListener(state => {});
          return () => {
            sub.remove();
          };
        }, []);
      `,
    },
    {
      code: `
        useEffect(() => {
          const cleanup = otherFunction();
          return cleanup;
        }, []);
      `, // Rule should ignore other functions
    },
    {
      code: `
        useEffect(() => {
          const sub = AppState.addEventListener('change', handleChange);
          const cleanup = () => sub.remove();
          return cleanup;
        }, []);
      `,
    },
  ],
  invalid: [
    {
      code: `
        const sub = Accelerometer.addListener(data => {});
      `,
      errors: [{ messageId: 'mustBeInEffect' }],
    },
    {
      code: `
        useEffect(() => {
          Accelerometer.addListener(data => {});
        }, []);
      `,
      errors: [{ messageId: 'mustAssignToVariable' }],
    },
    {
      code: `
        useEffect(() => {
          const sub = Accelerometer.addListener(data => {});
        }, []);
      `,
      errors: [{ messageId: 'noCleanupFunction' }],
    },
    {
      code: `
        useEffect(() => {
          const sub = Accelerometer.addListener(data => {});
          return () => {};
        }, []);
      `,
      errors: [{ messageId: 'notCleanedUp' }],
    },
    {
      code: `
        useEffect(() => {
          const sub = Accelerometer.addListener(data => {});
          return sub;
        }, []);
      `,
      errors: [{ messageId: 'invalidCleanupValue' }],
    },
    {
      code: `
        useEffect(() => {
          const sub = AppState.addEventListener('change', handleChange);
          function cleanup() {
            console.log('still subscribed');
          }
          return cleanup;
        }, []);
      `,
      errors: [{ messageId: 'notCleanedUp' }],
    },
  ],
});
