import Animated from 'react-native-reanimated';

/**
 * this is a wrapper for react-native-reanimated's createAnimatedComponent that
 * retains type parameter information of the component passed to it.
 */
export const createAnimatedComponent: <T extends object>(c: T) => T & ReturnType<typeof Animated.createAnimatedComponent<T>> =
  Animated.createAnimatedComponent;
