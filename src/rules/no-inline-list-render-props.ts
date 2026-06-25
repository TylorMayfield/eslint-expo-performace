import { createRule, getJSXElementName } from '../utils';

const listComponents = new Set(['FlatList', 'SectionList', 'FlashList', 'Animated.FlatList']);
const functionProps = new Set([
  'renderItem',
  'keyExtractor',
  'ItemSeparatorComponent',
  'ListHeaderComponent',
  'ListFooterComponent',
  'ListEmptyComponent',
]);
const objectProps = new Set(['contentContainerStyle', 'columnWrapperStyle']);

export const noInlineListRenderPropsRule = createRule({
  name: 'no-inline-list-render-props',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Avoid inline render callbacks and object props on React Native list components.',
    },
    schema: [],
    messages: {
      inlineListProp: 'Avoid inline `{{prop}}` on {{component}}. Move it to a stable function/component or memoized value to reduce row rerenders.',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.type !== 'JSXIdentifier') {
          return;
        }

        const openingElement = node.parent;
        if (openingElement?.type !== 'JSXOpeningElement') {
          return;
        }

        const componentName = getJSXElementName(openingElement.name);
        if (!listComponents.has(componentName)) {
          return;
        }

        const propName = node.name.name;
        const expression = node.value?.type === 'JSXExpressionContainer' ? node.value.expression : null;
        const isInlineFunction =
          functionProps.has(propName) &&
          expression &&
          (expression.type === 'ArrowFunctionExpression' || expression.type === 'FunctionExpression');
        const isInlineObject =
          objectProps.has(propName) &&
          expression &&
          (expression.type === 'ObjectExpression' || expression.type === 'ArrayExpression');

        if (isInlineFunction || isInlineObject) {
          context.report({
            node,
            messageId: 'inlineListProp',
            data: {
              prop: propName,
              component: componentName,
            },
          });
        }
      },
    };
  },
});
