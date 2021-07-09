import { ReflectiveInjector } from '../di';
import { once, merge } from '../shared/utils';
import { attachGlobalProvidersMap } from './di';
import { CONTEXT } from './tokens';
import { executionContext } from './execution-context';
export function createContextBuilder({
  appInjector,
  modulesMap,
  appLevelOperationProviders,
  singletonGlobalProvidersMap,
  operationGlobalProvidersMap,
}) {
  // This is very critical. It creates an execution context.
  // It has to run on every operation.
  const contextBuilder = (context) => {
    // Cache for context per module
    let contextCache = {};
    // A list of providers with OnDestroy hooks
    // It's a tuple because we want to know which Injector controls the provider
    // and we want to know if the provider was even instantiated.
    let providersToDestroy = [];
    function registerProvidersToDestroy(injector) {
      injector._providers.forEach((provider) => {
        if (provider.factory.hasOnDestroyHook) {
          // keep provider key's id (it doesn't change over time)
          // and related injector
          providersToDestroy.push([injector, provider.key.id]);
        }
      });
    }
    let appContext;
    attachGlobalProvidersMap({
      injector: appInjector,
      globalProvidersMap: singletonGlobalProvidersMap,
      moduleInjectorGetter(moduleId) {
        return modulesMap.get(moduleId).injector;
      },
    });
    appInjector.setExecutionContextGetter(
      executionContext.getApplicationContext
    );
    function createModuleExecutionContextGetter(moduleId) {
      return function moduleExecutionContextGetter() {
        return executionContext.getModuleContext(moduleId);
      };
    }
    modulesMap.forEach((mod, moduleId) => {
      mod.injector.setExecutionContextGetter(
        createModuleExecutionContextGetter(moduleId)
      );
    });
    const executionContextPicker = {
      getApplicationContext() {
        return appContext;
      },
      getModuleContext(moduleId) {
        return getModuleContext(moduleId, context);
      },
    };
    executionContext.create(executionContextPicker);
    // As the name of the Injector says, it's an Operation scoped Injector
    // Application level
    // Operation scoped - means it's created and destroyed on every GraphQL Operation
    const operationAppInjector = ReflectiveInjector.createFromResolved({
      name: 'App (Operation Scope)',
      providers: appLevelOperationProviders.concat(
        ReflectiveInjector.resolve([
          {
            provide: CONTEXT,
            useValue: context,
          },
        ])
      ),
      parent: appInjector,
    });
    // Create a context for application-level ExecutionContext
    appContext = merge(context, {
      injector: operationAppInjector,
    });
    // Track Providers with OnDestroy hooks
    registerProvidersToDestroy(operationAppInjector);
    function getModuleContext(moduleId, ctx) {
      var _a;
      // Reuse a context or create if not available
      if (!contextCache[moduleId]) {
        // We're interested in operation-scoped providers only
        const providers =
          (_a = modulesMap.get(moduleId)) === null || _a === void 0
            ? void 0
            : _a.operationProviders;
        // Create module-level Operation-scoped Injector
        const operationModuleInjector = ReflectiveInjector.createFromResolved({
          name: `Module "${moduleId}" (Operation Scope)`,
          providers: providers.concat(
            ReflectiveInjector.resolve([
              {
                provide: CONTEXT,
                useFactory() {
                  return contextCache[moduleId];
                },
              },
            ])
          ),
          // This injector has a priority
          parent: modulesMap.get(moduleId).injector,
          // over this one
          fallbackParent: operationAppInjector,
        });
        // Same as on application level, we need to collect providers with OnDestroy hooks
        registerProvidersToDestroy(operationModuleInjector);
        contextCache[moduleId] = merge(ctx, {
          injector: operationModuleInjector,
          moduleId,
        });
      }
      return contextCache[moduleId];
    }
    const sharedContext = merge(
      // We want to pass the received context
      context || {},
      {
        // Here's something very crutial
        // It's a function that is used in module's context creation
        ɵgetModuleContext: getModuleContext,
      }
    );
    attachGlobalProvidersMap({
      injector: operationAppInjector,
      globalProvidersMap: operationGlobalProvidersMap,
      moduleInjectorGetter(moduleId) {
        return getModuleContext(moduleId, sharedContext).injector;
      },
    });
    return {
      ɵdestroy: once(() => {
        providersToDestroy.forEach(([injector, keyId]) => {
          // If provider was instantiated
          if (injector._isObjectDefinedByKeyId(keyId)) {
            // call its OnDestroy hook
            injector._getObjByKeyId(keyId).onDestroy();
          }
        });
        contextCache = {};
      }),
      ɵinjector: operationAppInjector,
      context: sharedContext,
    };
  };
  return contextBuilder;
}
//# sourceMappingURL=context.js.map
