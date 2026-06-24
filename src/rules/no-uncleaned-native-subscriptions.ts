import { createRule } from '../utils';
import { TSESTree } from '@typescript-eslint/utils';

export const noUncleanedNativeSubscriptionsRule = createRule({
  name: 'no-uncleaned-native-subscriptions',
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensure hardware sensor and event subscriptions are cleaned up to prevent high battery usage.',
    },
    schema: [],
    messages: {
      mustBeInEffect: 'Subscriptions for native events or sensors must be registered inside useEffect or useFocusEffect to avoid duplicate registrations and memory leaks.',
      mustAssignToVariable: 'The subscription is not assigned to a variable or ref, making it impossible to clean up. Assign it to a variable (e.g. const sub = ...) and call sub.remove() in the cleanup function.',
      noCleanupFunction: 'No cleanup function is returned from the effect. Return a function that calls `.remove()` on your subscription.',
      invalidCleanupValue: 'The effect must return a cleanup function (e.g. return () => { ... }), not a Subscription object or other value.',
      notCleanedUp: 'The subscription is not cleaned up. Call `{{name}}.remove()` inside the returned cleanup function.',
    },
  },
  defaultOptions: [],
  create(context) {
    const subscriptionAPIs = new Map([
      ['Accelerometer', new Set(['addListener'])],
      ['Barometer', new Set(['addListener'])],
      ['Gyroscope', new Set(['addListener'])],
      ['Magnetometer', new Set(['addListener'])],
      ['Pedometer', new Set(['watchStepCount'])],
      ['Location', new Set(['watchPositionAsync', 'watchHeadingAsync'])],
      ['DeviceEventEmitter', new Set(['addListener'])],
      ['AppState', new Set(['addEventListener'])],
    ]);

    return {
      CallExpression(node) {
        const callee = node.callee;
        let isSubscriptionCall = false;
        let objName = '';
        let methodName = '';

        if (callee.type === 'MemberExpression') {
          if (callee.object.type === 'Identifier' && callee.property.type === 'Identifier') {
            objName = callee.object.name;
            methodName = callee.property.name;
            const methods = subscriptionAPIs.get(objName);
            if (methods && methods.has(methodName)) {
              isSubscriptionCall = true;
            }
          }
        }

        if (!isSubscriptionCall) {
          return;
        }

        // 1. Check if we are inside a useEffect / useFocusEffect
        let parent: TSESTree.Node | undefined = node.parent;
        let insideEffect = false;
        let effectCallback: TSESTree.Node | null = null;

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
            insideEffect = true;
            effectCallback = parent.arguments[0] || null;
            break;
          }
          parent = parent.parent;
        }

        if (!insideEffect || !effectCallback) {
          context.report({
            node,
            messageId: 'mustBeInEffect',
          });
          return;
        }

        // 2. Check if the subscription is assigned to a variable or property
        let varNode: TSESTree.Identifier | TSESTree.MemberExpression | null = null;
        let p = node.parent;
        if (p && p.type === 'VariableDeclarator' && p.id.type === 'Identifier') {
          varNode = p.id;
        } else if (p && p.type === 'AssignmentExpression' && p.operator === '=') {
          if (p.left.type === 'Identifier' || p.left.type === 'MemberExpression') {
            varNode = p.left as TSESTree.Identifier | TSESTree.MemberExpression;
          }
        }

        if (!varNode) {
          context.report({
            node,
            messageId: 'mustAssignToVariable',
          });
          return;
        }

        const sourceCode = context.sourceCode;
        const varName = sourceCode.getText(varNode);

        // 3. Inspect the effect callback for a cleanup function
        let returnStmt: TSESTree.ReturnStatement | null = null;

        if (
          effectCallback.type === 'ArrowFunctionExpression' ||
          effectCallback.type === 'FunctionExpression'
        ) {
          const body = effectCallback.body;
          if (body.type === 'BlockStatement') {
            for (const stmt of body.body) {
              if (stmt.type === 'ReturnStatement') {
                returnStmt = stmt;
                break;
              }
            }
          } else {
            // Implicit return (e.g. useEffect(() => Accelerometer.addListener(...), []))
            context.report({
              node: effectCallback,
              messageId: 'invalidCleanupValue',
            });
            return;
          }
        }

        if (!returnStmt) {
          context.report({
            node,
            messageId: 'noCleanupFunction',
          });
          return;
        }

        const returnArg = returnStmt.argument;
        if (!returnArg) {
          context.report({
            node: returnStmt,
            messageId: 'noCleanupFunction',
          });
          return;
        }

        // The returned value must be a function expression or arrow function
        if (
          returnArg.type !== 'ArrowFunctionExpression' &&
          returnArg.type !== 'FunctionExpression' &&
          returnArg.type !== 'Identifier'
        ) {
          context.report({
            node: returnArg,
            messageId: 'invalidCleanupValue',
          });
          return;
        }

        // If it returns a function expression, let's search for `.remove()` call inside it.
        let isCleanedUp = false;

        const checkCleanupCall = (cleanupNode: TSESTree.Node) => {
          const queue: TSESTree.Node[] = [cleanupNode];
          while (queue.length > 0) {
            const current = queue.shift()!;
            if (current.type === 'CallExpression') {
              const cleanCallee = current.callee;
              if (
                cleanCallee.type === 'MemberExpression' &&
                cleanCallee.property.type === 'Identifier' &&
                cleanCallee.property.name === 'remove'
              ) {
                const objText = sourceCode.getText(cleanCallee.object);
                if (objText === varName || objText === varName.replace('?.', '.')) {
                  isCleanedUp = true;
                  break;
                }
              }
            }
            for (const key of Object.keys(current)) {
              if (key === 'parent') continue;
              const val = (current as any)[key];
              if (val && typeof val === 'object') {
                if (Array.isArray(val)) {
                  for (const child of val) {
                    if (child && typeof child.type === 'string') {
                      queue.push(child);
                    }
                  }
                } else if (typeof val.type === 'string') {
                  queue.push(val);
                }
              }
            }
          }
        };

        if (returnArg.type === 'Identifier') {
          if (returnArg.name === varName) {
            context.report({
              node: returnArg,
              messageId: 'invalidCleanupValue',
            });
          }
          return;
        } else {
          checkCleanupCall(returnArg);
        }

        if (!isCleanedUp) {
          context.report({
            node: returnStmt,
            messageId: 'notCleanedUp',
            data: {
              name: varName,
            },
          });
        }
      },
    };
  },
});
