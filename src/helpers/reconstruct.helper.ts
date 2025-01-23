import { __FlattenedTreeNode__, TreeNode } from '../types/treeView.types';

const flattenedNodeMapper =
  <ID>(
    childParentMap: Map<ID, ID>,
    nodeMap: Map<ID, TreeNode<ID>>,
    parentChildMap: Map<ID | null, [ID, number][]>
  ) =>
  (node: __FlattenedTreeNode__<ID>, idx: number): TreeNode<ID> => {
    // console.log(nodeId, nidx, allNodes[nidx])
    const childNodes = parentChildMap
      .get(node.id)?.sort(([, a], [, b]) => a - b)
      .map(([id]) => nodeMap.get(id)!) ?? [];
    const tn: TreeNode<ID> = {
      id: node.id,
      name: node.name,
      index: idx + 1,
      children: childNodes
        .map(flattenedNodeMapper(childParentMap, nodeMap, parentChildMap))
        .sort((a, b) => a.index - b.index),
    };
    nodeMap.set(node.id, tn);
    if(typeof tn.id === "string" && tn.id.startsWith('12.') && tn.id.length === 4)
      console.log(tn)
    return tn;
  };

function removeLevelField<ID>(n: __FlattenedTreeNode__<ID>): TreeNode<ID> {
  const fieldsWithoutLevel = Object.keys(n).filter((x) => x !== "level");
  return fieldsWithoutLevel.reduce((pv, cv) => ({...pv, [cv]: n[cv]}), {}) as TreeNode<ID>
}

export function reconstructFlattenedTree<ID>(
  nodes: __FlattenedTreeNode__<ID>[],
  childToParentMap: Map<ID, ID>,
  nodeMap: Map<ID, TreeNode<ID>>
): [TreeNode<ID>[], Map<ID, TreeNode<ID>>] {
  const parentToChildMap = new Map<ID | null, [ID, number][]>();
  for (const [child, parent] of childToParentMap.entries()) {
    if (parentToChildMap.has(parent))
      parentToChildMap.set(parent, [
        ...parentToChildMap.get(parent)!,
        [child, nodeMap.get(child)!.index],
      ]);
    else parentToChildMap.set(parent, [[child, nodeMap.get(child)!.index]]);
  }
  const unflattened = nodes
    .filter((a) => !childToParentMap.has(a.id))
    .map(removeLevelField)
    .map(flattenedNodeMapper(childToParentMap, nodeMap, parentToChildMap))
    .sort((a, b) => a.index - b.index);
  return [unflattened, nodeMap];
}
