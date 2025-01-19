import Animated, {
  runOnJS,
  StyleProps,
  useAnimatedReaction,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native';
import React, { useMemo, useState } from 'react';
import {
  __FlattenedTreeNode__,
  PartialListRenderItem,
} from '../types/treeView.types';
import { typedMemo } from '../utils/typedMemo';
import { useDraggableContext } from '../contexts/DraggableContext';
type Props<ID> = {
  renderPlaceholder?: PartialListRenderItem<__FlattenedTreeNode__<ID>>;
  data: __FlattenedTreeNode__<ID>[];
  style?: StyleProps;
};


function PlaceholderItem<ID>({ renderPlaceholder, data, style }: Props<ID>) {
  const {
    activeCellSize,
    placeholderOffset,
    spacerIndexAnim,
    scrollOffset,
    activeKey,
    activeIndexAnim: activeIndex
  } = useDraggableContext<ID>();
  const [size, setSize] = useState(Math.max(activeCellSize.value, 0));
  // Size does not seem to be respected when it is an animated style
  useAnimatedReaction(
    () => {
      return activeCellSize.value;
    },
    (cur, prev) => {
      if (cur !== prev) {
        runOnJS(setSize)(cur);
      }
    }
  );

  const activeItem =
    !activeIndex.value ? null : activeIndex.value !== -1 ? data[activeIndex.value] : null;

  const animStyle = useAnimatedStyle(() => {
    const offset = placeholderOffset.value - scrollOffset.value
    return {
        opacity: size >= 0 ? 1 : 0,
        overflow: 'hidden',
        transform: [
           { translateY: offset },
        ],
      };

  }, [spacerIndexAnim, placeholderOffset, scrollOffset, size]);

  const extraStyle = useMemo(() => {
    return { flex: 1 };
  }, [])

  return (
    <Animated.View
      pointerEvents={activeKey ? "auto" : "none"}
      style={[StyleSheet.absoluteFill, animStyle, extraStyle, style]}
    >
      {!activeItem || activeIndex === undefined
        ? null
        : renderPlaceholder?.({ item: activeItem, index: activeIndex.value })}
    </Animated.View>
  );
}

export default typedMemo(PlaceholderItem);

