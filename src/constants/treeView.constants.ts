import { Platform } from "react-native";
import { PanGestureHandlerProperties } from "react-native-gesture-handler";
import { WithSpringConfig } from "react-native-reanimated";
import { SortableCustomization } from "../types/treeView.types";

export const defaultIndentationMultiplier = 15;

export const DEFAULT_ANIMATION_CONFIG: WithSpringConfig = {
  damping: 20,
  mass: 0.2,
  stiffness: 50,
  overshootClamping: false,
  restSpeedThreshold: 0.2,
  restDisplacementThreshold: 0.2,
};
export const DEFAULT_SORTABLE_PROPS: SortableCustomization = {
  autoScrollThreshold: 30,
  autoScrollSpeed: 100,
  animationConfig: DEFAULT_ANIMATION_CONFIG,
  scrollEnabled: true,
  dragHitSlop: 0 as PanGestureHandlerProperties["hitSlop"],
  activationDistance: 0,
  dragItemOverflow: false,

}
export const SCROLL_POSITION_TOLERANCE = 2;
export const isIOS = Platform.OS === "ios";
export const isAndroid = Platform.OS === "android";
export const isWeb = Platform.OS === "web";
