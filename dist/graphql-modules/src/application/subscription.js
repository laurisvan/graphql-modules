import { subscribe } from 'graphql';
import {
  tapAsyncIterator,
  isAsyncIterable,
  isNotSchema,
} from '../shared/utils';
export function subscriptionCreator({ contextBuilder }) {
  const createSubscription = (options) => {
    // Custom or original subscribe function
    const subscribeFn =
      (options === null || options === void 0 ? void 0 : options.subscribe) ||
      subscribe;
    return (
      argsOrSchema,
      document,
      rootValue,
      contextValue,
      variableValues,
      operationName,
      fieldResolver,
      subscribeFieldResolver
    ) => {
      var _a;
      // Create an subscription context
      const { context, ɵdestroy: destroy } =
        (_a =
          options === null || options === void 0
            ? void 0
            : options.controller) !== null && _a !== void 0
          ? _a
          : contextBuilder(
              isNotSchema(argsOrSchema)
                ? argsOrSchema.contextValue
                : contextValue
            );
      const subscriptionArgs = isNotSchema(argsOrSchema)
        ? {
            ...argsOrSchema,
            contextValue: context,
          }
        : {
            schema: argsOrSchema,
            document: document,
            rootValue,
            contextValue: context,
            variableValues,
            operationName,
            fieldResolver,
            subscribeFieldResolver,
          };
      let isIterable = false;
      // It's important to wrap the subscribeFn within a promise
      // so we can easily control the end of subscription (with finally)
      return Promise.resolve()
        .then(() => subscribeFn(subscriptionArgs))
        .then((sub) => {
          if (isAsyncIterable(sub)) {
            isIterable = true;
            return tapAsyncIterator(sub, destroy);
          }
          return sub;
        })
        .finally(() => {
          if (!isIterable) {
            destroy();
          }
        });
    };
  };
  return createSubscription;
}
//# sourceMappingURL=subscription.js.map
