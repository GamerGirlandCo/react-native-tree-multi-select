import { TreeNode } from "src/types/treeView.types";

export const testStoreId = 'test-store-id';

export const testIndexMapper = <ID = string>(arg: Omit<TreeNode<ID>, 'index'>, index: number): TreeNode<ID> => {
  return ({...arg, index: index + 1, children: arg.children?.map(testIndexMapper)}) as TreeNode<ID>
}
