import { ESLintUtils } from '@typescript-eslint/utils';
import { TSESTree } from '@typescript-eslint/utils';

export const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/tylormayfield/eslint-plugin-expo-performance/blob/main/docs/rules/${name}.md`
);

export function getJSXElementName(node: TSESTree.JSXTagNameExpression): string {
  if (node.type === 'JSXIdentifier') {
    return node.name;
  }

  if (node.type === 'JSXMemberExpression') {
    return `${getJSXElementName(node.object)}.${node.property.name}`;
  }

  return '';
}

export function isReactComponentName(name: string): boolean {
  return /^[A-Z]/.test(name);
}

export function isInsideHookCallback(node: TSESTree.Node, hookNames: Set<string>): boolean {
  let parent = node.parent;

  while (parent) {
    if (
      (parent.type === 'ArrowFunctionExpression' || parent.type === 'FunctionExpression') &&
      parent.parent?.type === 'CallExpression'
    ) {
      const callee = parent.parent.callee;

      if (
        callee.type === 'Identifier' &&
        hookNames.has(callee.name) &&
        parent.parent.arguments[0] === parent
      ) {
        return true;
      }

      if (
        callee.type === 'MemberExpression' &&
        callee.object.type === 'Identifier' &&
        callee.object.name === 'React' &&
        callee.property.type === 'Identifier' &&
        hookNames.has(callee.property.name) &&
        parent.parent.arguments[0] === parent
      ) {
        return true;
      }
    }

    parent = parent.parent;
  }

  return false;
}

export function isInsideReactComponentRender(node: TSESTree.Node): boolean {
  let parent = node.parent;

  while (parent) {
    if (
      parent.type === 'FunctionDeclaration' ||
      parent.type === 'FunctionExpression' ||
      parent.type === 'ArrowFunctionExpression'
    ) {
      let fnName = '';

      if (parent.type === 'FunctionDeclaration' && parent.id) {
        fnName = parent.id.name;
      } else if (
        parent.parent?.type === 'VariableDeclarator' &&
        parent.parent.id.type === 'Identifier'
      ) {
        fnName = parent.parent.id.name;
      }

      if (fnName) {
        if (fnName.startsWith('handle') || fnName.startsWith('on')) {
          return false;
        }

        return isReactComponentName(fnName);
      }
    }

    parent = parent.parent;
  }

  return false;
}
