import { __decorate, __metadata, __param } from 'tslib';
import 'reflect-metadata';
import { concatAST } from 'graphql';
import {
  createApplication,
  createModule,
  testkit,
  gql,
  Injectable,
  Inject,
  InjectionToken,
  CONTEXT,
  Scope,
} from '../src';
describe('testModule', () => {
  test('should replace extensions with definitions on demand', () => {
    const initialModule = createModule({
      id: 'tested',
      typeDefs: gql`
        extend type Query {
          foo: Foo!
        }

        type Foo {
          id: ID
        }
      `,
    });
    expect(() =>
      testkit.testModule(initialModule, {
        replaceExtensions: true,
      })
    ).not.toThrow();
  });
  test('should add typeDefs to a module on demand', () => {
    const initialModule = createModule({
      id: 'tested',
      typeDefs: gql`
        type Query {
          foo: Foo!
        }
      `,
    });
    expect(() =>
      testkit.testModule(initialModule, {
        typeDefs: gql`
          type Foo {
            id: ID
          }
        `,
      })
    ).not.toThrow();
  });
  test('should add resolvers to a module on demand', async () => {
    const initialModule = createModule({
      id: 'tested',
      typeDefs: gql`
        type Query {
          foo: Foo!
        }

        type Foo {
          id: ID
        }
      `,
      resolvers: {
        Query: {
          foo() {
            return {
              id: 'not-mocked',
            };
          },
        },
      },
    });
    const app = testkit.testModule(initialModule, {
      resolvers: {
        Foo: {
          id() {
            return 'mocked';
          },
        },
      },
    });
    const result = await testkit.execute(app, {
      document: gql`
        {
          foo {
            id
          }
        }
      `,
    });
    expect(result.data).toEqual({
      foo: {
        id: 'mocked',
      },
    });
  });
  test('should overwrite providers in a module on demand', async () => {
    let Data = class Data {
      getById(id) {
        return {
          id,
        };
      }
    };
    Data = __decorate(
      [
        Injectable({
          scope: Scope.Singleton,
        }),
      ],
      Data
    );
    const initialModule = createModule({
      id: 'tested',
      typeDefs: gql`
        type Query {
          foo(id: ID!): Foo!
        }

        type Foo {
          id: ID
        }
      `,
      resolvers: {
        Query: {
          foo(_, { id }, { injector }) {
            return injector.get(Data).getById(id);
          },
        },
      },
    });
    const app = testkit.testModule(initialModule, {
      providers: [
        {
          provide: Data,
          useValue: {
            getById() {
              return {
                id: 'mocked',
              };
            },
          },
        },
      ],
    });
    const result = await testkit.execute(app, {
      document: gql`
        {
          foo(id: "not-mocked") {
            id
          }
        }
      `,
    });
    expect(result.errors).not.toBeDefined();
    expect(result.data).toEqual({
      foo: {
        id: 'mocked',
      },
    });
  });
  test('should inherit typeDefs from other modules', () => {
    const initialModule = createModule({
      id: 'tested',
      typeDefs: gql`
        type Query {
          foo: Foo!
          bar: Bar!
        }
      `,
    });
    const externalModule = createModule({
      id: 'external',
      typeDefs: gql`
        type Bar {
          id: ID!
        }
      `,
    });
    expect(() =>
      testkit.testModule(initialModule, {
        typeDefs: gql`
          type Foo {
            id: ID
          }
        `,
        inheritTypeDefs: [externalModule],
      })
    ).not.toThrow();
  });
  test('should inherit typeDefs from other modules and do tree-shaking of types', () => {
    const initialModule = createModule({
      id: 'tested',
      typeDefs: gql`
        type Query {
          foo: Foo!
          bar: Bar!
        }
      `,
    });
    const externalModule = createModule({
      id: 'external',
      typeDefs: gql`
        type Bar {
          id: ID!
        }

        extend type Query {
          unused: Unused
        }

        type Unused {
          id: ID!
        }
      `,
    });
    const app = testkit.testModule(initialModule, {
      typeDefs: gql`
        type Foo {
          id: ID
        }
      `,
      inheritTypeDefs: [externalModule],
    });
    const typeDefs = concatAST(app.typeDefs);
    expect(
      typeDefs.definitions.find(
        (def) =>
          (def === null || def === void 0 ? void 0 : def.name.value) ===
          'Unused'
      )
    ).toBeUndefined();
  });
});
describe('execute', () => {
  test('should work with TypedDocumentNode', async () => {
    var _a;
    const mod = createModule({
      id: 'tested',
      typeDefs: gql`
        type Query {
          foo(id: ID!): Foo!
        }

        type Foo {
          id: ID
        }
      `,
      resolvers: {
        Query: {
          foo(_, { id }) {
            return {
              id,
            };
          },
        },
      },
    });
    const app = createApplication({ modules: [mod] });
    const query = gql`
      query getFoo($id: String!) {
        foo(id: $id) {
          id
        }
      }
    `;
    const result = await testkit.execute(app, {
      document: query,
      variableValues: {
        id: 'foo',
      },
    });
    expect(result.errors).not.toBeDefined();
    expect(
      (_a = result.data) === null || _a === void 0 ? void 0 : _a.foo.id
    ).toEqual('foo');
  });
});
describe('testInjector', () => {
  test('should provide an empty context', () => {
    let Data = class Data {
      constructor(context) {
        this.context = context;
      }
      getById(id) {
        return {
          ...this.context,
          id,
        };
      }
    };
    Data = __decorate(
      [
        Injectable({
          scope: Scope.Singleton,
        }),
        __param(0, Inject(CONTEXT)),
        __metadata('design:paramtypes', [Object]),
      ],
      Data
    );
    const injector = testkit.testInjector([Data]);
    const data = injector.get(Data).getById('mocked');
    expect(data.id).toEqual('mocked');
    expect(Object.keys(data)).toHaveLength(1);
  });
  test('should instantiate all providers', () => {
    const UNKNOWN = new InjectionToken('UNKNOWN-TOKEN');
    let Data = class Data {
      constructor(missing) {
        this.missing = missing;
      }
      getById(id) {
        return {
          ...this.missing,
          id,
        };
      }
    };
    Data = __decorate(
      [
        Injectable({
          scope: Scope.Singleton,
        }),
        __param(0, Inject(UNKNOWN)),
        __metadata('design:paramtypes', [Object]),
      ],
      Data
    );
    expect(() => testkit.testInjector([Data])).toThrowError(/UNKNOWN-TOKEN/);
  });
});
describe('readProviderOptions', () => {
  test('should instantiate all providers', () => {
    let Data = class Data {
      getById(id) {
        return {
          id,
        };
      }
    };
    Data = __decorate(
      [
        Injectable({
          scope: Scope.Singleton,
        }),
      ],
      Data
    );
    const options = testkit.readProviderOptions(Data);
    expect(
      options === null || options === void 0 ? void 0 : options.scope
    ).toBe(Scope.Singleton);
    expect(
      options === null || options === void 0 ? void 0 : options.global
    ).not.toBe(true);
    expect(
      options === null || options === void 0
        ? void 0
        : options.executionContextIn
    ).not.toBeDefined();
  });
});
describe('mockApplication', () => {
  test('should be able to add providers to Application', async () => {
    const ENV = new InjectionToken('environment');
    let Config = class Config {
      constructor(env) {
        this.env = env;
      }
      getEnv() {
        return this.env;
      }
    };
    Config = __decorate(
      [
        Injectable(),
        __param(0, Inject(ENV)),
        __metadata('design:paramtypes', [String]),
      ],
      Config
    );
    const envModule = createModule({
      id: 'env',
      typeDefs: gql`
        type Query {
          env: String!
        }
      `,
      resolvers: {
        Query: {
          env(_source, _args, context) {
            return context.injector.get(Config).getEnv();
          },
        },
      },
    });
    const originalApp = createApplication({
      providers: [
        Config,
        {
          provide: ENV,
          useValue: 'production',
        },
      ],
      modules: [envModule],
    });
    const app = testkit.mockApplication(originalApp).addProviders([
      {
        provide: ENV,
        useValue: 'testing',
      },
    ]);
    const result = await testkit.execute(app, {
      document: gql`
        {
          env
        }
      `,
    });
    expect(result.errors).not.toBeDefined();
    expect(result.data).toEqual({
      env: 'testing',
    });
  });
  test('should be able to replace a module', async () => {
    let Config = class Config {
      getEnv() {
        return 'production';
      }
    };
    Config = __decorate([Injectable()], Config);
    const envModule = createModule({
      id: 'env',
      typeDefs: gql`
        type Query {
          env: String!
        }
      `,
      resolvers: {
        Query: {
          env(_source, _args, context) {
            return context.injector.get(Config).getEnv();
          },
        },
      },
    });
    const originalApp = createApplication({
      providers: [Config],
      modules: [envModule],
    });
    const app = testkit.mockApplication(originalApp).replaceModule(
      testkit.mockModule(envModule, {
        providers: [
          {
            provide: Config,
            useValue: {
              getEnv() {
                return 'mocked';
              },
            },
          },
        ],
      })
    );
    const result = await testkit.execute(app, {
      document: gql`
        {
          env
        }
      `,
    });
    expect(result.errors).not.toBeDefined();
    expect(result.data).toEqual({
      env: 'mocked',
    });
  });
  test('should replace operation-scoped provider in a module', async () => {
    let Config = class Config {
      getEnv() {
        return 'production';
      }
    };
    Config = __decorate(
      [
        Injectable({
          scope: Scope.Operation,
          global: true,
        }),
      ],
      Config
    );
    const envModule = createModule({
      id: 'env',
      typeDefs: gql`
        type Query {
          env: String!
        }
      `,
      resolvers: {
        Query: {
          env(_source, _args, context) {
            return context.injector.get(Config).getEnv();
          },
        },
      },
      providers: [Config],
    });
    const extraModule = createModule({
      id: 'extra',
      typeDefs: gql`
        extend type Query {
          extraEnv: String!
        }
      `,
      resolvers: {
        Query: {
          extraEnv(_source, _args, context) {
            return context.injector.get(Config).getEnv();
          },
        },
      },
    });
    const NOOP = new InjectionToken('noop');
    const originalApp = createApplication({
      providers: [
        {
          provide: NOOP,
          useValue: 'initial',
        },
      ],
      modules: [envModule, extraModule],
    });
    const app = testkit
      .mockApplication(originalApp)
      .replaceModule(
        testkit.mockModule(envModule, {
          providers: [
            {
              provide: Config,
              useValue: {
                getEnv() {
                  return 'mocked';
                },
              },
              scope: Scope.Operation,
              global: true,
            },
          ],
        })
      )
      .addProviders([
        {
          provide: NOOP,
          useValue: 'mocked',
        },
      ]);
    const result = await testkit.execute(app, {
      document: gql`
        {
          env
          extraEnv
        }
      `,
    });
    expect(result.errors).not.toBeDefined();
    expect(result.data).toEqual({
      env: 'mocked',
      extraEnv: 'mocked',
    });
  });
});
//# sourceMappingURL=testing.spec.js.map