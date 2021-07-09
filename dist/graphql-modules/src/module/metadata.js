import { visit, Kind } from 'graphql';
export function metadataFactory(typeDefs, config) {
  const implemented = {};
  const extended = {};
  function collectObjectDefinition(node) {
    if (!implemented[node.name.value]) {
      implemented[node.name.value] = [];
    }
    if (node.fields && node.fields.length > 0) {
      implemented[node.name.value].push(
        ...node.fields.map((field) => field.name.value)
      );
    }
    if (node.kind === Kind.OBJECT_TYPE_DEFINITION) {
      implemented[node.name.value].push('__isTypeOf');
    }
    if (node.kind === Kind.OBJECT_TYPE_DEFINITION) {
      implemented[node.name.value].push('__resolveReference');
      implemented[node.name.value].push('__resolveObject');
    }
    if (node.kind === Kind.INTERFACE_TYPE_DEFINITION) {
      implemented[node.name.value].push('__resolveType');
    }
  }
  function collectObjectExtension(node) {
    if (node.fields) {
      if (!extended[node.name.value]) {
        extended[node.name.value] = [];
      }
      node.fields.forEach((field) => {
        extended[node.name.value].push(field.name.value);
      });
    }
  }
  for (const doc of typeDefs) {
    visit(doc, {
      // Object
      ObjectTypeDefinition(node) {
        collectObjectDefinition(node);
      },
      ObjectTypeExtension(node) {
        collectObjectExtension(node);
      },
      // Interface
      InterfaceTypeDefinition(node) {
        collectObjectDefinition(node);
      },
      InterfaceTypeExtension(node) {
        collectObjectExtension(node);
      },
      // Union
      UnionTypeDefinition(node) {
        if (!implemented[node.name.value]) {
          implemented[node.name.value] = [];
        }
        if (node.types) {
          implemented[node.name.value].push(
            ...node.types.map((type) => type.name.value)
          );
        }
        implemented[node.name.value].push('__resolveType');
      },
      UnionTypeExtension(node) {
        if (node.types) {
          if (!extended[node.name.value]) {
            extended[node.name.value] = [];
          }
          extended[node.name.value].push(
            ...node.types.map((type) => type.name.value)
          );
        }
      },
      // Input
      InputObjectTypeDefinition(node) {
        collectObjectDefinition(node);
      },
      InputObjectTypeExtension(node) {
        collectObjectExtension(node);
      },
      // Enum
      EnumTypeDefinition(node) {
        if (node.values) {
          if (!implemented[node.name.value]) {
            implemented[node.name.value] = [];
          }
          implemented[node.name.value].push(
            ...node.values.map((value) => value.name.value)
          );
        }
      },
      EnumTypeExtension(node) {
        if (node.values) {
          if (!extended[node.name.value]) {
            extended[node.name.value] = [];
          }
          extended[node.name.value].push(
            ...node.values.map((value) => value.name.value)
          );
        }
      },
      // Scalar
      ScalarTypeDefinition(node) {
        if (!implemented.__scalars) {
          implemented.__scalars = [];
        }
        implemented.__scalars.push(node.name.value);
      },
    });
  }
  return {
    id: config.id,
    typeDefs,
    implements: implemented,
    extends: extended,
    dirname: config.dirname,
  };
}
//# sourceMappingURL=metadata.js.map
