import { createRule, getJSXElementName } from '../utils';
import { TSESTree } from '@typescript-eslint/utils';

const listComponents = new Set(['FlatList', 'SectionList', 'FlashList']);

function isIndexIdentifier(node: TSESTree.Node, indexName: string): boolean {
  return node.type === 'Identifier' && node.name === indexName;
}

function returnsIndex(node: TSESTree.Node, indexName: string): boolean {
  if (isIndexIdentifier(node, indexName)) {
    return true;
  }

  if (
    node.type === 'CallExpression' &&
    node.callee.type === 'MemberExpression' &&
    isIndexIdentifier(node.callee.object, indexName) &&
    node.callee.property.type === 'Identifier' &&
    node.callee.property.name === 'toString'
  ) {
    return true;
  }

  if (
    node.type === 'TemplateLiteral' &&
    node.expressions.some((expression) => isIndexIdentifier(expression, indexName))
  ) {
    return true;
  }

  return false;
}

function getIndexParamName(fn: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression): string | null {
  const indexParam = fn.params[1];
  return indexParam?.type === 'Identifier' ? indexParam.name : null;
}

export const noIndexKeyInListsRule = createRule({
  name: 'no-index-key-in-lists',
  meta: {
    type: 'problem',
    docs: {
      description: 'Avoid array indexes as React keys in lists because they break row identity when data changes.',
    },
    schema: [],
    messages: {
      noIndexKey: 'Do not use the array index as a list key. Use a stable item id so rows keep correct identity when data is inserted, removed, or sorted.',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.type !== 'JSXIdentifier') {
          return;
        }

        if (
          node.name.name === 'keyExtractor' &&
          node.value?.type === 'JSXExpressionContainer' &&
          (node.value.expression.type === 'ArrowFunctionExpression' ||
            node.value.expression.type === 'FunctionExpression')
        ) {
          const openingElement = node.parent;
          if (
            openingElement?.type !== 'JSXOpeningElement' ||
            !listComponents.has(getJSXElementName(openingElement.name))
          ) {
            return;
          }

          const indexName = getIndexParamName(node.value.expression);
          if (!indexName) {
            return;
          }

          const body = node.value.expression.body;
          if (returnsIndex(body, indexName)) {
            context.report({ node, messageId: 'noIndexKey' });
          }
          return;
        }

        if (
          node.name.name === 'key' &&
          node.value?.type === 'JSXExpressionContainer'
        ) {
          let parent: TSESTree.Node | undefined = node.parent as TSESTree.Node | undefined;

          while (parent) {
            if (
              parent.type === 'ArrowFunctionExpression' ||
              parent.type === 'FunctionExpression'
            ) {
              const indexName = getIndexParamName(parent);
              if (indexName && returnsIndex(node.value.expression, indexName)) {
                context.report({ node, messageId: 'noIndexKey' });
              }
              return;
            }

            parent = parent.parent;
          }
        }
      },
    };
  },
});
