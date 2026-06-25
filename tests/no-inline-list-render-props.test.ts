import { RuleTester } from '@typescript-eslint/rule-tester';
import * as parser from '@typescript-eslint/parser';
import { noInlineListRenderPropsRule } from '../src/rules/no-inline-list-render-props';

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

ruleTester.run('no-inline-list-render-props', noInlineListRenderPropsRule, {
  valid: [
    {
      code: '<FlatList data={items} renderItem={renderItem} keyExtractor={keyExtractor} />;',
    },
    {
      code: '<FlashList data={items} contentContainerStyle={contentStyle} renderItem={renderItem} />;',
    },
    {
      code: '<View renderItem={() => <Row />} />;',
    },
  ],
  invalid: [
    {
      code: '<FlatList data={items} renderItem={({ item }) => <Row item={item} />} />;',
      errors: [{ messageId: 'inlineListProp' }],
    },
    {
      code: '<SectionList sections={sections} keyExtractor={(item) => item.id} />;',
      errors: [{ messageId: 'inlineListProp' }],
    },
    {
      code: '<FlashList data={items} contentContainerStyle={{ padding: 16 }} renderItem={renderItem} />;',
      errors: [{ messageId: 'inlineListProp' }],
    },
  ],
});
