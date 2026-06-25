import { createRule } from '../utils';
import { TSESTree } from '@typescript-eslint/utils';

const locationWatchMethods = new Set(['watchPositionAsync', 'watchHeadingAsync']);

function getLocationWatchMethod(node: TSESTree.CallExpression): string | null {
  const callee = node.callee;
  if (
    callee.type === 'MemberExpression' &&
    callee.object.type === 'Identifier' &&
    callee.object.name === 'Location' &&
    callee.property.type === 'Identifier' &&
    locationWatchMethods.has(callee.property.name)
  ) {
    return callee.property.name;
  }

  return null;
}

function getEffectCallback(node: TSESTree.Node): TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression | null {
  let parent = node.parent;

  while (parent) {
    if (
      parent.type === 'CallExpression' &&
      (
        (parent.callee.type === 'Identifier' && (parent.callee.name === 'useEffect' || parent.callee.name === 'useFocusEffect')) ||
        (parent.callee.type === 'MemberExpression' &&
          parent.callee.object.type === 'Identifier' &&
          parent.callee.object.name === 'React' &&
          parent.callee.property.type === 'Identifier' &&
          parent.callee.property.name === 'useEffect')
      )
    ) {
      const callback = parent.arguments[0];
      if (callback?.type === 'ArrowFunctionExpression' || callback?.type === 'FunctionExpression') {
        return callback;
      }
      if (
        callback?.type === 'CallExpression' &&
        callback.callee.type === 'Identifier' &&
        callback.callee.name === 'useCallback'
      ) {
        const wrappedCallback = callback.arguments[0];
        if (
          wrappedCallback?.type === 'ArrowFunctionExpression' ||
          wrappedCallback?.type === 'FunctionExpression'
        ) {
          return wrappedCallback;
        }
      }
      return null;
    }

    parent = parent.parent;
  }

  return null;
}

function findCleanupReturn(
  callback: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression
): TSESTree.ReturnStatement | null {
  if (callback.body.type !== 'BlockStatement') {
    return null;
  }

  return callback.body.body.find((statement): statement is TSESTree.ReturnStatement => statement.type === 'ReturnStatement') ?? null;
}

function getAwaitedVariable(node: TSESTree.CallExpression): { name: string | null; awaited: boolean } {
  let parent: TSESTree.Node | undefined = node.parent;
  let awaited = false;

  if (parent?.type === 'AwaitExpression') {
    awaited = true;
    parent = parent.parent;
  }

  if (parent?.type === 'VariableDeclarator' && parent.id.type === 'Identifier') {
    return { name: parent.id.name, awaited };
  }

  if (parent?.type === 'AssignmentExpression' && parent.operator === '=') {
    return { name: parent.left.type === 'Identifier' ? parent.left.name : null, awaited };
  }

  return { name: null, awaited };
}

function getThenAssignedVariable(node: TSESTree.CallExpression): string | null {
  const parent = node.parent;
  if (
    parent?.type !== 'MemberExpression' ||
    parent.property.type !== 'Identifier' ||
    parent.property.name !== 'then' ||
    parent.parent?.type !== 'CallExpression'
  ) {
    return null;
  }

  const callback = parent.parent.arguments[0];
  if (
    callback?.type !== 'ArrowFunctionExpression' &&
    callback?.type !== 'FunctionExpression'
  ) {
    return null;
  }

  const queue: TSESTree.Node[] = [callback.body];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (
      current.type === 'AssignmentExpression' &&
      current.operator === '=' &&
      current.left.type === 'Identifier'
    ) {
      return current.left.name;
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

  return null;
}

function cleanupRemovesVariable(
  cleanup: TSESTree.Node,
  variableName: string,
  sourceCode: { getText(node: TSESTree.Node): string }
): boolean {
  const queue: TSESTree.Node[] = [cleanup];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (
      current.type === 'CallExpression' &&
      current.callee.type === 'MemberExpression' &&
      current.callee.property.type === 'Identifier' &&
      current.callee.property.name === 'remove'
    ) {
      const objectText = sourceCode.getText(current.callee.object);
      if (objectText === variableName || objectText === `${variableName}?`) {
        return true;
      }
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

export const requireLocationWatchCleanupRule = createRule({
  name: 'require-location-watch-cleanup',
  meta: {
    type: 'problem',
    docs: {
      description: 'Require Expo Location watchers to be awaited or captured and removed during hook cleanup.',
    },
    schema: [],
    messages: {
      mustBeInEffect: 'Location watchers should be registered inside useEffect or useFocusEffect so they can be cleaned up on unmount or blur.',
      mustCaptureSubscription: 'Capture the Location watcher subscription from the resolved promise so cleanup can call `.remove()`.',
      mustAwaitOrThen: 'Location watcher subscriptions are async. Await the watcher or assign the resolved subscription in `.then()` before removing it.',
      noCleanupFunction: 'Return a cleanup function that removes the Location watcher subscription.',
      notCleanedUp: 'The Location watcher subscription is not removed. Call `{{name}}?.remove()` in the returned cleanup function.',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        const methodName = getLocationWatchMethod(node);
        if (!methodName) {
          return;
        }

        const effectCallback = getEffectCallback(node);
        if (!effectCallback) {
          context.report({ node, messageId: 'mustBeInEffect' });
          return;
        }

        const awaitedVariable = getAwaitedVariable(node);
        const thenVariable = getThenAssignedVariable(node);
        const subscriptionName = thenVariable ?? awaitedVariable.name;

        if (!subscriptionName) {
          context.report({ node, messageId: 'mustCaptureSubscription' });
          return;
        }

        if (!thenVariable && !awaitedVariable.awaited) {
          context.report({ node, messageId: 'mustAwaitOrThen' });
          return;
        }

        const cleanupReturn = findCleanupReturn(effectCallback);
        if (!cleanupReturn?.argument) {
          context.report({ node, messageId: 'noCleanupFunction' });
          return;
        }

        if (
          cleanupReturn.argument.type !== 'ArrowFunctionExpression' &&
          cleanupReturn.argument.type !== 'FunctionExpression'
        ) {
          context.report({ node: cleanupReturn.argument, messageId: 'noCleanupFunction' });
          return;
        }

        if (!cleanupRemovesVariable(cleanupReturn.argument, subscriptionName, context.sourceCode)) {
          context.report({
            node: cleanupReturn,
            messageId: 'notCleanedUp',
            data: { name: subscriptionName },
          });
        }
      },
    };
  },
});
