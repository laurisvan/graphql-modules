import { visit, Kind, concatAST } from 'graphql';
import { moduleFactory } from '../module/factory';
import { createApplication } from '../application/application';
import { createModule } from '../module/module';
export function mockModule(testedModule, overrideConfig) {
  const sourceProviders =
    typeof testedModule.config.providers === 'function'
      ? testedModule.config.providers()
      : testedModule.config.providers;
  const overrideProviders =
    typeof overrideConfig.providers === 'function'
      ? overrideConfig.providers()
      : overrideConfig.providers;
  const newModule = createModule({
    ...testedModule.config,
    providers: [...(sourceProviders || []), ...(overrideProviders || [])],
  });
  newModule['ɵoriginalModule'] = testedModule;
  return newModule;
}
export function testModule(testedModule, config) {
  var _a;
  const mod = transformModule(testedModule, config);
  const modules = [mod].concat(
    (_a = config === null || config === void 0 ? void 0 : config.modules) !==
      null && _a !== void 0
      ? _a
      : []
  );
  return createApplication({
    ...(config || {}),
    modules,
    providers: config === null || config === void 0 ? void 0 : config.providers,
    middlewares:
      config === null || config === void 0 ? void 0 : config.middlewares,
  });
}
function transformModule(mod, config) {
  const transforms = [];
  if (
    config === null || config === void 0 ? void 0 : config.replaceExtensions
  ) {
    transforms.push((m) =>
      moduleFactory({
        ...m.config,
        typeDefs: replaceExtensions(m.typeDefs),
      })
    );
  }
  if (config === null || config === void 0 ? void 0 : config.typeDefs) {
    transforms.push((m) =>
      moduleFactory({
        ...m.config,
        typeDefs: m.typeDefs.concat(config.typeDefs),
      })
    );
  }
  if (config === null || config === void 0 ? void 0 : config.inheritTypeDefs) {
    transforms.push((m) =>
      moduleFactory({
        ...m.config,
        typeDefs: inheritTypeDefs(m.typeDefs, config.inheritTypeDefs),
      })
    );
  }
  if (config === null || config === void 0 ? void 0 : config.resolvers) {
    transforms.push((m) => {
      const resolvers = m.config.resolvers
        ? Array.isArray(m.config.resolvers)
          ? m.config.resolvers
          : [m.config.resolvers]
        : [];
      return moduleFactory({
        ...m.config,
        resolvers: resolvers.concat(config.resolvers),
      });
    });
  }
  if (transforms) {
    return transforms.reduce((m, transform) => transform(m), mod);
  }
  return mod;
}
function inheritTypeDefs(originalTypeDefs, modules) {
  const original = concatAST(originalTypeDefs);
  const typeDefs = treeshakeTypesDefs(
    original,
    modules.reduce(
      (typeDefs, externalMod) => typeDefs.concat(externalMod.typeDefs),
      []
    )
  );
  return typeDefs;
}
function replaceExtensions(typeDefs) {
  const types = [];
  const extensions = [];
  // List all object types
  typeDefs.forEach((doc) => {
    visit(doc, {
      ObjectTypeDefinition(node) {
        types.push(node.name.value);
      },
    });
  });
  // turn object type extensions into object types
  return typeDefs.map((doc) => {
    return visit(doc, {
      ObjectTypeExtension(node) {
        // only if object type doesn't exist
        if (
          extensions.includes(node.name.value) ||
          types.includes(node.name.value)
        ) {
          return node;
        }
        return {
          ...node,
          kind: Kind.OBJECT_TYPE_DEFINITION,
        };
      },
    });
  });
}
function treeshakeTypesDefs(originalSource, sources) {
  const namedTypes = originalSource.definitions.filter(isNamedTypeDefinition);
  const typesToVisit = namedTypes.map((def) => def.name.value);
  const rootFields = namedTypes.reduce((acc, node) => {
    const typeName = node.name.value;
    if (isRootType(typeName) && hasFields(node)) {
      if (!acc[typeName]) {
        acc[typeName] = [];
      }
      node.fields.forEach((field) => {
        acc[typeName].push(field.name.value);
      });
    }
    return acc;
  }, {});
  const schema = concatAST([originalSource].concat(sources));
  const involvedTypes = new Set(visitTypes(schema, typesToVisit, rootFields));
  return {
    kind: Kind.DOCUMENT,
    definitions: schema.definitions.filter((def) => {
      var _a, _b;
      if (isNamedTypeDefinition(def)) {
        const typeName = def.name.value;
        if (!involvedTypes.has(def.name.value)) {
          return false;
        }
        if (
          (_a = rootFields[typeName]) === null || _a === void 0
            ? void 0
            : _a.length
        ) {
          const rootType = def;
          if (
            (_b = rootType.fields) === null || _b === void 0
              ? void 0
              : _b.every(
                  (field) => !rootFields[typeName].includes(field.name.value)
                )
          ) {
            return false;
          }
        }
      }
      return true;
    }),
  };
}
function isNamedTypeDefinition(def) {
  return (
    !!def &&
    def.kind !== Kind.SCHEMA_DEFINITION &&
    def.kind !== Kind.SCHEMA_EXTENSION
  );
}
function visitTypes(schema, types, rootFields) {
  const visitedTypes = [];
  const scalars = schema.definitions
    .filter(
      (def) =>
        def.kind === Kind.SCALAR_TYPE_DEFINITION ||
        def.kind === Kind.SCALAR_TYPE_EXTENSION
    )
    .map((def) => def.name.value);
  for (const typeName of types) {
    collectType(typeName);
  }
  return visitedTypes;
  function collectField(field, parentTypeName) {
    var _a;
    if (
      parentTypeName &&
      isRootType(parentTypeName) &&
      ((_a = rootFields[parentTypeName]) === null || _a === void 0
        ? void 0
        : _a.length) &&
      !rootFields[parentTypeName].includes(field.name.value)
    ) {
      return;
    }
    collectType(resolveType(field.type));
    if (field.arguments) {
      field.arguments.forEach((arg) => {
        collectType(resolveType(arg.type));
      });
    }
    if (field.directives) {
      field.directives.forEach((directive) => {
        collectType(directive.name.value);
      });
    }
  }
  function collectType(typeName) {
    if (visitedTypes.includes(typeName)) {
      return;
    }
    if (isScalar(typeName)) {
      visitedTypes.push(typeName);
      return;
    }
    const types = findTypes(typeName);
    visitedTypes.push(typeName);
    types.forEach((type) => {
      if (hasFields(type)) {
        type.fields.forEach((field) => {
          collectField(field, typeName);
        });
      }
      if (hasTypes(type)) {
        type.types.forEach((t) => {
          collectType(resolveType(t));
        });
      }
      if (hasInterfaces(type)) {
        type.interfaces.forEach((i) => {
          collectType(resolveType(i));
        });
      }
    });
  }
  function resolveType(type) {
    if (type.kind === 'ListType') {
      return resolveType(type.type);
    }
    if (type.kind === 'NonNullType') {
      return resolveType(type.type);
    }
    return type.name.value;
  }
  function isScalar(name) {
    return scalars
      .concat(['String', 'Boolean', 'Int', 'ID', 'Float'])
      .includes(name);
  }
  function findTypes(typeName) {
    const types = schema.definitions.filter(
      (def) => isNamedTypeDefinition(def) && def.name.value === typeName
    );
    if (!types.length) {
      throw new Error(`Missing type "${typeName}"`);
    }
    return types;
  }
}
function hasInterfaces(def) {
  return (
    hasPropValue(def, 'interfaces') &&
    [
      Kind.OBJECT_TYPE_DEFINITION,
      Kind.OBJECT_TYPE_EXTENSION,
      Kind.INTERFACE_TYPE_DEFINITION,
      Kind.INTERFACE_TYPE_EXTENSION,
    ].includes(def.kind)
  );
}
function hasTypes(def) {
  return (
    [Kind.UNION_TYPE_DEFINITION, Kind.UNION_TYPE_EXTENSION].includes(
      def.kind
    ) && hasPropValue(def, 'types')
  );
}
function hasFields(def) {
  return (
    [
      Kind.OBJECT_TYPE_DEFINITION,
      Kind.OBJECT_TYPE_EXTENSION,
      Kind.INTERFACE_TYPE_DEFINITION,
      Kind.INTERFACE_TYPE_EXTENSION,
      Kind.INPUT_OBJECT_TYPE_DEFINITION,
      Kind.INPUT_OBJECT_TYPE_EXTENSION,
    ].includes(def.kind) && hasPropValue(def, 'fields')
  );
}
function hasPropValue(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop) && obj[prop];
}
function isRootType(typeName) {
  return (
    typeName === 'Query' ||
    typeName === 'Mutation' ||
    typeName === 'Subscription'
  );
}
//# sourceMappingURL=test-module.js.map
