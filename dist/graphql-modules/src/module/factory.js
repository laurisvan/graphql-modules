import { metadataFactory } from './metadata';
import { createResolvers } from './resolvers';
import { createTypeDefs } from './type-defs';
import { MODULE_ID } from './tokens';
import {
  ReflectiveInjector,
  onlySingletonProviders,
  onlyOperationProviders,
} from '../di';
import { resolveProviders } from './../di/resolution';
export function moduleFactory(config) {
  const typeDefs = createTypeDefs(config);
  const metadata = metadataFactory(typeDefs, config);
  const providers =
    typeof config.providers === 'function'
      ? config.providers()
      : config.providers;
  // Filter providers and keep them this way
  // so we don't do this filtering multiple times.
  // Providers don't change over time, so it's safe to do it.
  const operationProviders = ReflectiveInjector.resolve(
    onlyOperationProviders(providers)
  );
  const singletonProviders = ReflectiveInjector.resolve(
    onlySingletonProviders(providers)
  );
  const mod = {
    id: config.id,
    config,
    metadata,
    typeDefs,
    providers,
    operationProviders,
    singletonProviders,
    // Factory is called once on application creation,
    // before we even handle GraphQL Operation
    factory(app) {
      const resolvedModule = mod;
      resolvedModule.singletonProviders = singletonProviders;
      resolvedModule.operationProviders = operationProviders;
      // Create a  module-level Singleton injector
      const injector = ReflectiveInjector.createFromResolved({
        name: `Module "${config.id}" (Singleton Scope)`,
        providers: resolvedModule.singletonProviders.concat(
          resolveProviders([
            {
              // with module's id, useful in Logging and stuff
              provide: MODULE_ID,
              useValue: config.id,
            },
          ])
        ),
        parent: app.injector,
      });
      // We attach injector property to existing `mod` object
      // because we want to keep references
      // that are later on used in testing utils
      resolvedModule.injector = injector;
      // Create resolvers object based on module's config
      // It involves wrapping a resolver with middlewares
      // and other things like validation
      resolvedModule.resolvers = createResolvers(config, metadata, {
        middlewareMap: app.middlewares,
      });
      return resolvedModule;
    },
  };
  return mod;
}
//# sourceMappingURL=factory.js.map
