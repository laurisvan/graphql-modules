import { Kind } from 'graphql';
import { NonDocumentNodeError, useLocation } from '../shared/errors';
/**
 * Create a list of DocumentNode objects based on Module's config.
 * Add a location, so we get richer errors.
 */
export function createTypeDefs(config) {
  const typeDefs = Array.isArray(config.typeDefs)
    ? config.typeDefs
    : [config.typeDefs];
  ensureDocumentNode(config, typeDefs);
  return typeDefs;
}
function ensureDocumentNode(config, typeDefs) {
  function ensureEach(doc, i) {
    if (
      (doc === null || doc === void 0 ? void 0 : doc.kind) !== Kind.DOCUMENT
    ) {
      throw new NonDocumentNodeError(
        `Expected parsed document but received ${typeof doc} at index ${i} in typeDefs list`,
        useLocation(config)
      );
    }
  }
  typeDefs.forEach(ensureEach);
}
//# sourceMappingURL=type-defs.js.map
