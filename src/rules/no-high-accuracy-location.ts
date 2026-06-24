import { createRule } from '../utils';
import { TSESTree } from '@typescript-eslint/utils';

export const noHighAccuracyLocationRule = createRule({
  name: 'no-high-accuracy-location',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Avoid using high-accuracy location tracking that leads to rapid battery drain.',
    },
    schema: [],
    messages: {
      highAccuracyLocation: 'High location accuracy settings (Highest/BestForNavigation) drain the battery rapidly. Use Balanced or High accuracy unless absolute precision is required.',
    },
  },
  defaultOptions: [],
  create(context) {
    function isHighAccuracyEnum(node: TSESTree.Node): boolean {
      if (node.type === 'MemberExpression') {
        // Check for Location.Accuracy.Highest or Location.Accuracy.BestForNavigation
        if (
          node.object.type === 'MemberExpression' &&
          node.object.object.type === 'Identifier' &&
          node.object.object.name === 'Location' &&
          node.object.property.type === 'Identifier' &&
          node.object.property.name === 'Accuracy' &&
          node.property.type === 'Identifier' &&
          (node.property.name === 'Highest' || node.property.name === 'BestForNavigation')
        ) {
          return true;
        }
        // Check for Accuracy.Highest or Accuracy.BestForNavigation
        if (
          node.object.type === 'Identifier' &&
          node.object.name === 'Accuracy' &&
          node.property.type === 'Identifier' &&
          (node.property.name === 'Highest' || node.property.name === 'BestForNavigation')
        ) {
          return true;
        }
      }
      return false;
    }

    function isInsideLocationCall(node: TSESTree.Node): boolean {
      let parent = node.parent;
      while (parent) {
        if (parent.type === 'CallExpression') {
          const callee = parent.callee;
          if (
            callee.type === 'MemberExpression' &&
            callee.object.type === 'Identifier' &&
            callee.object.name === 'Location'
          ) {
            return true;
          }
        }
        parent = parent.parent;
      }
      return false;
    }

    return {
      Property(node) {
        if (
          node.key.type === 'Identifier' &&
          node.key.name === 'accuracy'
        ) {
          const value = node.value;
          
          // Case 1: Enum usage (Location.Accuracy.Highest, Accuracy.Highest, etc.)
          if (isHighAccuracyEnum(value)) {
            context.report({
              node: value,
              messageId: 'highAccuracyLocation',
            });
            return;
          }

          // Case 2: Numeric literals (5 or 6) inside a Location API call
          if (
            value.type === 'Literal' &&
            (value.value === 5 || value.value === 6) &&
            isInsideLocationCall(node)
          ) {
            context.report({
              node: value,
              messageId: 'highAccuracyLocation',
            });
          }
        }
      },
    };
  },
});
