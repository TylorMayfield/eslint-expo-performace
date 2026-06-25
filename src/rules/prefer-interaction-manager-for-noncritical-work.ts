import { createRule } from '../utils';
import { TSESTree } from '@typescript-eslint/utils';

function isInteractionManagerCall(node: TSESTree.Node): boolean {
  return (
    node.type === 'CallExpression' &&
    node.callee.type === 'MemberExpression' &&
    node.callee.object.type === 'Identifier' &&
    node.callee.object.name === 'InteractionManager' &&
    node.callee.property.type === 'Identifier' &&
    node.callee.property.name === 'runAfterInteractions'
  );
}

function isHeavyFocusWork(node: TSESTree.Node): boolean {
  if (node.type === 'CallExpression') {
    const callee = node.callee;
    if (
      callee.type === 'MemberExpression' &&
      callee.object.type === 'Identifier' &&
      callee.object.name === 'JSON' &&
      callee.property.type === 'Identifier' &&
      (callee.property.name === 'parse' || callee.property.name === 'stringify')
    ) {
      return true;
    }

    if (
      callee.type === 'MemberExpression' &&
      callee.property.type === 'Identifier' &&
      ['sort', 'filter', 'reduce'].includes(callee.property.name)
    ) {
      return true;
    }

    if (
      callee.type === 'Identifier' &&
      /^(fetch|sync|load|calculate|compute|process|hydrate)[A-Z_]/.test(callee.name)
    ) {
      return true;
    }
  }

  return false;
}

function containsNode(root: TSESTree.Node, predicate: (node: TSESTree.Node) => boolean): boolean {
  const queue: TSESTree.Node[] = [root];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (predicate(current)) {
      return true;
    }

    for (const key of Object.keys(current)) {
      if (key === 'parent') continue;
      const value = (current as any)[key];
      if (Array.isArray(value)) {
        for (const child of value) {
          if (child && typeof child.type === 'string') {
            queue.push(child);
          }
        }
      } else if (value && typeof value.type === 'string') {
        queue.push(value);
      }
    }
  }

  return false;
}

function getFocusCallback(node: TSESTree.CallExpression): TSESTree.Node | null {
  const callee = node.callee;

  if (callee.type === 'Identifier' && callee.name === 'useFocusEffect') {
    return node.arguments[0] ?? null;
  }

  if (
    callee.type === 'MemberExpression' &&
    callee.property.type === 'Identifier' &&
    callee.property.name === 'addListener' &&
    node.arguments[0]?.type === 'Literal' &&
    node.arguments[0].value === 'focus'
  ) {
    return node.arguments[1] ?? null;
  }

  return null;
}

export const preferInteractionManagerForNoncriticalWorkRule = createRule({
  name: 'prefer-interaction-manager-for-noncritical-work',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Defer expensive non-critical focus work with InteractionManager.runAfterInteractions.',
    },
    schema: [],
    messages: {
      preferInteractionManager: 'Expensive focus work can block navigation animations. Wrap non-critical work in InteractionManager.runAfterInteractions.',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        const callback = getFocusCallback(node);
        if (!callback) {
          return;
        }

        if (containsNode(callback, isInteractionManagerCall)) {
          return;
        }

        if (containsNode(callback, isHeavyFocusWork)) {
          context.report({
            node: callback,
            messageId: 'preferInteractionManager',
          });
        }
      },
    };
  },
});
