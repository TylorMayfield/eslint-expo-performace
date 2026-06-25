import { createRule, getJSXElementName } from '../utils';

export const noAnonymousContextValuesRule = createRule({
  name: 'no-anonymous-context-values',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Avoid anonymous object, array, and function values in React context providers.',
    },
    schema: [],
    messages: {
      anonymousContextValue: 'Avoid creating a new `value` for {{provider}} on every render. Memoize it with useMemo/useCallback or pass a stable reference.',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      JSXAttribute(node) {
        if (
          node.name.type !== 'JSXIdentifier' ||
          node.name.name !== 'value' ||
          node.value?.type !== 'JSXExpressionContainer'
        ) {
          return;
        }

        const openingElement = node.parent;
        if (openingElement?.type !== 'JSXOpeningElement') {
          return;
        }

        const providerName = getJSXElementName(openingElement.name);
        if (!providerName.endsWith('.Provider')) {
          return;
        }

        const expression = node.value.expression;
        if (
          expression.type === 'ObjectExpression' ||
          expression.type === 'ArrayExpression' ||
          expression.type === 'ArrowFunctionExpression' ||
          expression.type === 'FunctionExpression'
        ) {
          context.report({
            node,
            messageId: 'anonymousContextValue',
            data: { provider: providerName },
          });
        }
      },
    };
  },
});
