import { wrapSchema } from '@graphql-tools/wrap';
import { execute } from 'graphql';
import { uniqueId } from '../shared/utils';
const CONTEXT_ID = Symbol.for('context-id');
export function apolloExecutorCreator({ createExecution }) {
  return function createApolloExecutor(options) {
    const executor = createExecution(options);
    return function executorAdapter(requestContext) {
      return executor({
        schema: requestContext.schema,
        document: requestContext.document,
        operationName: requestContext.operationName,
        variableValues: requestContext.request.variables,
        contextValue: requestContext.context,
      });
    };
  };
}
export function apolloSchemaCreator({
  createSubscription,
  contextBuilder,
  schema,
}) {
  const createApolloSchema = () => {
    const sessions = {};
    const subscription = createSubscription();
    function getSession(ctx) {
      if (!ctx[CONTEXT_ID]) {
        ctx[CONTEXT_ID] = uniqueId((id) => !sessions[id]);
        const { context, ɵdestroy: destroy } = contextBuilder(ctx);
        sessions[ctx[CONTEXT_ID]] = {
          count: 0,
          session: {
            context,
            destroy() {
              if (--sessions[ctx[CONTEXT_ID]].count === 0) {
                destroy();
                delete sessions[ctx[CONTEXT_ID]];
                delete ctx[CONTEXT_ID];
              }
            },
          },
        };
      }
      sessions[ctx[CONTEXT_ID]].count++;
      return sessions[ctx[CONTEXT_ID]].session;
    }
    return wrapSchema({
      schema,
      executor(input) {
        // Create an execution context
        const { context, destroy } = getSession(input.context);
        // It's important to wrap the executeFn within a promise
        // so we can easily control the end of execution (with finally)
        return Promise.resolve()
          .then(() => {
            var _a;
            return execute({
              schema,
              document: input.document,
              contextValue: context,
              variableValues: input.variables,
              rootValue:
                (_a = input.info) === null || _a === void 0
                  ? void 0
                  : _a.rootValue,
            });
          })
          .finally(destroy);
      },
      subscriber(input) {
        var _a;
        return subscription({
          schema,
          document: input.document,
          variableValues: input.variables,
          contextValue: input.context,
          rootValue:
            (_a = input.info) === null || _a === void 0 ? void 0 : _a.rootValue,
        });
      },
    });
  };
  return createApolloSchema;
}
//# sourceMappingURL=apollo.js.map
