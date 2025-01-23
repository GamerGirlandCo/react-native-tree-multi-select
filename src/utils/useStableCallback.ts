import { useCallback, useRef } from "react";

/**
 * useStableCallback is like useCallback, except that it returns a reference to the same function,
 * instead of creating a new one each time a dependency changes.
 * @param cb the callback
 * @param deps the dependencies
 * @returns an identity-retaining callback
 */
export function useStableCallback<
  T extends (...args: any[]) => any
>(cb: T, deps: any[] = []) {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  const identityRetainingCb = useCallback(
    (...args: Parameters<T>) => cbRef.current(...args),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  );
  return identityRetainingCb as T;
}
