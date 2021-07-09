import { Type, isClassProvider, isFactoryProvider } from './providers';
import { invalidProviderError, noAnnotationError } from './errors';
import { Key } from './registry';
import { resolveForwardRef } from './forward-ref';
import { readInjectableMetadata } from './metadata';
const _EMPTY_LIST = [];
export class ResolvedProvider {
  constructor(key, factory) {
    this.key = key;
    this.factory = factory;
  }
}
export class ResolvedFactory {
  constructor(
    /**
     * Factory function which can return an instance of an object represented by a key.
     */
    factory,
    /**
     * Arguments (dependencies) to the `factory` function.
     */
    dependencies,
    /**
     * Methods invoked within ExecutionContext.
     */
    executionContextIn,
    /**
     * Has onDestroy hook
     */
    hasOnDestroyHook,
    /**
     * Is Global
     */
    isGlobal
  ) {
    this.factory = factory;
    this.dependencies = dependencies;
    this.executionContextIn = executionContextIn;
    this.hasOnDestroyHook = hasOnDestroyHook;
    this.isGlobal = isGlobal;
  }
}
export class Dependency {
  constructor(key, optional) {
    this.key = key;
    this.optional = optional;
  }
  static fromKey(key) {
    return new Dependency(key, false);
  }
}
export function resolveProviders(providers) {
  const normalized = normalizeProviders(providers, []);
  const resolved = normalized.map(resolveProvider);
  const resolvedProviderMap = mergeResolvedProviders(resolved, new Map());
  return Array.from(resolvedProviderMap.values());
}
function resolveProvider(provider) {
  return new ResolvedProvider(
    Key.get(provider.provide),
    resolveFactory(provider)
  );
}
function mergeResolvedProviders(providers, normalizedProvidersMap) {
  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    normalizedProvidersMap.set(provider.key.id, provider);
  }
  return normalizedProvidersMap;
}
function normalizeProviders(providers, res) {
  providers.forEach((token) => {
    if (token instanceof Type) {
      res.push({ provide: token, useClass: token });
    } else if (
      token &&
      typeof token === 'object' &&
      token.provide !== undefined
    ) {
      res.push(token);
    } else if (token instanceof Array) {
      normalizeProviders(token, res);
    } else {
      throw invalidProviderError(token);
    }
  });
  return res;
}
function resolveFactory(provider) {
  let factoryFn;
  let resolvedDeps = _EMPTY_LIST;
  let executionContextIn = _EMPTY_LIST;
  let hasOnDestroyHook = false;
  let isGlobal;
  if (isClassProvider(provider)) {
    const useClass = resolveForwardRef(provider.useClass);
    factoryFn = makeFactory(useClass);
    resolvedDeps = dependenciesFor(useClass);
    executionContextIn = executionContextInFor(useClass);
    isGlobal = globalFor(useClass);
    hasOnDestroyHook = typeof useClass.prototype.onDestroy === 'function';
  } else if (isFactoryProvider(provider)) {
    factoryFn = provider.useFactory;
    resolvedDeps = constructDependencies(
      provider.useFactory,
      provider.deps || []
    );
    isGlobal = provider.global;
    if (provider.executionContextIn) {
      executionContextIn = provider.executionContextIn;
    }
  } else {
    factoryFn = () => provider.useValue;
    resolvedDeps = _EMPTY_LIST;
    isGlobal = provider.global;
  }
  return new ResolvedFactory(
    factoryFn,
    resolvedDeps,
    executionContextIn,
    hasOnDestroyHook,
    isGlobal !== null && isGlobal !== void 0 ? isGlobal : false
  );
}
function dependenciesFor(type) {
  const { params } = readInjectableMetadata(type, true);
  if (!params) {
    return [];
  }
  if (params.some((p) => p.type == null)) {
    throw noAnnotationError(type, params);
  }
  return params.map((p) => extractToken(p, params));
}
function executionContextInFor(type) {
  const { options } = readInjectableMetadata(type, true);
  if (
    (options === null || options === void 0
      ? void 0
      : options.executionContextIn) &&
    options.executionContextIn !== _EMPTY_LIST
  ) {
    return options === null || options === void 0
      ? void 0
      : options.executionContextIn;
  }
  return [];
}
function globalFor(type) {
  var _a;
  const { options } = readInjectableMetadata(type);
  return (_a =
    options === null || options === void 0 ? void 0 : options.global) !==
    null && _a !== void 0
    ? _a
    : false;
}
function constructDependencies(typeOrFunc, dependencies) {
  if (!dependencies) {
    return dependenciesFor(typeOrFunc);
  } else {
    const params = dependencies.map((d) => ({ type: d, optional: false }));
    return params.map((t) => extractToken(t, params));
  }
}
function extractToken(param, params) {
  const token = resolveForwardRef(param.type);
  if (token) {
    return createDependency(token, param.optional);
  }
  throw noAnnotationError(param.type, params);
}
function createDependency(token, optional) {
  return new Dependency(Key.get(token), optional);
}
function makeFactory(t) {
  return (...args) => new t(...args);
}
//# sourceMappingURL=resolution.js.map
