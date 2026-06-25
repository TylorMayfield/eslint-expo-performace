import { RuleTester } from '@typescript-eslint/rule-tester';
import * as parser from '@typescript-eslint/parser';
import { preferInteractionManagerForNoncriticalWorkRule } from '../src/rules/prefer-interaction-manager-for-noncritical-work';

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
});

ruleTester.run('prefer-interaction-manager-for-noncritical-work', preferInteractionManagerForNoncriticalWorkRule, {
  valid: [
    {
      code: `
        useFocusEffect(
          useCallback(() => {
            const task = InteractionManager.runAfterInteractions(() => {
              hydrateDashboard();
            });
            return () => task.cancel();
          }, [])
        );
      `,
    },
    {
      code: `
        navigation.addListener('focus', () => {
          setFocused(true);
        });
      `,
    },
  ],
  invalid: [
    {
      code: `
        useFocusEffect(
          useCallback(() => {
            hydrateDashboard();
          }, [])
        );
      `,
      errors: [{ messageId: 'preferInteractionManager' }],
    },
    {
      code: `
        navigation.addListener('focus', () => {
          const rows = cachedRows.filter(row => row.visible);
          setRows(rows);
        });
      `,
      errors: [{ messageId: 'preferInteractionManager' }],
    },
    {
      code: `
        useFocusEffect(() => {
          JSON.parse(cachedPayload);
        });
      `,
      errors: [{ messageId: 'preferInteractionManager' }],
    },
  ],
});
