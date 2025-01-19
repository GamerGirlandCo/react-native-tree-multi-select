import {
  FlashList,
  FlashListProps,
  ListRenderItemInfo,
} from '@shopify/flash-list';
import React, { useMemo } from 'react';
import { LayoutChangeEvent, StyleSheet } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedScrollHandler,
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withSpring,
  LinearTransition,
} from 'react-native-reanimated';
import { useTreeViewStore } from '../store/treeView.store';
import {
  __FlattenedTreeNode__,
  SortableProps,
  TreeNode,
} from '../types/treeView.types';
import { createAnimatedComponent } from '../utils/genericAnimatedComponent';
import PlaceholderItem from './PlaceholderItem';
import { useDraggableContext } from '../contexts/DraggableContext';
import Cells from './Cells';
import { useStableCallback } from '../utils/useStableCallback';
import { DEFAULT_SORTABLE_PROPS } from '../constants/treeView.constants';
import { reconstructFlattenedTree } from '../helpers/reconstruct.helper';
import { typedMemo } from '../utils/typedMemo';
import { useShallow } from 'zustand/react/shallow';

const AnimatedFlashList = createAnimatedComponent(FlashList);
type PartialRenderInfo<ID> = Partial<
  Omit<ListRenderItemInfo<__FlattenedTreeNode__<ID>>, 'item' | 'index'>
> & {
  item: __FlattenedTreeNode__<ID>;
  index: number;
};

type Props<ID> = Omit<
  FlashListProps<__FlattenedTreeNode__<ID>>,
  'renderItem' | 'data' | 'horizontal'
> & {
  data: __FlattenedTreeNode__<ID>[];
  onSort?: SortableProps<ID>['onSort'];
  autoScrollSpeed?: number;
  storeId: string;
  renderItem: (
    props: PartialRenderInfo<ID>
  ) => ReturnType<
    NonNullable<FlashListProps<__FlattenedTreeNode__<ID>>['renderItem']>
  >;
  placeholderStyle: SortableProps<ID>['placeholderStyle'];
};
function _DraggableNodeList<ID>(props: Props<ID>) {
  const { storeId, data, onSort, estimatedItemSize } = props;
  const store = useTreeViewStore<ID>(storeId)(useShallow((state) => ({
    childToParentMap: state.childToParentMap,
    updateNodeMap: state.updateNodeMap,
    expanded: state.expanded,
    updateChildToParentMap: state.updateChildToParentMap,
    nodeMap: state.nodeMap
  })));
  const {
    childToParentMap,
    updateChildToParentMap,
    updateNodeMap,
    expanded,
    nodeMap
  } = store;
  const {
    activeCellOffset,
    activeCellSize,
    activeIndexAnim,
    activeIndentLevel,
    containerSize,
    scrollOffset,
    scrollViewSize,
    spacerIndexAnim,
    placeholderOffset,
    touchTranslate,
    autoScrollDistance,
    panGestureState,
    isTouchActiveNative,
    disabled,
    setActiveKey,
    activeKey,
    sortableConfig,
    containerRef,
    flashListRef,
    spacerIndentLevel,
  } = useDraggableContext<ID>();

  const {
    dragHitSlop = DEFAULT_SORTABLE_PROPS.dragHitSlop,
    activationDistance:
      activationDistanceProp = DEFAULT_SORTABLE_PROPS.activationDistance,
    animationConfig,
  } = sortableConfig.current;

  const reset = useStableCallback(() => {
    activeIndexAnim.value = -1;
    spacerIndexAnim.value = -1;
    touchTranslate.value = 0;
    activeCellSize.value = -1;
    activeCellOffset.value = -1;
    activeIndentLevel.value = 0;
    spacerIndentLevel.value = 0;
    setActiveKey(null);
    // setActiveIndexState(-1);
  });

  const onDragEnd = (fromIndex: number, toIndex: number) => {
    // setTimeout(() => {
    const changed = fromIndex !== toIndex;
    const maybeEmptyNode = data[toIndex];
    console.log('men', maybeEmptyNode, toIndex);
    const shouldInsertToEmptyNode =
      (maybeEmptyNode?.children?.length ?? 0) === 0;
    if (
      shouldInsertToEmptyNode &&
      maybeEmptyNode &&
      !maybeEmptyNode?.children
    ) {
      spacerIndentLevel.value = maybeEmptyNode.level!;
      maybeEmptyNode!.children = [];
      nodeMap.set(maybeEmptyNode!.id, {
        ...nodeMap.get(maybeEmptyNode!.id)!,
        children: [],
      });
    }
    if (changed || shouldInsertToEmptyNode) {
      const copy = [...data];
      let rootNodes = copy.filter((a) => !childToParentMap.has(a.id));
      const from = copy[fromIndex]!;
      const to = copy[toIndex]!;
      const parentSet: ID[] = [to.id];
      {
        let cur: ID | undefined = to.id;
        while (cur) {
          cur = childToParentMap.get(cur);
          if (cur) parentSet.push(cur);
        }
      }
      if (from!.level! < to?.level! && parentSet.includes(from.id)) {
        reset();
        console.debug('noop!');
        return;
      }

      const toId = to.id;
      const fromParent = nodeMap.get(childToParentMap.get(from.id)!) ?? null;
      const toParent = shouldInsertToEmptyNode
        ? (nodeMap.get(maybeEmptyNode?.id!) ??
          nodeMap.get(childToParentMap.get(maybeEmptyNode?.id!)!) ??
          null)
        : expanded.has(childToParentMap.get(toId)!)
          ? (nodeMap.get(childToParentMap.get(toId)!) ?? null)
          : (nodeMap.get(childToParentMap.get(toId)!) ?? null);
      const oldIndex = fromParent
        ? (fromParent.children?.[from.index - 1]?.index ?? 1) - 1
        : rootNodes.findIndex((a) => a.id === from.id);
      const newIndex = toParent
        ? (toParent.children?.[to.index - 1]?.index ?? 1) - 1
        : rootNodes.findIndex((a) => a.id === to.id);
      if (toParent) {
        childToParentMap.set(from.id, toParent.id);
      } else {
        childToParentMap.delete(from.id);
      }
      // data[fromIndex]!.index = newIndex + 1;
      let item;
      const mapper = (a: __FlattenedTreeNode__<ID>, i: number) => {
        const keysWithoutLevel = Object.keys(a).filter((b) => b !== 'level');
        const ret = { ...a, index: i + 1 } as __FlattenedTreeNode__<ID>;
        const toSet = keysWithoutLevel.reduce(
          (pv, cv) => ({ ...pv, [cv]: pv[cv] }),
          { ...ret }
        ) as TreeNode<ID>;
        nodeMap.set(toSet.id, toSet);
        return ret;
      };
      console.log('idxs', oldIndex, newIndex);
      if (oldIndex !== -1) {
        if (fromParent) {
          item = fromParent.children![oldIndex];

          fromParent.children = [...fromParent.children!].toSpliced(oldIndex, 1).map(mapper);
          nodeMap.set(fromParent.id, fromParent);
        } else {
          item = rootNodes[oldIndex];
          rootNodes.splice(oldIndex, 1);
        }
      }
      if (newIndex !== -1 && item) {
        const realNewIndex =
          fromParent === toParent && oldIndex < newIndex ? Math.max(newIndex - 1, 0) : newIndex;
        if (toParent) {
          toParent.children = [...toParent.children!].toSpliced(
            realNewIndex,
            0,
            item
          ).map(mapper);
          nodeMap.set(toParent.id, toParent);
        } else {
          rootNodes.splice(realNewIndex, 0, item);
        }
      }
      console.log((toParent?.children || rootNodes)?.map((a) => a.id));
      const [newRootNodes, newNodeMap] = reconstructFlattenedTree<ID>(
        rootNodes,
        childToParentMap,
        nodeMap
      );
      {
        let blip: ID | undefined = toParent?.id;
        while(blip !== undefined && blip !== null) {
          if(childToParentMap.has(blip))
            blip = childToParentMap.get(blip);
          else break;
        }
        const rootIdx = rootNodes.findIndex((a) => a.id === blip);
        console.log("nrn", newRootNodes[rootIdx], nodeMap.get(toParent?.id!))
      }
      updateNodeMap(newNodeMap);
      updateChildToParentMap(childToParentMap);
      onSort?.(oldIndex, newIndex, newRootNodes);
    }
    reset();
    // }, endAnimationDuration + 1);
  };

  const onContainerTouchStart = () => {
    if (!disabled.value) {
      isTouchActiveNative.value = true;
    }
    return false;
  };

  const onContainerTouchEnd = () => {
    isTouchActiveNative.value = false;
  };

  // Handle case where user ends drag without moving their finger.
  useAnimatedReaction(
    () => {
      return isTouchActiveNative.value;
    },
    (cur, prev) => {
      if (cur !== prev && !cur) {
        const hasMoved = !!touchTranslate.value;
        if (!hasMoved && activeIndexAnim.value >= 0 && !disabled.value) {
          console.log('reaction')
          runOnJS(reset)();
        }
      }
    },
    [isTouchActiveNative, reset]
  );

  const gestureDisabled = useSharedValue(false);

  const panGesture = Gesture.Pan()
    .onBegin((evt) => {
      if (evt.numberOfPointers !== 1) return;
      gestureDisabled.value = disabled.value;
      if (gestureDisabled.value) return;
      panGestureState.value = evt.state;
    })
    .onUpdate((evt) => {
      if (evt.numberOfPointers !== 1) return;
      if (gestureDisabled.value) return;
      panGestureState.value = evt.state;
      const translation = evt.translationY;
      touchTranslate.value = translation;
      if (spacerIndexAnim.value !== -1)
        spacerIndentLevel.value = data[spacerIndexAnim.value]!.level!;
    })
    .onEnd((evt) => {
      if (evt.numberOfPointers !== 1) return;
      if (gestureDisabled.value) return;
      // Set touch val to current translate val
      isTouchActiveNative.value = false;
      const translation = evt.translationY;

      touchTranslate.value = translation + autoScrollDistance.value;
      panGestureState.value = evt.state;

      // Only call onDragEnd if actually dragging a cell
      if (activeIndexAnim.value === -1 || disabled.value) return;
      disabled.value = true;
      const springTo = placeholderOffset.value - activeCellOffset.value;
      touchTranslate.value = withSpring(springTo, animationConfig, () => {
        runOnJS(onDragEnd)(activeIndexAnim.value, spacerIndexAnim.value);
        disabled.value = false;
      });
    })
    .onTouchesDown(() => {
      runOnJS(onContainerTouchStart)();
    })
    .onTouchesUp(() => {
      // Turning this into a worklet causes timing issues. We want it to run
      // just after the finger lifts.
      runOnJS(onContainerTouchEnd)();
    });

  if (dragHitSlop) panGesture.hitSlop(dragHitSlop);
  if (activationDistanceProp) {
    const activeOffset = [-activationDistanceProp, activationDistanceProp] as [
      number,
      number,
    ];

    panGesture.activeOffsetY(activeOffset);
  }

  const onContainerLayout = ({
    nativeEvent: { layout },
  }: LayoutChangeEvent) => {
    const { height } = layout;
    containerSize.value = height;
  };

  const onListContentSizeChange = (w: number, h: number) => {
    scrollViewSize.value = h;
    props.onContentSizeChange?.(w, h);
  };

  const scrollHandler = useAnimatedScrollHandler(
    {
      onScroll: (evt) => {
        scrollOffset.value = evt.contentOffset.y;
      },
    },
    []
  );

  const extraData = useMemo(
    () => ({
      activeKey,
    }),
    [activeKey]
  );

  const cellRenderer = useMemo(
    () => Cells(estimatedItemSize!),
    [estimatedItemSize]
  );

  return (
    <GestureHandlerRootView>
      <GestureDetector gesture={panGesture}>
        <Animated.View
          onLayout={onContainerLayout}
          style={styles.animatedView}
          ref={containerRef}
        >
          <AnimatedFlashList
            {...props}
            ref={flashListRef}
            data={data}
            renderItem={props.renderItem}
            layout={LinearTransition}
            CellRendererComponent={cellRenderer}
            onContentSizeChange={onListContentSizeChange}
            estimatedItemSize={props.estimatedItemSize}
            scrollEnabled={(props.scrollEnabled ?? true) && !activeKey}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            extraData={extraData}
            keyExtractor={(t) => JSON.stringify(t?.id ?? t)}
            bounces
          />
          {!!activeKey && (
            <PlaceholderItem
              renderPlaceholder={props.renderItem}
              data={props.data}
              style={props.placeholderStyle}
            />
          )}
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  animatedView: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  activeRow: {
    position: 'absolute',
    top: 0,
    width: '100%',
  },
});

export default typedMemo(_DraggableNodeList);
