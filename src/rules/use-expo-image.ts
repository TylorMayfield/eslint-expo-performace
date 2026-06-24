import { createRule } from '../utils';
import { TSESTree } from '@typescript-eslint/utils';

export const useExpoImageRule = createRule({
  name: 'use-expo-image',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce using Image from expo-image instead of react-native for better caching and performance.',
    },
    fixable: 'code',
    schema: [],
    messages: {
      useExpoImage: 'Use Image from "expo-image" instead of "react-native" or raw <img> tags to optimize performance and battery consumption.',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      ImportDeclaration(node) {
        if (node.source.value === 'react-native') {
          const imageSpecifier = node.specifiers.find(
            (specifier): specifier is TSESTree.ImportSpecifier =>
              specifier.type === 'ImportSpecifier' &&
              specifier.imported.type === 'Identifier' &&
              specifier.imported.name === 'Image'
          );

          if (imageSpecifier) {
            context.report({
              node: imageSpecifier,
              messageId: 'useExpoImage',
              fix(fixer) {
                // If 'Image' is the only imported specifier, we can just replace 'react-native' with 'expo-image'
                if (node.specifiers.length === 1) {
                  return fixer.replaceText(node.source, "'expo-image'");
                }

                const sourceCode = context.sourceCode;
                const otherSpecifiers = node.specifiers.filter(spec => spec !== imageSpecifier);
                
                // Reconstruct the react-native import without Image
                const specifiersText = otherSpecifiers
                  .map(spec => sourceCode.getText(spec))
                  .join(', ');
                
                const newRNImport = `import { ${specifiersText} } from 'react-native';`;
                const newExpoImport = `import { Image } from 'expo-image';`;
                
                return fixer.replaceText(node, `${newRNImport}\n${newExpoImport}`);
              },
            });
          }
        }
      },
      JSXOpeningElement(node) {
        if (
          node.name.type === 'JSXIdentifier' &&
          node.name.name === 'img'
        ) {
          context.report({
            node: node.name,
            messageId: 'useExpoImage',
          });
        }
      },
    };
  },
});
