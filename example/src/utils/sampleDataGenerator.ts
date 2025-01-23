export interface TreeNode<ID> {
    id: ID;
    name: string;
    index: number;
    children?: TreeNode<ID>[];
}

// This function generates a TreeNode with a random number of children.
function generateNode<ID = string>(id: ID, idx: number, level: number, maxLevel: number, maxChildren: number, nextID: (prev: ID, idx: number, parent?: ID) => ID, parentID?: ID): TreeNode<ID> {
    let nid = nextID(id, idx, parentID);
    const node: TreeNode<ID> = {
        id: nid,
        name: `Node ${nid}`,
        index: idx
    };

    if (level < maxLevel) {
        const numChildren = Math.floor(Math.random() * maxChildren) + 1; // generates a random number between 1 and maxChildren
        node.children = [];
        for (let i = 1; i <= numChildren; i++) {
            node.children.push(generateNode(nid, i, level + 1, maxLevel, maxChildren, nextID, node.id));
            nid = nextID(nid, idx, node.id);
        }
    }

    return node as TreeNode<ID>;
}

// This function generates a list of TreeNodes
export function generateTreeList<ID = string>(num: number, maxLevel: number, maxChildren: number, nextID: (prev: ID, idx: number) => ID, initialValue: ID): TreeNode<ID>[] {
    let result: TreeNode<ID>[] = [];
    let curID = initialValue;
    for (let i = 1; i <= num; i++) {
      result.push(generateNode(curID, i, 1, maxLevel, maxChildren, nextID));
      curID = nextID(curID, i);
    }
    return result;
}

export const defaultID = (_prev: string, idx: number, parentID?: string) => `${parentID ? parentID + '.' : ''}${idx}`
