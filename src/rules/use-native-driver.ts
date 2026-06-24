import { createRule } from '../utils';
import { TSESTree } from '@typescript-eslint/utils';

export const useNativeDriverRule = createRule({
  name: 'use-native-driver',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce using useNativeDriver: true in Animated animations for better performance.',
    },
    fixable: 'code',
    schema: [],
    messages: {
      missingUseNativeDriver: 'Animated animations should use the native driver (useNativeDriver: true) to offload animation execution to the native thread and improve performance.',
      nativeDriverFalse: 'useNativeDriver is explicitly set to false, which runs the animation on the JS thread. Set useNativeDriver to true to avoid frame drops and high CPU usage.',
    },
  },
  defaultOptions: [],
  create(context) {
    const animationMethods = new Set(['timing', 'spring', 'decay']);

    return {
      CallExpression(node) {
        const callee = node.callee;
        if (
          callee.type === 'MemberExpression' &&
          callee.object.type === 'Identifier' &&
          callee.object.name === 'Animated' &&
          callee.property.type === 'Identifier' &&
          animationMethods.has(callee.property.name)
        ) {
          const configArg = node.arguments[1];
          if (!configArg) {
            return;
          }

          if (configArg.type === 'ObjectExpression') {
            const useNativeDriverProp = configArg.properties.find(
              (prop): prop is TSESTree.Property =>
                prop.type === 'Property' &&
                prop.key.type === 'Identifier' &&
                prop.key.name === 'useNativeDriver'
            );

            if (!useNativeDriverProp) {
              context.report({
                node: configArg,
                messageId: 'missingUseNativeDriver',
                fix(fixer) {
                  const lastProp = configArg.properties[configArg.properties.length - 1];
                  if (lastProp) {
                    return fixer.insertTextAfter(lastProp, ', useNativeDriver: true');
                  } else {
                    return fixer.replaceText(configArg, '{ useNativeDriver: true }');
                  }
                },
              });
            } else if (
              useNativeDriverProp.value.type === 'Literal' &&
              useNativeDriverProp.value.value === false
            ) {
              context.report({
                node: useNativeDriverProp.value,
                messageId: 'nativeDriverFalse',
                fix(fixer) {
                  return fixer.replaceText(useNativeDriverProp.value, 'true');
                },
              });
            }
          }
        }
      },
    };
  },
});
