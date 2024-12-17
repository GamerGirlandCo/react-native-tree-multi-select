import { TreeNode, __FlattenedTreeNode__ } from "../types/treeView.types";

/**
 * Flatten the tree and attach a "level" key to object to indicate it's depth. This 
 * returns the flattened tree data of expanded ids only. We do not prune the tree off the
 * children after the flattening as it would be unnecessary computation.
 *
 * @param nodes - Input recursive tree
 * @param expandedIds - ids of currently expanded nodes
 * @param __level__ - (optional) for internal recursive use only
 * @returns Flattened tree data with expanded ids only
 */
export function getFlattenedTreeData(
    nodes: TreeNode[],
    expandedIds: Set<string>,
): __FlattenedTreeNode__[] {
    const flattened: __FlattenedTreeNode__[] = [];
    const stack: { node: TreeNode; level: number; }[] = [];

    // Initialize stack with the root nodes and level 0
    for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        if (node) { // Ensure node is not undefined
            stack.push({ node, level: 0 });
        }
    }

    while (stack.length > 0) {
        const item = stack.pop();
        if (!item) continue; // Safety check

        const { node, level } = item;

        // Push current node into the flattened array
        flattened.push({ ...node, level });

        // Add children nodes to the stack if the node is expanded
        if (node.children && expandedIds.has(node.id)) {
            for (let i = node.children.length - 1; i >= 0; i--) {
                const childNode = node.children[i];
                if (childNode) { // Ensure childNode is not undefined
                    stack.push({ node: childNode, level: level + 1 });
                }
            }
        }
    }

    return flattened;
}
