import { resolveProviders } from './resolution';
import { Key } from './registry';
import {
  noProviderError,
  cyclicDependencyError,
  instantiationError,
} from './errors';
const _THROW_IF_NOT_FOUND = new Object();
const UNDEFINED = new Object();
const NOT_FOUND = new Object();
function notInExecutionContext() {
  throw new Error('Not in execution context');
}
// Publicly available Injector.
// We use ReflectiveInjector everywhere
// but we don't want to leak its API to everyone
export class Injector {}
export class ReflectiveInjector {
  constructor({
    name,
    providers,
    parent,
    fallbackParent,
    globalProvidersMap = new Map(),
  }) {
    this._constructionCounter = 0;
    this._executionContextGetter = notInExecutionContext;
    this.displayName = name;
    this._parent = parent || null;
    this._fallbackParent = fallbackParent || null;
    this._providers = providers;
    this._globalProvidersMap = globalProvidersMap;
    const len = this._providers.length;
    this._keyIds = new Array(len);
    this._objs = new Array(len);
    for (let i = 0; i < len; i++) {
      this._keyIds[i] = this._providers[i].key.id;
      this._objs[i] = UNDEFINED;
    }
  }
  static createFromResolved({
    name,
    providers,
    parent,
    fallbackParent,
    globalProvidersMap,
  }) {
    return new ReflectiveInjector({
      name,
      providers,
      parent,
      fallbackParent,
      globalProvidersMap,
    });
  }
  static resolve(providers) {
    return resolveProviders(providers);
  }
  get parent() {
    return this._parent;
  }
  get fallbackParent() {
    return this._fallbackParent;
  }
  get(token, notFoundValue = _THROW_IF_NOT_FOUND) {
    return this._getByKey(Key.get(token), notFoundValue);
  }
  setExecutionContextGetter(getter) {
    this._executionContextGetter = getter;
  }
  _getByKey(key, notFoundValue) {
    let inj = this;
    function getObj() {
      while (inj instanceof ReflectiveInjector) {
        const inj_ = inj;
        const obj = inj_._getObjByKeyId(key.id);
        if (obj !== UNDEFINED) {
          return obj;
        }
        inj = inj_._parent;
      }
      return NOT_FOUND;
    }
    const resolvedValue = getObj();
    if (resolvedValue !== NOT_FOUND) {
      return resolvedValue;
    }
    // search in fallback Injector
    if (this._fallbackParent) {
      inj = this._fallbackParent;
      const resolvedFallbackValue = getObj();
      if (resolvedFallbackValue !== NOT_FOUND) {
        return resolvedFallbackValue;
      }
    }
    if (inj !== null) {
      return inj.get(key.token, notFoundValue);
    }
    return this._throwOrNull(key, notFoundValue);
  }
  _isObjectDefinedByKeyId(keyId) {
    for (let i = 0; i < this._keyIds.length; i++) {
      if (this._keyIds[i] === keyId) {
        return this._objs[i] !== UNDEFINED;
      }
    }
    return false;
  }
  _getObjByKeyId(keyId) {
    var _a, _b;
    if (
      (_a = this._globalProvidersMap) === null || _a === void 0
        ? void 0
        : _a.has(keyId)
    ) {
      return (_b = this._globalProvidersMap.get(keyId)) === null ||
        _b === void 0
        ? void 0
        : _b._getObjByKeyId(keyId);
    }
    for (let i = 0; i < this._keyIds.length; i++) {
      if (this._keyIds[i] === keyId) {
        if (this._objs[i] === UNDEFINED) {
          this._objs[i] = this._new(this._providers[i]);
        }
        return this._objs[i];
      }
    }
    return UNDEFINED;
  }
  _throwOrNull(key, notFoundValue) {
    if (notFoundValue !== _THROW_IF_NOT_FOUND) {
      return notFoundValue;
    } else {
      throw noProviderError(this, key);
    }
  }
  instantiateAll() {
    this._providers.forEach((provider) => {
      this._getByKey(provider.key, _THROW_IF_NOT_FOUND);
    });
  }
  _instantiateProvider(provider) {
    const factory = provider.factory.factory;
    let deps;
    try {
      deps = provider.factory.dependencies.map((dep) =>
        this._getByDependency(dep)
      );
    } catch (e) {
      if (e.addKey) {
        e.addKey(provider.key);
      }
      throw e;
    }
    let obj;
    try {
      obj = factory(...deps);
      // attach execution context getter
      if (provider.factory.executionContextIn.length > 0) {
        for (const prop of provider.factory.executionContextIn) {
          Object.defineProperty(obj, prop, {
            get: () => {
              return this._executionContextGetter();
            },
          });
        }
      }
    } catch (e) {
      throw instantiationError(this, e, provider.key);
    }
    return obj;
  }
  _getByDependency(dep) {
    return this._getByKey(dep.key, dep.optional ? null : _THROW_IF_NOT_FOUND);
  }
  _new(provider) {
    if (this._constructionCounter++ > this._getMaxNumberOfObjects()) {
      throw cyclicDependencyError(this, provider.key);
    }
    return this._instantiateProvider(provider);
  }
  _getMaxNumberOfObjects() {
    return this._objs.length;
  }
  toString() {
    return this.displayName;
  }
}
//# sourceMappingURL=injector.js.map
