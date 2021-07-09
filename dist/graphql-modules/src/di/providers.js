import { readInjectableMetadata } from './metadata';
export const Type = Function;
/// @ts-ignore
export class InjectionToken {
  constructor(_desc) {
    this._desc = _desc;
  }
  toString() {
    return `InjectionToken ${this._desc}`;
  }
}
export function isToken(v) {
  return v && v instanceof InjectionToken;
}
export function isType(v) {
  return typeof v === 'function' && v !== Object;
}
export var Scope;
(function (Scope) {
  Scope[(Scope['Singleton'] = 0)] = 'Singleton';
  Scope[(Scope['Operation'] = 1)] = 'Operation';
})(Scope || (Scope = {}));
export function onlySingletonProviders(providers = []) {
  return providers.filter((provider) => {
    if (isType(provider)) {
      const { options } = readInjectableMetadata(provider, true);
      return (
        (options === null || options === void 0 ? void 0 : options.scope) !==
        Scope.Operation
      );
    } else {
      return provider.scope !== Scope.Operation;
    }
  });
}
export function onlyOperationProviders(providers = []) {
  return providers.filter((provider) => {
    if (isType(provider)) {
      const { options } = readInjectableMetadata(provider, true);
      return (
        (options === null || options === void 0 ? void 0 : options.scope) ===
        Scope.Operation
      );
    } else {
      return provider.scope === Scope.Operation;
    }
  });
}
export function isClassProvider(provider) {
  return typeof provider.useClass !== 'undefined';
}
export function isFactoryProvider(provider) {
  return typeof provider.useFactory !== 'undefined';
}
//# sourceMappingURL=providers.js.map
