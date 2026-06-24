import { createRule } from '../utils';
import { TSESTree } from '@typescript-eslint/utils';

export const useWindowDimensionsRule = createRule({
  name: 'use-window-dimensions',
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce using useWindowDimensions hook instead of module-level static Dimensions.get calls.',
    },
    schema: [],
    messages: {
      staticDimensions: 'Do not use Dimensions.get() at the module root scope. This calculation runs only once at startup and does not update on device rotation, split-screen resizing, or foldable screen state changes. Use the `useWindowDimensions` hook inside your components instead.',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (
          callee.type === 'MemberExpression' &&
          callee.object.type === 'Identifier' &&
          callee.object.name === 'Dimensions' &&
          callee.property.type === 'Identifier' &&
          callee.property.name === 'get'
        ) {
          let parent: TSESTree.Node | undefined = node.parent;
          let insideFunction = false;

          while (parent) {
            if (
              parent.type === 'FunctionDeclaration' ||
              parent.type === 'FunctionExpression' ||
              parent.type === 'ArrowFunctionExpression' ||
              parent.type === 'MethodDefinition'
            ) {
              insideFunction = true;
              break;
            }
            parent = parent.parent;
          }

          if (!insideFunction) {
            context.report({
              node,
              messageId: 'staticDimensions',
            });
          }
        }
      },
    };
  },
});
