import { createRule } from '../utils';
import { TSESTree } from '@typescript-eslint/utils';

export const noUnmemoizedArrayOperationsRule = createRule({
  name: 'no-unmemoized-array-operations',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Avoid performing unmemoized array operations inside React rendering path to reduce CPU churn.',
    },
    schema: [],
    messages: {
      unmemoizedArrayOp: 'Array operation `.{{method}}()` runs on every render cycle. Wrap it in `useMemo` to optimize CPU usage and rendering performance.',
    },
  },
  defaultOptions: [],
  create(context) {
    const heavyArrayMethods = new Set(['filter', 'sort', 'reduce']);

    return {
      CallExpression(node) {
        const callee = node.callee;
        if (
          callee.type === 'MemberExpression' &&
          callee.property.type === 'Identifier' &&
          heavyArrayMethods.has(callee.property.name)
        ) {
          const methodName = callee.property.name;

          // Traverse up to check context
          let parent: TSESTree.Node | undefined = node.parent;
          let wrappedInAllowedHook = false;
          let insideEventHandler = false;
          let insideComponent = false;

          while (parent) {
            // Check if wrapped in common hook calls
            if (parent.type === 'CallExpression') {
              const hookCallee = parent.callee;
              if (
                hookCallee.type === 'Identifier' &&
                (hookCallee.name.startsWith('use') || hookCallee.name === 'useEffect')
              ) {
                wrappedInAllowedHook = true;
                break;
              }
              if (
                hookCallee.type === 'MemberExpression' &&
                hookCallee.object.type === 'Identifier' &&
                hookCallee.object.name === 'React' &&
                hookCallee.property.type === 'Identifier' &&
                hookCallee.property.name.startsWith('use')
              ) {
                wrappedInAllowedHook = true;
                break;
              }
            }

            // Check if inside a function declaration/expression
            if (
              parent.type === 'FunctionDeclaration' ||
              parent.type === 'FunctionExpression' ||
              parent.type === 'ArrowFunctionExpression'
            ) {
              let fnName = '';
              if (parent.type === 'FunctionDeclaration' && parent.id) {
                fnName = parent.id.name;
              } else if (
                parent.parent &&
                parent.parent.type === 'VariableDeclarator' &&
                parent.parent.id.type === 'Identifier'
              ) {
                fnName = parent.parent.id.name;
              }

              if (fnName) {
                // If it's an event handler, it doesn't run on render
                if (fnName.startsWith('handle') || fnName.startsWith('on')) {
                  insideEventHandler = true;
                  break;
                }

                // If PascalCase, it is a component
                if (/^[A-Z]/.test(fnName)) {
                  insideComponent = true;
                  break;
                }
              }
            }

            parent = parent.parent;
          }

          if (insideComponent && !wrappedInAllowedHook && !insideEventHandler) {
            context.report({
              node: callee.property,
              messageId: 'unmemoizedArrayOp',
              data: {
                method: methodName,
              },
            });
          }
        }
      },
    };
  },
});
