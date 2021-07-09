import { stringify } from './utils';
import { resolveForwardRef } from './forward-ref';
export class Key {
  constructor(token, id) {
    this.token = token;
    this.id = id;
    if (!token) {
      throw new Error('Token must be defined!');
    }
  }
  /**
   * Returns a stringified token.
   */
  get displayName() {
    return stringify(this.token);
  }
  static get(token) {
    return _globalKeyRegistry.get(resolveForwardRef(token));
  }
}
class GlobalKeyRegistry {
  constructor() {
    this._allKeys = new Map();
  }
  get(token) {
    if (token instanceof Key) {
      return token;
    }
    if (this._allKeys.has(token)) {
      return this._allKeys.get(token);
    }
    const newKey = new Key(token, _globalKeyRegistry.numberOfKeys);
    this._allKeys.set(token, newKey);
    return newKey;
  }
  get numberOfKeys() {
    return this._allKeys.size;
  }
}
const _globalKeyRegistry = new GlobalKeyRegistry();
//# sourceMappingURL=registry.js.map
