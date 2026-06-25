import { createRule, getJSXElementName } from '../utils';
import { TSESTree } from '@typescript-eslint/utils';

const listNames = new Set(['FlatList', 'SectionList']);

function getAttribute(
  attributes: TSESTree.JSXOpeningElement['attributes'],
  name: string
): TSESTree.JSXAttribute | undefined {
  return attributes.find(
    (attribute): attribute is TSESTree.JSXAttribute =>
      attribute.type === 'JSXAttribute' &&
      attribute.name.type === 'JSXIdentifier' &&
      attribute.name.name === name
  );
}

function getArrayLiteralLength(attribute: TSESTree.JSXAttribute | undefined): number | null {
  if (
    !attribute?.value ||
    attribute.value.type !== 'JSXExpressionContainer' ||
    attribute.value.expression.type !== 'ArrayExpression'
  ) {
    return null;
  }

  return attribute.value.expression.elements.length;
}

export const preferFlashListForLargeListsRule = createRule({
  name: 'prefer-flash-list-for-large-lists',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer FlashList for non-trivial React Native lists to reduce memory churn and improve scroll performance.',
    },
    schema: [],
    messages: {
      preferFlashList: 'Prefer FlashList for large or dynamic {{component}} data. It recycles rows more efficiently than React Native list primitives.',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      JSXOpeningElement(node) {
        const componentName = getJSXElementName(node.name);
        if (!listNames.has(componentName)) {
          return;
        }

        const dataAttribute = getAttribute(node.attributes, 'data') ?? getAttribute(node.attributes, 'sections');
        const literalLength = getArrayLiteralLength(dataAttribute);

        if (literalLength !== null && literalLength <= 10) {
          return;
        }

        if (getAttribute(node.attributes, 'performanceExempt')) {
          return;
        }

        if (dataAttribute) {
          context.report({
            node: node.name,
            messageId: 'preferFlashList',
            data: { component: componentName },
          });
        }
      },
    };
  },
});
