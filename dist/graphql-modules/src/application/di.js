import { Scope } from '../di';
export function instantiateSingletonProviders({ appInjector, modulesMap }) {
  appInjector.instantiateAll();
  modulesMap.forEach((mod) => {
    mod.injector.instantiateAll();
  });
}
export function createGlobalProvidersMap({ modules, scope }) {
  const globalProvidersMap = {};
  const propType =
    scope === Scope.Singleton ? 'singletonProviders' : 'operationProviders';
  modules.forEach((mod) => {
    mod[propType].forEach((provider) => {
      if (provider.factory.isGlobal) {
        const key = provider.key.id;
        if (globalProvidersMap[key]) {
          throw duplicatedGlobalTokenError(provider, [
            mod.id,
            globalProvidersMap[key],
          ]);
        }
        globalProvidersMap[key] = mod.id;
      }
    });
  });
  return globalProvidersMap;
}
export function attachGlobalProvidersMap({
  injector,
  globalProvidersMap,
  moduleInjectorGetter,
}) {
  injector._globalProvidersMap = {
    has(key) {
      return typeof globalProvidersMap[key] === 'string';
    },
    get(key) {
      return moduleInjectorGetter(globalProvidersMap[key]);
    },
  };
}
export function duplicatedGlobalTokenError(provider, modules) {
  return Error(
    [
      `Failed to define '${provider.key.displayName}' token as global.`,
      `Token provided by two modules: '${modules.join("', '")}'`,
    ].join(' ')
  );
}
//# sourceMappingURL=di.js.map
