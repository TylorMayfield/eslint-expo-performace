import { RuleTester } from '@typescript-eslint/rule-tester';
import * as parser from '@typescript-eslint/parser';
import { noIndexKeyInListsRule } from '../src/rules/no-index-key-in-lists';

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

ruleTester.run('no-index-key-in-lists', noIndexKeyInListsRule, {
  valid: [
    {
      code: '<FlatList data={items} keyExtractor={(item) => item.id} renderItem={renderItem} />;',
    },
    {
      code: 'items.map((item) => <Row key={item.id} item={item} />);',
    },
    {
      code: '<View key={index} />;',
    },
  ],
  invalid: [
    {
      code: '<FlatList data={items} keyExtractor={(item, index) => index.toString()} renderItem={renderItem} />;',
      errors: [{ messageId: 'noIndexKey' }],
    },
    {
      code: '<FlashList data={items} keyExtractor={(_, index) => `${index}`} renderItem={renderItem} />;',
      errors: [{ messageId: 'noIndexKey' }],
    },
    {
      code: 'items.map((item, index) => <Row key={index} item={item} />);',
      errors: [{ messageId: 'noIndexKey' }],
    },
  ],
});
