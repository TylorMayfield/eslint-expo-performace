import { createRule, isInsideHookCallback, isInsideReactComponentRender } from '../utils';
import { TSESTree } from '@typescript-eslint/utils';

function getHeavyCallName(node: TSESTree.CallExpression): string | null {
  const callee = node.callee;

  if (
    callee.type === 'MemberExpression' &&
    callee.object.type === 'Identifier' &&
    callee.object.name === 'JSON' &&
    callee.property.type === 'Identifier' &&
    (callee.property.name === 'parse' || callee.property.name === 'stringify')
  ) {
    return `JSON.${callee.property.name}`;
  }

  if (
    callee.type === 'MemberExpression' &&
    callee.object.type === 'Identifier' &&
    callee.object.name === 'Intl' &&
    callee.property.type === 'Identifier' &&
    (callee.property.name === 'DateTimeFormat' || callee.property.name === 'NumberFormat')
  ) {
    return `Intl.${callee.property.name}`;
  }

  if (
    callee.type === 'Identifier' &&
    /^(calculate|compute|process|transform|normalize|format)[A-Z_]/.test(callee.name)
  ) {
    return callee.name;
  }

  return null;
}

export const noHeavyWorkInRenderRule = createRule({
  name: 'no-heavy-work-in-render',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Avoid obvious heavy work inside React component render bodies.',
    },
    schema: [],
    messages: {
      heavyWorkInRender: '`{{work}}` runs during render. Move heavy work into useMemo, an effect, or a background/deferred path.',
    },
  },
  defaultOptions: [],
  create(context) {
    const memoHooks = new Set(['useMemo', 'useCallback']);

    return {
      CallExpression(node) {
        const workName = getHeavyCallName(node);
        if (!workName) {
          return;
        }

        if (isInsideReactComponentRender(node) && !isInsideHookCallback(node, memoHooks)) {
          context.report({
            node,
            messageId: 'heavyWorkInRender',
            data: { work: workName },
          });
        }
      },
      NewExpression(node) {
        if (
          node.callee.type !== 'Identifier' ||
          (node.callee.name !== 'RegExp' && node.callee.name !== 'Date')
        ) {
          return;
        }

        if (isInsideReactComponentRender(node) && !isInsideHookCallback(node, memoHooks)) {
          context.report({
            node,
            messageId: 'heavyWorkInRender',
            data: { work: `new ${node.callee.name}` },
          });
        }
      },
    };
  },
});
