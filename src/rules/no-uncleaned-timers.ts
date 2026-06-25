import { createRule } from '../utils';
import { TSESTree } from '@typescript-eslint/utils';

export const noUncleanedTimersRule = createRule({
  name: 'no-uncleaned-timers',
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensure timers (setInterval, setTimeout) are cleaned up to prevent background CPU usage.',
    },
    schema: [],
    messages: {
      mustBeInEffect: 'Timers should be registered inside useEffect or useFocusEffect to avoid duplicate registrations and memory leaks.',
      mustAssignToVariable: 'The timer is not assigned to a variable or ref, making it impossible to clear. Assign it to a variable (e.g., const timer = ...) and clear it in the cleanup function.',
      noCleanupFunction: 'No cleanup function is returned from the effect. Return a function that clears your timer.',
      invalidCleanupValue: 'The effect must return a cleanup function (e.g., return () => { ... }), not a timer ID or other value.',
      notCleanedUp: 'The timer is not cleared. Call `{{clearFn}}({{name}})` inside the returned cleanup function.',
    },
  },
  defaultOptions: [],
  create(context) {
    const timerMethods = new Set(['setInterval', 'setTimeout']);

    return {
      CallExpression(node) {
        const callee = node.callee;
        let isTimerCall = false;
        let timerMethod = '';

        if (callee.type === 'Identifier' && timerMethods.has(callee.name)) {
          isTimerCall = true;
          timerMethod = callee.name;
        } else if (
          callee.type === 'MemberExpression' &&
          callee.object.type === 'Identifier' &&
          callee.object.name === 'window' &&
          callee.property.type === 'Identifier' &&
          timerMethods.has(callee.property.name)
        ) {
          isTimerCall = true;
          timerMethod = callee.property.name;
        }

        if (!isTimerCall) {
          return;
        }

        const clearMethod = timerMethod === 'setInterval' ? 'clearInterval' : 'clearTimeout';

        // 1. Check if inside useEffect or useFocusEffect
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

        // 2. Check if assigned to a variable or ref
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

        // 3. Inspect effect callback for a cleanup function
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
            // Implicit return of timer
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

        // Search for clearInterval/clearTimeout call on this variable
        let isCleanedUp = false;

        const checkCleanupCall = (cleanupNode: TSESTree.Node) => {
          const queue: TSESTree.Node[] = [cleanupNode];
          while (queue.length > 0) {
            const current = queue.shift()!;
            if (current.type === 'CallExpression') {
              const cleanCallee = current.callee;
              if (
                cleanCallee.type === 'Identifier' &&
                (cleanCallee.name === 'clearInterval' || cleanCallee.name === 'clearTimeout')
              ) {
                const arg = current.arguments[0];
                if (arg) {
                  const argText = sourceCode.getText(arg);
                  if (argText === varName || argText === varName.replace('?.', '.')) {
                    isCleanedUp = true;
                    break;
                  }
                }
              } else if (
                cleanCallee.type === 'MemberExpression' &&
                cleanCallee.object.type === 'Identifier' &&
                cleanCallee.object.name === 'window' &&
                cleanCallee.property.type === 'Identifier' &&
                (cleanCallee.property.name === 'clearInterval' || cleanCallee.property.name === 'clearTimeout')
              ) {
                const arg = current.arguments[0];
                if (arg) {
                  const argText = sourceCode.getText(arg);
                  if (argText === varName || argText === varName.replace('?.', '.')) {
                    isCleanedUp = true;
                    break;
                  }
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
            return;
          }

          if (effectCallback.type === 'ArrowFunctionExpression' || effectCallback.type === 'FunctionExpression') {
            const body = effectCallback.body;
            if (body.type === 'BlockStatement') {
              const cleanupDefinition = body.body.find((stmt) => {
                if (stmt.type === 'FunctionDeclaration' && stmt.id?.name === returnArg.name) {
                  return true;
                }

                return (
                  stmt.type === 'VariableDeclaration' &&
                  stmt.declarations.some(
                    (declaration) =>
                      declaration.id.type === 'Identifier' &&
                      declaration.id.name === returnArg.name &&
                      (declaration.init?.type === 'ArrowFunctionExpression' ||
                        declaration.init?.type === 'FunctionExpression')
                  )
                );
              });

              if (cleanupDefinition?.type === 'FunctionDeclaration') {
                checkCleanupCall(cleanupDefinition);
              } else if (cleanupDefinition?.type === 'VariableDeclaration') {
                const declaration = cleanupDefinition.declarations.find(
                  (item) =>
                    item.id.type === 'Identifier' &&
                    item.id.name === returnArg.name &&
                    (item.init?.type === 'ArrowFunctionExpression' ||
                      item.init?.type === 'FunctionExpression')
                );

                if (declaration?.init) {
                  checkCleanupCall(declaration.init);
                }
              }
            }
          }
        } else {
          checkCleanupCall(returnArg);
        }

        if (!isCleanedUp) {
          context.report({
            node: returnStmt,
            messageId: 'notCleanedUp',
            data: {
              clearFn: clearMethod,
              name: varName,
            },
          });
        }
      },
    };
  },
});
