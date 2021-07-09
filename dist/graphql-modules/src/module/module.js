import { moduleFactory } from './factory';
/**
 * @api
 * Creates a Module, an element used by Application. Accepts `ModuleConfig`.
 *
 * @example
 *
 * ```typescript
 * import { createModule, gql } from 'graphql-modules';
 *
 * export const usersModule = createModule({
 *   id: 'users',
 *   typeDefs: gql`
 *     // GraphQL SDL
 *   `,
 *   resolvers: {
 *     // ...
 *   }
 * });
 * ```
 */
export function createModule(config) {
  return moduleFactory(config);
}
//# sourceMappingURL=module.js.map
