import React from 'react';
import {
  SafeAreaView,
  View,
  Button,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import { TreeViewRef, TreeView } from 'react-native-tree-multi-select';
import {
  defaultID,
  generateTreeList,
  TreeNode,
} from '../utils/sampleDataGenerator';
import { styles as screenStyles } from './screens.styles';
import { styles as nodeRowStyles } from '../components/CustomNodeRowView';
import SearchInput from '../components/SearchInput';
import { debounce } from 'lodash';
import {
  NodeRowProps,
  SortableCustomization,
} from '../../../src/types/treeView.types';
import { DEFAULT_SORTABLE_PROPS } from '../../../src/constants/treeView.constants';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { typedMemo } from '../../../src/utils/typedMemo';
import { Checkbox } from 'react-native-paper';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

const prefixMap = (n: TreeNode<string>): TreeNode<string> => {
  return { ...n, name: `Task ${n.id}`, children: n.children?.map(prefixMap) };
};

export default function DraggableScreen() {
  const sampleData = React.useRef(
    generateTreeList(50, 5, 5, defaultID, '1').map(prefixMap)
  );
  const treeViewRef = React.useRef<TreeViewRef | null>(null);
  const handleSelectionChange = (
    _checkedIds: string[],
    _indeterminateIds: string[]
  ) => {
    // NOTE: Handle _checkedIds and _indeterminateIds here
  };
  const handleExpanded = (_expandedIds: string[]) => {
    // NOTE: Handle _expandedIds here
  };

  // Expand collapse calls using ref
  const expandAllPress = () => treeViewRef.current?.expandAll?.();
  const collapseAllPress = () => treeViewRef.current?.collapseAll?.();

  // Multi-select calls using ref
  const onSelectAllPress = () => treeViewRef.current?.selectAll?.();
  const onUnselectAllPress = () => treeViewRef.current?.unselectAll?.();
  const onSelectAllFilteredPress = () =>
    treeViewRef.current?.selectAllFiltered?.();
  const onUnselectAllFilteredPress = () =>
    treeViewRef.current?.unselectAllFiltered?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetSearchText = React.useCallback(
    debounce((text) => treeViewRef.current?.setSearchText(text), 375, {
      leading: true,
      trailing: true,
      maxWait: 750,
    }),
    []
  );
  const sortableProps: SortableCustomization = {
    ...DEFAULT_SORTABLE_PROPS,
  };
  return (
    <SafeAreaView style={styles.mainView}>
      <View style={[styles.selectionButtonRow, styles.selectionButtonBottom]}>
        <Button title="Expand All" onPress={expandAllPress} />
        <Button title="Collapse All" onPress={collapseAllPress} />
      </View>
      <SearchInput onChange={debouncedSetSearchText} />
      <View style={styles.selectionButtonRow}>
        <Button title="Select All" onPress={onSelectAllPress} />
        <Button title="Unselect All" onPress={onUnselectAllPress} />
      </View>
      <View style={styles.selectionButtonRow}>
        <Button title="Select Filtered" onPress={onSelectAllFilteredPress} />
        <Button
          title="Unselect Filtered"
          onPress={onUnselectAllFilteredPress}
        />
      </View>
      <View style={styles.treeViewParent}>
        <TreeView
          placeholderStyle={styles.placeholder}
          canSort={true}
          ref={treeViewRef}
          data={sampleData.current}
          onCheck={handleSelectionChange}
          onExpand={handleExpanded}
          draggableProps={sortableProps}
          CustomNodeRowComponent={CustomNodeRowView}
        />
      </View>
    </SafeAreaView>
  );
}

function _CustomNodeRowView<ID = string>(props: NodeRowProps<ID>) {
  const { node, level, checkedValue, isExpanded, onCheck, onExpand } = props;

  const color = 'black';
  const iconColor =
    checkedValue === true

        ? 'black'
        : '#a1a1a1';
  const status =
    checkedValue === 'indeterminate'
      ? 'indeterminate'
      : checkedValue
        ? 'checked'
        : 'unchecked';
  return (
    <View style={styles.rowView}>
      <Levels levels={level} />
      <View style={styles.innerRowView}>
        {node.children?.length ? (
          <TouchableOpacity onPress={onExpand}>
            <Icon
              name={isExpanded ? 'keyboard-arrow-down' : 'chevron-right'}
              size={25}
              color={iconColor}
              style={styles.iconStyle}
            />
          </TouchableOpacity>
        ) : null}
        <Checkbox status={status} onPress={() => onCheck()} />
          <View
            style={
              styles.textView
            }
          >
            <Text style={{ color }}>{node.name}</Text>
          </View>
      </View>
    </View>
  );
}

const CustomNodeRowView = typedMemo(_CustomNodeRowView);

const VerticalLine = () => {
  const style = useAnimatedStyle(() => {
    return styles.verticalLineStyle;
  });
  return <Animated.View style={style} />;
};

const Levels = ({ levels }: { levels: number }) => {
  const child = Array(levels)
    .fill(null)
    .map((_, i) => <VerticalLine key={i} />);
  return <View style={styles.levelsStyle}>{child}</View>;
};

const styles = StyleSheet.create({
  ...screenStyles,
  ...nodeRowStyles,
  placeholder: {
    backgroundColor: '#ff0000',
    transform: [{ scale: 1.2 }],
  },
  rowView: {
    ...nodeRowStyles.rowView,
    borderBottomWidth: 0,
    borderTopWidth: 0,
  },
  levelsStyle: {
    display: 'flex',
    alignItems: 'stretch',
    // backgroundColor: '#f00',
    flexDirection: 'row',
    flexShrink: 1,
    marginEnd: 10,
  },
  innerRowView: { alignItems: 'center', flexDirection: 'row', flexGrow: 1 },
  iconStyle: {
    alignSelf: 'center',
  },
  verticalLineStyle: {
    ...nodeRowStyles.verticalLineStyle,
    borderColor: 'black',
    flex: 1,
    marginStart: 22,
  },
  touchableOpacity: { ...nodeRowStyles.touchableOpacity, flexGrow: 1 },
  textView: {...nodeRowStyles.textView, flexShrink: 1}
});
