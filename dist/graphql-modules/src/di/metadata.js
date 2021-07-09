import { noInjectableError } from './errors';
export const INJECTABLE = Symbol('di:injectable');
export function readInjectableMetadata(type, throwOnMissing) {
  const meta = type[INJECTABLE];
  if (!meta && throwOnMissing) {
    throw noInjectableError(type);
  }
  return meta;
}
export function ensureInjectableMetadata(type) {
  if (!readInjectableMetadata(type)) {
    const meta = {
      params: [],
    };
    type[INJECTABLE] = meta;
  }
}
//# sourceMappingURL=metadata.js.map
