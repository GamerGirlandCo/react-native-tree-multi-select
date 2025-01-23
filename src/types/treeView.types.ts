import type {
    StyleProp,
    TextProps,
    TouchableOpacityProps,
    ViewStyle
} from "react-native";
import type { FlashListProps, ListRenderItemInfo } from "@shopify/flash-list";
import {
    type Props as RNPaperCheckboxAndroidProps
} from 'react-native-paper/src/components/Checkbox/CheckboxAndroid';
import { PanGestureHandlerProperties } from "react-native-gesture-handler";
import { StyleProps, WithSpringConfig } from "react-native-reanimated";

export type CheckboxValueType = boolean | 'indeterminate';

export interface ExpandIconProps {
    isExpanded: boolean;
}

export interface TreeNode<ID = string> {
    id: ID;
    name: string;
    children?: TreeNode<ID>[];
    index: number;
    [key: string]: any;
}

export interface __FlattenedTreeNode__<ID = string> extends TreeNode<ID> {
    level?: number;
}

// Remove non-modifiable keys
export type TreeFlatListProps<ItemT = any> = Omit<
    FlashListProps<ItemT>,
    "data"
    | "renderItem"
    | "horizontal"
>;

export interface NodeRowProps<ID = string> {
    node: TreeNode<ID>;
    level: number;

    checkedValue: CheckboxValueType;
    isExpanded: boolean;

    onCheck: () => void;
    onExpand: () => void;

}

export interface TreeItemCustomizations<ID> {
    checkBoxViewStyleProps?: BuiltInCheckBoxViewStyleProps;

    indentationMultiplier?: number;

    CheckboxComponent?: React.ComponentType<CheckBoxViewProps>;
    ExpandCollapseIconComponent?: React.ComponentType<ExpandIconProps>;
    ExpandCollapseTouchableComponent?: React.ComponentType<TouchableOpacityProps>;

    CustomNodeRowComponent?: React.ComponentType<NodeRowProps<ID>>;
}

export interface NodeProps<ID> extends TreeItemCustomizations<ID> {
    node: __FlattenedTreeNode__<ID>;
    level: number;
    storeId: string;

    index: number;
    onDragStart: (id: ID, index: number, level: number) => void;
}

export type SortableProps<ID> =  {
  canSort?: boolean;
    onSort?: (oldIndex: number, newIndex: number, newData: TreeNode<ID>[]) => void;
  placeholderStyle?: StyleProps
}

export type SortableCustomization = {
  autoScrollThreshold: number;
  autoScrollSpeed: number;
  animationConfig: WithSpringConfig;
  scrollEnabled: boolean;
  dragHitSlop: PanGestureHandlerProperties['hitSlop'];
  activationDistance: number;
  dragItemOverflow: boolean;
};

export interface NodeListProps<ID> extends TreeItemCustomizations<ID>, SortableProps<ID> {
    treeFlashListProps?: TreeFlatListProps;
    storeId: string;
    draggableProps?: SortableCustomization
}

export interface TreeViewProps<ID = string> extends Omit<NodeListProps<ID>, "storeId"> {
    data: TreeNode<ID>[];

    onCheck?: (checkedIds: ID[], indeterminateIds: ID[]) => void;
    onExpand?: (expandedIds: ID[]) => void;

    preselectedIds?: ID[];

    preExpandedIds?: ID[];

    selectionPropagation?: SelectionPropagation;
    draggableProps?: SortableCustomization
}

type CheckboxProps = Omit<RNPaperCheckboxAndroidProps, "onPress" | "status">;

export interface CheckBoxViewProps {
    value: CheckboxValueType;
    onValueChange: (value: boolean) => void;
    text: string;
}

export interface BuiltInCheckBoxViewStyleProps {
    // Optional style modifiers
    outermostParentViewStyle?: StyleProp<ViewStyle>;
    checkboxParentViewStyle?: StyleProp<ViewStyle>;
    textTouchableStyle?: StyleProp<ViewStyle>;

    // Optional checkbox and text component props
    checkboxProps?: CheckboxProps;
    textProps?: TextProps;
}

export type BuiltInCheckBoxViewProps =
    CheckBoxViewProps
    & BuiltInCheckBoxViewStyleProps;

export interface TreeViewRef<ID = string> {
    selectAll: () => void;
    unselectAll: () => void;

    selectAllFiltered: () => void;
    unselectAllFiltered: () => void;

    expandAll: () => void;
    collapseAll: () => void;

    expandNodes: (ids: ID[]) => void;
    collapseNodes: (ids: ID[]) => void;

    selectNodes: (ids: ID[]) => void;
    unselectNodes: (ids: ID[]) => void;

    setSearchText: (searchText: string, searchKeys?: string[]) => void;
}


export interface SelectionPropagation {
    toChildren?: boolean;
    toParents?: boolean;
}

export type PartialListRenderItem<TItem> = (
  info: Omit<Partial<ListRenderItemInfo<TItem>>, 'item' | 'index'> & {item: ListRenderItemInfo<TItem>['item']; index: number}
) => React.ReactElement | null;

