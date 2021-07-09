import { share } from '../shared/utils';
export function mockApplication(app) {
  function mockedFactory(newConfig) {
    const sharedFactory = share(() => app.ɵfactory(newConfig));
    return {
      get typeDefs() {
        return sharedFactory().typeDefs;
      },
      get resolvers() {
        return sharedFactory().resolvers;
      },
      get schema() {
        return sharedFactory().schema;
      },
      get injector() {
        return sharedFactory().injector;
      },
      createOperationController(options) {
        return sharedFactory().createOperationController(options);
      },
      createSubscription(options) {
        return sharedFactory().createSubscription(options);
      },
      createExecution(options) {
        return sharedFactory().createExecution(options);
      },
      createSchemaForApollo() {
        return sharedFactory().createSchemaForApollo();
      },
      createApolloExecutor() {
        return sharedFactory().createApolloExecutor();
      },
      get ɵfactory() {
        return sharedFactory().ɵfactory;
      },
      get ɵconfig() {
        return sharedFactory().ɵconfig;
      },
      replaceModule(newModule) {
        const config = sharedFactory().ɵconfig;
        return mockedFactory({
          ...config,
          modules: config.modules.map((mod) =>
            mod.id === newModule.ɵoriginalModule.id ? newModule : mod
          ),
        });
      },
      addProviders(newProviders) {
        const config = sharedFactory().ɵconfig;
        const existingProviders =
          typeof config.providers === 'function'
            ? config.providers()
            : config.providers;
        const providers = Array.isArray(existingProviders)
          ? existingProviders.concat(newProviders)
          : newProviders;
        return mockedFactory({
          ...config,
          providers,
        });
      },
    };
  }
  return mockedFactory();
}
//# sourceMappingURL=test-application.js.map
