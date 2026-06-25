import { RuleTester } from '@typescript-eslint/rule-tester';
import * as parser from '@typescript-eslint/parser';
import { preferFlashListForLargeListsRule } from '../src/rules/prefer-flash-list-for-large-lists';

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

ruleTester.run('prefer-flash-list-for-large-lists', preferFlashListForLargeListsRule, {
  valid: [
    {
      code: '<FlashList data={messages} renderItem={renderMessage} estimatedItemSize={72} />;',
    },
    {
      code: '<FlatList data={[a, b, c]} renderItem={renderItem} />;',
    },
    {
      code: '<FlatList data={items} renderItem={renderItem} performanceExempt />;',
    },
  ],
  invalid: [
    {
      code: '<FlatList data={messages} renderItem={renderMessage} />;',
      errors: [{ messageId: 'preferFlashList' }],
    },
    {
      code: '<SectionList sections={groupedNotifications} renderItem={renderNotification} />;',
      errors: [{ messageId: 'preferFlashList' }],
    },
    {
      code: '<FlatList data={[a, b, c, d, e, f, g, h, i, j, k]} renderItem={renderItem} />;',
      errors: [{ messageId: 'preferFlashList' }],
    },
  ],
});
