import { createRule } from '../utils';
import { TSESTree } from '@typescript-eslint/utils';

export const noInlineNavigationComponentsRule = createRule({
  name: 'no-inline-navigation-components',
  meta: {
    type: 'problem',
    docs: {
      description: 'Do not pass inline functional components to React Navigation Screen components.',
    },
    schema: [],
    messages: {
      noInlineNavigationComponent: 'Do not pass an inline function to the component prop. This causes React Navigation to destroy and recreate the screen component on every render, resetting its state and causing severe performance flickering. Pass the component reference directly (e.g. component={HomeScreen}) or wrap it.',
    },
  },
  defaultOptions: [],
  create(context) {
    function getJSXElementName(node: TSESTree.JSXTagNameExpression): string {
      if (node.type === 'JSXIdentifier') {
        return node.name;
      }
      if (node.type === 'JSXMemberExpression') {
        return `${getJSXElementName(node.object)}.${node.property.name}`;
      }
      return '';
    }

    return {
      JSXAttribute(node) {
        if (node.name.type === 'JSXIdentifier' && node.name.name === 'component') {
          const parent = node.parent;
          if (parent && parent.type === 'JSXOpeningElement') {
            const elementName = getJSXElementName(parent.name);
            if (elementName.endsWith('.Screen') || elementName === 'Screen') {
              const value = node.value;
              if (value && value.type === 'JSXExpressionContainer') {
                const expression = value.expression;
                if (
                  expression.type === 'ArrowFunctionExpression' ||
                  expression.type === 'FunctionExpression'
                ) {
                  context.report({
                    node: expression,
                    messageId: 'noInlineNavigationComponent',
                  });
                }
              }
            }
          }
        }
      },
    };
  },
});
