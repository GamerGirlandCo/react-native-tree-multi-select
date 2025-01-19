import React, {
  useCallback,
  useContext,
  useState,
  Context,
  useRef,
  useMemo,
} from 'react';
import {
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { State as GestureState } from 'react-native-gesture-handler';
import {
  __FlattenedTreeNode__,
  SortableCustomization,
} from '../types/treeView.types';
import { Vibration, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useStableCallback } from '../utils/useStableCallback';
import { defaultIndentationMultiplier } from '../constants/treeView.constants';

const AnimatedValueContext = React.createContext<
  ReturnType<typeof useSetupAnimatedValues> | undefined
>(undefined);

export default function DraggableContextProvider<ID>({
  children,
  cust,
  indentationMultiplier = defaultIndentationMultiplier,
}: {
  children: React.ReactNode;
  cust: SortableCustomization;
  indentationMultiplier?: number;
}) {
  const value = useSetupAnimatedValues<ID>({ ...cust, indentationMultiplier });
  const ctx = AnimatedValueContext as Context<
    ReturnType<typeof useSetupAnimatedValues<ID>>
  >;
  return <ctx.Provider value={value}>{children}</ctx.Provider>;
}

export function useDraggableContext<ID>() {
  const value = useContext(AnimatedValueContext) as ReturnType<
    typeof useSetupAnimatedValues<ID>
  >;
  if (!value) {
    throw new Error(
      'useAnimatedValues must be called from within AnimatedValueProvider!'
    );
  }
  return value;
}

function useSetupAnimatedValues<ID>(
  props: SortableCustomization & { indentationMultiplier: number }
) {
  const cellDataRef = useRef<
    Map<
      ID,
      {
        measurements: { size: number; offset: number };
      }
    >
  >(new Map());
  const outerScrollOffset = useSharedValue(0);

  const containerSize = useSharedValue(0);
  const scrollViewSize = useSharedValue(0);

  const panGestureState = useSharedValue<GestureState>(
    GestureState.UNDETERMINED
  );
  const touchTranslate = useSharedValue(0);

  const isTouchActiveNative = useSharedValue(false);

  const hasMoved = useSharedValue(0);
  const disabled = useSharedValue(false);

  const activeIndexAnim = useSharedValue(-1); // Index of cell being actively dragged
  const spacerIndexAnim = useSharedValue(-1); // Index of hovered-over cell

  const activeIndentLevel = useSharedValue(-1);
  const spacerIndentLevel = useSharedValue(-1);

  const activeCellSize = useSharedValue(0); // Height or width of acctive cell
  const activeCellOffset = useSharedValue(0); // Distance between active cell and edge of container

  const scrollOffset = useSharedValue(0);
  const scrollInit = useSharedValue(0);

  const viewableIndexMin = useSharedValue(0);
  const viewableIndexMax = useSharedValue(0);

  // If list is nested there may be an outer scrollview
  const outerScrollInit = useSharedValue(0);

  useAnimatedReaction(
    () => {
      return activeIndexAnim.value;
    },
    (cur, prev) => {
      if (cur !== prev && cur >= 0) {
        scrollInit.value = scrollOffset.value;
        outerScrollInit.value = outerScrollOffset.value;
      }
    },
    [outerScrollOffset]
  );

  const placeholderOffset = useSharedValue(0);

  const isDraggingCell = useDerivedValue(() => {
    return isTouchActiveNative.value && activeIndexAnim.value >= 0;
  }, []);

  const autoScrollDistance = useDerivedValue(() => {
    if (!isDraggingCell.value) return 0;
    const innerScrollDiff = scrollOffset.value - scrollInit.value;
    // If list is nested there may be an outer scroll diff
    const outerScrollDiff = outerScrollOffset.value - outerScrollInit.value;
    const scrollDiff = innerScrollDiff + outerScrollDiff;
    return scrollDiff;
  }, []);

  const touchPositionDiff = useDerivedValue(() => {
    const extraTranslate = isTouchActiveNative.value
      ? autoScrollDistance.value
      : 0;
    return touchTranslate.value + extraTranslate;
  }, []);

  const hoverAnim = useDerivedValue(() => {
    if (activeIndexAnim.value < 0) return 0;
    return touchPositionDiff.value;
  }, [touchPositionDiff]);

  const hoverOffset = useDerivedValue(() => {
    return hoverAnim.value + activeCellOffset.value;
  }, [hoverAnim, activeCellOffset]);
  let [activeKey, setActiveKey] = useState<ID | null>(null);

  useDerivedValue(() => {
    // Reset spacer index when we stop hovering
    const isHovering = activeIndexAnim.value >= 0;
    if (!isHovering && spacerIndexAnim.value >= 0) {
      spacerIndexAnim.value = -1;
    }
  }, []);
  const flashListRef = useRef<FlashList<__FlattenedTreeNode__<ID>>>(null);
  const containerRef = useRef<View>(null);
  // Note: this could use a refactor as it combines touch state + cell animation
  const resetTouchedCell = useCallback(() => {
    activeCellOffset.value = 0;
    hasMoved.value = 0;
  }, [activeCellOffset, hasMoved]);
  const beginDrag = useStableCallback(
    (key: ID, index: number, level: number) => {
      if (disabled.value) return;
      Vibration.vibrate(10);
      const cellData = cellDataRef.current.get(key);
      if (cellData) {
        activeCellOffset.value = cellData.measurements.offset;
        activeCellSize.value = cellData.measurements.size;
      }

      if (index !== undefined) {
        spacerIndexAnim.value = index;
        activeIndexAnim.value = index;
        activeIndentLevel.value = level;
        setActiveKey(key);
      }
    },
    [
      activeCellOffset,
      activeCellSize,
      activeIndexAnim,
      disabled.value,
      spacerIndexAnim,
    ]
  );

  const sortableConfig = useRef(props);

  const value = useMemo(
    () => ({
      activeCellOffset,
      cellDataRef,
      activeCellSize,
      activeIndexAnim,
      spacerIndentLevel,
      activeIndentLevel,
      spacerIndexAnim,
      containerSize,
      disabled,
      hoverAnim,
      hoverOffset,
      isDraggingCell,
      isTouchActiveNative,
      panGestureState,
      placeholderOffset,
      resetTouchedCell,
      scrollOffset,
      scrollViewSize,
      touchPositionDiff,
      touchTranslate,
      autoScrollDistance,
      viewableIndexMin,
      viewableIndexMax,
      setActiveKey,
      activeKey,
      flashListRef,
      containerRef,
      beginDrag,
      sortableConfig,
      indentationMultiplier: props.indentationMultiplier,
    }),
    [
      activeCellOffset,
      activeCellSize,
      activeIndexAnim,
      props,
      spacerIndentLevel,
      activeIndentLevel,
      spacerIndexAnim,
      containerSize,
      disabled,
      hoverAnim,
      hoverOffset,
      isDraggingCell,
      isTouchActiveNative,
      panGestureState,
      placeholderOffset,
      resetTouchedCell,
      scrollOffset,
      scrollViewSize,
      touchPositionDiff,
      touchTranslate,
      autoScrollDistance,
      viewableIndexMin,
      viewableIndexMax,
      activeKey,
      beginDrag,
    ]
  );

  return value;
}
