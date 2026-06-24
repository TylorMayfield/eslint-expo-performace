import { RuleTester } from '@typescript-eslint/rule-tester';
import * as parser from '@typescript-eslint/parser';
import { noUncleanedTimersRule } from '../src/rules/no-uncleaned-timers';

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
});

ruleTester.run('no-uncleaned-timers', noUncleanedTimersRule, {
  valid: [
    {
      code: `
        useEffect(() => {
          const id = setInterval(() => {}, 1000);
          return () => clearInterval(id);
        }, []);
      `,
    },
    {
      code: `
        useEffect(() => {
          const id = setTimeout(() => {}, 1000);
          return () => clearTimeout(id);
        }, []);
      `,
    },
    {
      code: `
        useEffect(() => {
          const id = window.setInterval(() => {}, 1000);
          return () => window.clearInterval(id);
        }, []);
      `,
    },
    {
      code: `
        useEffect(() => {
          const cleanup = otherTimerInit();
          return cleanup;
        }, []);
      `,
    },
  ],
  invalid: [
    {
      code: `
        setInterval(() => {}, 1000);
      `,
      errors: [{ messageId: 'mustBeInEffect' }],
    },
    {
      code: `
        useEffect(() => {
          setInterval(() => {}, 1000);
        }, []);
      `,
      errors: [{ messageId: 'mustAssignToVariable' }],
    },
    {
      code: `
        useEffect(() => {
          const timerId = setInterval(() => {}, 1000);
        }, []);
      `,
      errors: [{ messageId: 'noCleanupFunction' }],
    },
    {
      code: `
        useEffect(() => {
          const timerId = setInterval(() => {}, 1000);
          return () => {};
        }, []);
      `,
      errors: [{ messageId: 'notCleanedUp' }],
    },
    {
      code: `
        useEffect(() => {
          const timerId = setInterval(() => {}, 1000);
          return timerId;
        }, []);
      `,
      errors: [{ messageId: 'invalidCleanupValue' }],
    },
  ],
});
