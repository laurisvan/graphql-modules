import { __decorate, __metadata, __param } from 'tslib';
import 'reflect-metadata';
import {
  ReflectiveInjector,
  InjectionToken,
  Injectable,
  Inject,
  forwardRef,
} from '../src/di';
import { createApplication, createModule, Scope, gql, testkit } from '../src';
import { stringify } from '../src/di/utils';
test('No Injectable error', () => {
  class NoAnnotations {
    // @ts-ignore
    constructor(dep) {}
  }
  expect(() => ReflectiveInjector.resolve([NoAnnotations])).toThrowError(
    `Missing @Injectable decorator for 'NoAnnotations'`
  );
});
test('No Annotation error', () => {
  let Data = class Data {};
  Data = __decorate([Injectable()], Data);
  let NoAnnotations = class NoAnnotations {
    // @ts-ignore
    constructor(data, dep) {}
  };
  NoAnnotations = __decorate(
    [Injectable(), __metadata('design:paramtypes', [Data, Object])],
    NoAnnotations
  );
  expect(() => ReflectiveInjector.resolve([NoAnnotations])).toThrowError(
    `Cannot resolve all parameters for 'NoAnnotations'(Data, ?). Make sure that all the parameters are decorated with Inject or have valid type annotations and that 'NoAnnotations' is decorated with Injectable.`
  );
});
test('Circular dependencies error', () => {
  const Foo = new InjectionToken('Foo');
  const Bar = new InjectionToken('Bar');
  const injector = ReflectiveInjector.createFromResolved({
    name: 'main',
    providers: ReflectiveInjector.resolve([
      {
        provide: Foo,
        useFactory(bar) {
          return `foo + ${bar}`;
        },
        deps: [Bar],
      },
      {
        provide: Bar,
        useFactory(foo) {
          return `bar + ${foo}`;
        },
        deps: [Foo],
      },
    ]),
  });
  expect(() => injector.get(Foo)).toThrowError(
    'Cannot instantiate cyclic dependency! (InjectionToken Foo -> InjectionToken Bar -> InjectionToken Foo)'
  );
});
test('fail on circular dependencies', async () => {
  const fooSpy = jest.fn();
  const barSpy = jest.fn();
  let Foo = class Foo {
    constructor(bar) {
      fooSpy(bar);
    }
  };
  Foo = __decorate(
    [
      Injectable({
        scope: Scope.Singleton,
      }),
      __param(0, Inject(forwardRef(() => Bar))),
      __metadata('design:paramtypes', [Object]),
    ],
    Foo
  );
  let Bar = class Bar {
    constructor(foo) {
      barSpy(foo);
    }
  };
  Bar = __decorate(
    [
      Injectable({
        scope: Scope.Singleton,
      }),
      __param(0, Inject(forwardRef(() => Foo))),
      __metadata('design:paramtypes', [Object]),
    ],
    Bar
  );
  const providers = ReflectiveInjector.resolve([Foo, Bar]);
  const injector = ReflectiveInjector.createFromResolved({
    name: 'main',
    providers,
  });
  expect(() => {
    injector.get(Foo);
  }).toThrowError(
    `Cannot instantiate cyclic dependency! (${stringify(Foo)} -> ${stringify(
      Bar
    )} -> ${stringify(Foo)})`
  );
});
test('No provider error', () => {
  const Foo = new InjectionToken('Foo');
  const injector = ReflectiveInjector.createFromResolved({
    name: 'main',
    providers: [],
  });
  expect(() => injector.get(Foo)).toThrowError(
    'No provider for InjectionToken Foo'
  );
});
test('Instantiation error', () => {
  const Foo = new InjectionToken('Foo');
  const injector = ReflectiveInjector.createFromResolved({
    name: 'main',
    providers: ReflectiveInjector.resolve([
      {
        provide: Foo,
        useFactory() {
          throw new Error('expected error');
        },
      },
    ]),
  });
  expect(() => injector.get(Foo)).toThrowError(
    'Error during instantiation of InjectionToken Foo: expected error - in main'
  );
});
test('Invalid provider error', () => {
  expect(() =>
    ReflectiveInjector.createFromResolved({
      name: 'main',
      providers: ReflectiveInjector.resolve([true]),
    })
  ).toThrowError(
    'Invalid provider - only instances of Provider and Type are allowed, got: true'
  );
});
test('No error in case of module without providers', async () => {
  let Data = class Data {
    lorem() {
      return 'ipsum';
    }
  };
  Data = __decorate(
    [
      Injectable({
        scope: Scope.Operation,
      }),
    ],
    Data
  );
  const mod = createModule({
    id: 'lorem',
    typeDefs: gql`
      type Query {
        lorem: String
      }
    `,
    resolvers: {
      Query: {
        lorem(_parent, _args, { injector }) {
          return injector.get(Data).lorem();
        },
      },
    },
  });
  const app = createApplication({
    modules: [mod],
    providers: [Data],
  });
  const contextValue = { request: {}, response: {} };
  const result = await testkit.execute(app, {
    contextValue,
    document: gql`
      {
        lorem
      }
    `,
  });
  // Should resolve data correctly
  expect(result.errors).toBeUndefined();
  expect(result.data).toEqual({
    lorem: 'ipsum',
  });
});
test('Make sure we have readable error', async () => {
  let P1 = class P1 {
    value() {
      return 'foo';
    }
  };
  P1 = __decorate([Injectable({ scope: Scope.Singleton })], P1);
  let P2 = class P2 {
    constructor(p1) {
      this.p1 = p1;
    }
    value() {
      return this.p1.value();
    }
  };
  P2 = __decorate(
    [
      Injectable({ scope: Scope.Singleton }),
      __metadata('design:paramtypes', [P1]),
    ],
    P2
  );
  const m1 = createModule({
    id: 'm1',
    providers: [P1],
    typeDefs: gql`
      type Query {
        m1: String
      }
    `,
  });
  const m2 = createModule({
    id: 'm2',
    providers: [P2],
    typeDefs: gql`
      extend type Query {
        m2: String
      }
    `,
    resolvers: {
      Query: {
        m2(_parent, _args, { injector }) {
          return injector.get(P2).value();
        },
      },
    },
  });
  expect(() => createApplication({ modules: [m2, m1] })).toThrowError(
    'No provider for P1! (P2 -> P1) - in Module "m2" (Singleton Scope)'
  );
});
test('Detect collision of two identical global providers (singleton)', async () => {
  let Data = class Data {
    lorem() {
      return 'ipsum';
    }
  };
  Data = __decorate(
    [
      Injectable({
        scope: Scope.Singleton,
        global: true,
      }),
    ],
    Data
  );
  let AppData = class AppData {
    constructor(data) {
      this.data = data;
    }
    ispum() {
      return this.data.lorem();
    }
  };
  AppData = __decorate(
    [
      Injectable({
        scope: Scope.Singleton,
      }),
      __metadata('design:paramtypes', [Data]),
    ],
    AppData
  );
  const fooModule = createModule({
    id: 'foo',
    providers: [Data],
    typeDefs: gql`
      type Query {
        foo: String!
      }
    `,
    resolvers: {
      Query: {
        foo(_parent, _args, { injector }) {
          return injector.get(Data).lorem();
        },
      },
    },
  });
  const barModule = createModule({
    id: 'bar',
    providers: [Data],
    typeDefs: gql`
      extend type Query {
        bar: String!
      }
    `,
    resolvers: {
      Query: {
        bar(_parent, _args, { injector }) {
          return injector.get(Data).lorem();
        },
      },
    },
  });
  expect(() => {
    createApplication({
      modules: [fooModule, barModule],
      providers: [AppData],
    });
  }).toThrowError(
    `Failed to define 'Data' token as global. Token provided by two modules: 'bar', 'foo'`
  );
});
test('Detect collision of two identical global providers (operation)', async () => {
  let Data = class Data {
    lorem() {
      return 'ipsum';
    }
  };
  Data = __decorate(
    [
      Injectable({
        scope: Scope.Operation,
        global: true,
      }),
    ],
    Data
  );
  let AppData = class AppData {
    constructor(data) {
      this.data = data;
    }
    ispum() {
      return this.data.lorem();
    }
  };
  AppData = __decorate(
    [
      Injectable({
        scope: Scope.Operation,
      }),
      __metadata('design:paramtypes', [Data]),
    ],
    AppData
  );
  const fooModule = createModule({
    id: 'foo',
    providers: [Data],
    typeDefs: gql`
      type Query {
        foo: String!
      }
    `,
    resolvers: {
      Query: {
        foo(_parent, _args, { injector }) {
          return injector.get(Data).lorem();
        },
      },
    },
  });
  const barModule = createModule({
    id: 'bar',
    providers: [Data],
    typeDefs: gql`
      extend type Query {
        bar: String!
      }
    `,
    resolvers: {
      Query: {
        bar(_parent, _args, { injector }) {
          return injector.get(Data).lorem();
        },
      },
    },
  });
  expect(() => {
    createApplication({
      modules: [fooModule, barModule],
      providers: [AppData],
    });
  }).toThrowError(
    `Failed to define 'Data' token as global. Token provided by two modules: 'bar', 'foo'`
  );
});
//# sourceMappingURL=di-errors.spec.js.map
