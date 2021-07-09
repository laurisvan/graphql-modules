import { ReflectiveInjector } from '../di/injector';
import { CONTEXT } from '../application/tokens';
import { readInjectableMetadata } from '../di/metadata';
export function testInjector(providers) {
  const resolvedProviders = ReflectiveInjector.resolve([
    { provide: CONTEXT, useValue: {} },
    ...providers,
  ]);
  const injector = ReflectiveInjector.createFromResolved({
    name: 'test',
    providers: resolvedProviders,
  });
  injector.instantiateAll();
  return injector;
}
export function readProviderOptions(provider) {
  return readInjectableMetadata(provider, true).options;
}
//# sourceMappingURL=test-injector.js.map
