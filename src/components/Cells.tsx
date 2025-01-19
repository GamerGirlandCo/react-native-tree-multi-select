import Animated, {
  DerivedValue,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useDraggableContext } from '../contexts/DraggableContext';
import React, { forwardRef, ReactElement, useEffect, useMemo, useRef } from 'react';
import { __FlattenedTreeNode__ } from '../types/treeView.types';
import {
  LayoutChangeEvent,
  MeasureLayoutOnSuccessCallback,
  View,
  ViewStyle,
} from 'react-native';
import { useStableCallback } from '../utils/useStableCallback';
import { isWeb } from '../constants/treeView.constants';
import { CellContainer } from '@shopify/flash-list';
type Props<ID> = Omit<
  {
    item: __FlattenedTreeNode__<ID>;
    index: number;
    children: React.ReactNode;
    onLayout?: (e: LayoutChangeEvent) => void;
    style?: ViewStyle;
    level: number;
    // height: number;
  },
  'ref'
>;
const AnimatedCellContainer = Animated.createAnimatedComponent(CellContainer)
function useCellTranslate<ID>({
  cellIndex,
  cellSize,
  cellOffset,
  cellIndent,
}: {
  cellIndex: number;
  cellSize: SharedValue<number>;
  cellOffset: SharedValue<number>;
  cellIndent: SharedValue<number>;
}): [SharedValue<number>, DerivedValue<number>] {
  const {
    activeIndexAnim,
    sortableConfig,
    activeKey,
    hoverOffset,
    activeCellSize,
    spacerIndexAnim,
    placeholderOffset,
    hoverAnim,
    // flashListRef,
    spacerIndentLevel,
    indentationMultiplier,
    activeIndentLevel,
  } = useDraggableContext<ID>();

  const { animationConfig } = sortableConfig.current;
  const translate = useDerivedValue(() => {
    const isActiveCell = cellIndex === activeIndexAnim.value;

    // Determining spacer index is hard to visualize. See diagram: https://i.imgur.com/jRPf5t3.jpg
    const isBeforeActive = cellIndex < activeIndexAnim.value;
    const isAfterActive = cellIndex > activeIndexAnim.value;

    const hoverPlusActiveSize = hoverOffset.value + activeCellSize.value;
    const offsetPlusHalfSize = cellOffset.value + cellSize.value / 2;
    const offsetPlusSize = cellOffset.value + cellSize.value;
    let result = -1;

    if (isAfterActive) {
      if (
        hoverPlusActiveSize >= cellOffset.value &&
        hoverPlusActiveSize < offsetPlusHalfSize
      ) {
        // bottom edge of active cell overlaps top half of current cell
        result = cellIndex - 1;
      } else if (
        hoverPlusActiveSize >= offsetPlusHalfSize &&
        hoverPlusActiveSize < offsetPlusSize
      ) {
        // bottom edge of active cell overlaps bottom half of current cell
        result = cellIndex;
      }
    } else if (isBeforeActive) {
      if (
        hoverOffset.value < offsetPlusSize &&
        hoverOffset.value >= offsetPlusHalfSize
      ) {
        // top edge of active cell overlaps bottom half of current cell
        result = cellIndex + 1;
      } else if (
        hoverOffset.value >= cellOffset.value &&
        hoverOffset.value < offsetPlusHalfSize
      ) {
        // top edge of active cell overlaps top half of current cell
        result = cellIndex;
      }
    }

    if (result !== -1 && result !== spacerIndexAnim.value) {
      spacerIndexAnim.value = result;
      spacerIndentLevel.value = cellIndent.value;
    }

    if (spacerIndexAnim.value === cellIndex) {
      const newPlaceholderOffset = isAfterActive
        ? cellSize.value + (cellOffset.value - activeCellSize.value)
        : cellOffset.value;
      placeholderOffset.value = newPlaceholderOffset;
    }

    // Active cell follows touch
    if (isActiveCell) {
      return hoverAnim.value;
    }

    // Translate cell down if it is before active index and active cell has passed it.
    // Translate cell up if it is after the active index and active cell has passed it.

    const shouldTranslate = isAfterActive
      ? cellIndex <= spacerIndexAnim.value
      : cellIndex >= spacerIndexAnim.value;
      const translationAmt = shouldTranslate
      ? activeCellSize.value * (isAfterActive ? -1 : 1)
      : 0;
      // console.log('before, after', isBeforeActive, isAfterActive)
      // console.log('should translate', shouldTranslate, translationAmt, activeKey)
    return withSpring(translationAmt, animationConfig);
  }, [activeKey, cellIndex]);
  const indentTranslate = useDerivedValue(() => {
    const trx = spacerIndentLevel.value - activeIndentLevel.value;
    return withSpring(trx * indentationMultiplier, animationConfig);
  }, [activeIndentLevel, spacerIndentLevel]);
  // flashListRef.current?.prepareForLayoutAnimationRender();
  return [translate, indentTranslate];
}

function CellRendererInner<ID>(props: Props<ID>) {
  const { index, onLayout, children, ...rest } = props;

  // bit hacky, but better than passing the data array in and costing us precious performance....
  const {props: {data: item}} = children as ReactElement<{data: __FlattenedTreeNode__<ID>; [key: string]: any}>
  const viewRef = useRef<View>(null);
  const { activeKey, containerRef, cellDataRef, activeCellSize } = useDraggableContext<ID>();
  const key = item!.id;
  const offset = useSharedValue(-1);
  const size = useSharedValue(activeCellSize.value);
  const heldTanslate = useSharedValue(0);
  const indentLevel = useSharedValue(item?.level ?? 0);

  const [translate, indentChange] = useCellTranslate({
    cellOffset: offset,
    cellSize: size,
    cellIndex: index,
    cellIndent: indentLevel,
  });

  const isActive = activeKey === key;

  const animStyle = useAnimatedStyle(() => {
    // When activeKey becomes null at the end of a drag and the list reorders,
    // the animated style may apply before the next paint, causing a flicker.
    // Solution is to hold over the last animated value until the next onLayout.
    // (Not required in web)
    if (translate.value && !isWeb) {
      heldTanslate.value = translate.value;
    }
    const t = activeKey ? translate.value : heldTanslate.value;
    const trx: ({ translateY: number } | { translateX: number })[] = [
      { translateY: t },
    ];
    if (isActive && activeKey) trx.push({ translateX: indentChange.value });
    return {
      transform: trx,
    };
  }, [translate, activeKey, indentChange, isActive, indentLevel]);

  const updateCellMeasurements = useStableCallback(() => {
    const onSuccess: MeasureLayoutOnSuccessCallback = (_x, y, _w, h) => {
      const cellOffset = y;
      const cellSize = h;

      size.value = cellSize;
      offset.value = cellOffset;
      cellDataRef.current.set(key, {
        measurements: {
          size: cellSize,
          offset: cellOffset,
        },
      });
    };

    const onFail = () => {
      console.warn(`## on measure fail, index: ${index}`);
    };

    const containerNode = containerRef.current;
    const viewNode = viewRef.current;
    const nodeHandle = containerNode;
    if (viewNode && nodeHandle) {
      //@ts-ignore
      viewNode.measureLayout(nodeHandle, onSuccess, onFail);
    }
  });

  const onCellLayout = useStableCallback((e?: LayoutChangeEvent) => {
    heldTanslate.value = 0;
    updateCellMeasurements();
    if (onLayout && e) onLayout(e);
  });

  useEffect(() => {
    if (isWeb) {
      // onLayout isn't called on web when the cell index changes, so we manually re-measure
      requestAnimationFrame(() => {
        onCellLayout();
      });
    }
  }, [index, onCellLayout]);

  const baseStyle = useMemo(() => {
    return {
      elevation: isActive ? 1 : 0,
      zIndex: isActive ? 999 : 0,
      flexDirection: 'column' as const,
      // height
    };
  }, [isActive]);
  const propStyle = useMemo(() => ({ ...props.style }) as ViewStyle, [props]);

    return (
      <AnimatedCellContainer {...rest} index={index}
          ref={viewRef}
          onLayout={onCellLayout}
          style={[baseStyle, propStyle, animStyle]}
          pointerEvents={activeKey ? 'none' : 'auto'}
        >
          {children}
      </AnimatedCellContainer>
    );
}
export default function <T>(_height: number) {
  return forwardRef<typeof CellRendererInner<T>, Props<T>>((props, _ref) => {
    return <CellRendererInner {...props} />;
  });
}
