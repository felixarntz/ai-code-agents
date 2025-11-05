interface TreeNode {
  [key: string]: TreeNode;
}

/**
 * Renders the tree structure as a string.
 *
 * @param node - The current tree node to render.
 * @param prefix - The prefix string for indentation.
 * @returns The rendered tree string.
 */
function renderTree(node: TreeNode, prefix = ''): string {
  const entries = Object.keys(node).sort();
  let result = '';

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const isLast = i === entries.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const nextPrefix = prefix + (isLast ? '    ' : '│   ');

    result += prefix + connector + '**' + entry + '**' + '\n';

    if (Object.keys(node[entry]).length > 0) {
      result += renderTree(node[entry], nextPrefix);
    }
  }

  return result;
}

/**
 * Builds a tree-like string representation from a list of file paths.
 *
 * @param files - Array of file paths relative to the root.
 * @returns A string representing the file structure as a tree.
 */
export function buildTreeFromFiles(files: string[]): string {
  if (files.length === 0) {
    return '';
  }

  // Sort files to ensure consistent ordering
  const sortedFiles = [...files].sort();

  // Build a tree structure
  const tree: TreeNode = {};

  for (const file of sortedFiles) {
    const parts = file.split('/');
    let current = tree;
    for (const part of parts) {
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
  }

  return renderTree(tree).trim();
}
