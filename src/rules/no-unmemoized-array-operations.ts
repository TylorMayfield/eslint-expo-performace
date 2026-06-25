import { createRule, isInsideHookCallback, isInsideReactComponentRender } from '../utils';

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

          const insideMemoizedCallback = isInsideHookCallback(
            node,
            new Set(['useMemo', 'useCallback', 'useEffect', 'useFocusEffect'])
          );

          if (isInsideReactComponentRender(node) && !insideMemoizedCallback) {
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
