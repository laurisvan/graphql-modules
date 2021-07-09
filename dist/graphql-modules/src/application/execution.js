import { execute } from 'graphql';
import { isNotSchema } from '../shared/utils';
export function executionCreator({ contextBuilder }) {
  const createExecution = (options) => {
    // Custom or original execute function
    const executeFn =
      (options === null || options === void 0 ? void 0 : options.execute) ||
      execute;
    return (
      argsOrSchema,
      document,
      rootValue,
      contextValue,
      variableValues,
      operationName,
      fieldResolver,
      typeResolver
    ) => {
      var _a;
      // Create an execution context
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
      const executionArgs = isNotSchema(argsOrSchema)
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
            typeResolver,
          };
      // It's important to wrap the executeFn within a promise
      // so we can easily control the end of execution (with finally)
      return Promise.resolve()
        .then(() => executeFn(executionArgs))
        .finally(destroy);
    };
  };
  return createExecution;
}
//# sourceMappingURL=execution.js.map
