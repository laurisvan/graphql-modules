import { stringify } from './utils';
const forwardRefSymbol = Symbol('__forward_ref__');
/**
 * Useful in "circular dependencies of modules" situation
 */
export function forwardRef(forwardRefFn) {
  forwardRefFn[forwardRefSymbol] = forwardRef;
  forwardRefFn.toString = function () {
    return stringify(this());
  };
  return forwardRefFn;
}
export function resolveForwardRef(type) {
  if (
    typeof type === 'function' &&
    type.hasOwnProperty(forwardRefSymbol) &&
    type[forwardRefSymbol] === forwardRef
  ) {
    return type();
  } else {
    return type;
  }
}
//# sourceMappingURL=forward-ref.js.map
