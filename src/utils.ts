import { ESLintUtils } from '@typescript-eslint/utils';

export const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/tylormayfield/eslint-plugin-expo-performance/blob/main/docs/rules/${name}.md`
);
