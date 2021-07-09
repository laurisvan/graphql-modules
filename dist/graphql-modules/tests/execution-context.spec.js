import { __decorate, __metadata } from 'tslib';
import 'reflect-metadata';
import {
  createApplication,
  createModule,
  Injectable,
  Scope,
  ExecutionContext,
  gql,
  InjectionToken,
  testkit,
} from '../src';
const posts = ['Foo', 'Bar'];
test('ExecutionContext on module level provider', async () => {
  const spies = {
    posts: jest.fn(),
    connection: jest.fn(),
    connectionId: jest.fn(),
  };
  let Posts = class Posts {
    constructor() {
      spies.posts();
    }
    all() {
      const connection = this.context.injector.get(PostsConnection);
      spies.connectionId(connection.id);
      return connection.all();
    }
  };
  __decorate(
    [ExecutionContext(), __metadata('design:type', Object)],
    Posts.prototype,
    'context',
    void 0
  );
  Posts = __decorate(
    [
      Injectable({
        scope: Scope.Singleton,
      }),
      __metadata('design:paramtypes', []),
    ],
    Posts
  );
  let PostsConnection = class PostsConnection {
    constructor() {
      spies.connection();
      this.id = Math.random();
    }
    all() {
      return posts;
    }
  };
  PostsConnection = __decorate(
    [
      Injectable({
        scope: Scope.Operation,
      }),
      __metadata('design:paramtypes', []),
    ],
    PostsConnection
  );
  const postsModule = createModule({
    id: 'posts',
    providers: [Posts, PostsConnection],
    typeDefs: gql`
      type Post {
        title: String!
      }

      type Query {
        posts: [Post!]!
      }
    `,
    resolvers: {
      Query: {
        posts(_parent, __args, { injector }) {
          return injector.get(Posts).all();
        },
      },
      Post: {
        title: (title) => title,
      },
    },
  });
  const app = createApplication({
    modules: [postsModule],
  });
  const createContext = () => ({ request: {}, response: {} });
  const document = gql`
    {
      posts {
        title
      }
    }
  `;
  const data = {
    posts: posts.map((title) => ({ title })),
  };
  const result1 = await testkit.execute(app, {
    contextValue: createContext(),
    document,
  });
  expect(result1.errors).toBeUndefined();
  expect(result1.data).toEqual(data);
  const result2 = await testkit.execute(app, {
    contextValue: createContext(),
    document,
  });
  expect(result2.errors).toBeUndefined();
  expect(result2.data).toEqual(data);
  expect(spies.posts).toBeCalledTimes(1);
  expect(spies.connection).toBeCalledTimes(2);
  expect(spies.connectionId).toBeCalledTimes(2);
  // ExecutionContext accessed in two executions
  // should equal two different connections
  expect(spies.connectionId.mock.calls[0][0]).not.toEqual(
    spies.connectionId.mock.calls[1][0]
  );
});
test('ExecutionContext on application level provider', async () => {
  const spies = {
    posts: jest.fn(),
    connection: jest.fn(),
    connectionId: jest.fn(),
  };
  let Posts = class Posts {
    constructor() {
      spies.posts();
    }
    all() {
      const connection = this.context.injector.get(PostsConnection);
      spies.connectionId(connection.id);
      return connection.all();
    }
  };
  __decorate(
    [ExecutionContext(), __metadata('design:type', Object)],
    Posts.prototype,
    'context',
    void 0
  );
  Posts = __decorate(
    [
      Injectable({
        scope: Scope.Singleton,
      }),
      __metadata('design:paramtypes', []),
    ],
    Posts
  );
  let PostsConnection = class PostsConnection {
    constructor() {
      spies.connection();
      this.id = Math.random();
    }
    all() {
      return posts;
    }
  };
  PostsConnection = __decorate(
    [
      Injectable({
        scope: Scope.Operation,
      }),
      __metadata('design:paramtypes', []),
    ],
    PostsConnection
  );
  const postsModule = createModule({
    id: 'posts',
    typeDefs: gql`
      type Post {
        title: String!
      }

      type Query {
        posts: [Post!]!
      }
    `,
    resolvers: {
      Query: {
        posts(_parent, __args, { injector }) {
          return injector.get(Posts).all();
        },
      },
      Post: {
        title: (title) => title,
      },
    },
  });
  const app = createApplication({
    modules: [postsModule],
    providers: [Posts, PostsConnection],
  });
  const createContext = () => ({ request: {}, response: {} });
  const document = gql`
    {
      posts {
        title
      }
    }
  `;
  const data = {
    posts: posts.map((title) => ({ title })),
  };
  const result1 = await testkit.execute(app, {
    contextValue: createContext(),
    document,
  });
  expect(result1.data).toEqual(data);
  const result2 = await testkit.execute(app, {
    contextValue: createContext(),
    document,
  });
  expect(result2.data).toEqual(data);
  expect(spies.posts).toBeCalledTimes(1);
  expect(spies.connection).toBeCalledTimes(2);
  expect(spies.connectionId).toBeCalledTimes(2);
  // ExecutionContext accessed in two executions
  // should equal two different connections
  expect(spies.connectionId.mock.calls[0][0]).not.toEqual(
    spies.connectionId.mock.calls[1][0]
  );
});
test('ExecutionContext on module level global provider', async () => {
  const spies = {
    posts: jest.fn(),
    executionContext: jest.fn(),
  };
  let Posts = class Posts {
    constructor() {
      spies.posts();
    }
    all() {
      spies.executionContext(this.context);
      return [];
    }
  };
  __decorate(
    [ExecutionContext(), __metadata('design:type', Object)],
    Posts.prototype,
    'context',
    void 0
  );
  Posts = __decorate(
    [
      Injectable({
        scope: Scope.Singleton,
        global: true,
      }),
      __metadata('design:paramtypes', []),
    ],
    Posts
  );
  const postsModule = createModule({
    id: 'posts',
    typeDefs: gql`
      type Post {
        title: String!
      }

      type Query {
        posts: [Post!]!
      }
    `,
    resolvers: {
      Query: {
        posts(_parent, __args, { injector }) {
          return injector.get(Posts).all();
        },
      },
      Post: {
        title: (title) => title,
      },
    },
    providers: [Posts],
  });
  const app = createApplication({
    modules: [postsModule],
  });
  const createContext = () => ({ request: {}, response: {} });
  const document = gql`
    {
      posts {
        title
      }
    }
  `;
  const expectedData = {
    posts: [],
  };
  const contextValue = createContext();
  const result = await testkit.execute(app, {
    contextValue,
    document,
  });
  expect(result.data).toEqual(expectedData);
  expect(spies.posts).toBeCalledTimes(1);
  expect(spies.executionContext).toHaveBeenCalledTimes(1);
  expect(spies.executionContext).toHaveBeenCalledWith(
    expect.objectContaining(contextValue)
  );
});
test('ExecutionContext on application level global provider', async () => {
  const spies = {
    posts: jest.fn(),
    executionContext: jest.fn(),
  };
  let Posts = class Posts {
    constructor() {
      spies.posts();
    }
    all() {
      spies.executionContext(this.context);
      return [];
    }
  };
  __decorate(
    [ExecutionContext(), __metadata('design:type', Object)],
    Posts.prototype,
    'context',
    void 0
  );
  Posts = __decorate(
    [
      Injectable({
        scope: Scope.Singleton,
        global: true,
      }),
      __metadata('design:paramtypes', []),
    ],
    Posts
  );
  const postsModule = createModule({
    id: 'posts',
    typeDefs: gql`
      type Post {
        title: String!
      }

      type Query {
        posts: [Post!]!
      }
    `,
    resolvers: {
      Query: {
        posts(_parent, __args, { injector }) {
          return injector.get(Posts).all();
        },
      },
      Post: {
        title: (title) => title,
      },
    },
  });
  const app = createApplication({
    modules: [postsModule],
    providers: [Posts],
  });
  const createContext = () => ({ noop() {} });
  const document = gql`
    {
      posts {
        title
      }
    }
  `;
  const expectedData = {
    posts: [],
  };
  const contextValue = createContext();
  const result = await testkit.execute(app, {
    contextValue,
    document,
  });
  expect(result.data).toEqual(expectedData);
  expect(spies.posts).toBeCalledTimes(1);
  expect(spies.executionContext).toHaveBeenCalledTimes(1);
  expect(spies.executionContext).toHaveBeenCalledWith(
    expect.objectContaining(contextValue)
  );
});
test('accessing a singleton provider with execution context in another singleton provider', async () => {
  const spies = {
    foo: jest.fn(),
    bar: jest.fn(),
  };
  const Name = new InjectionToken('name');
  let Foo = class Foo {
    constructor() {
      spies.foo();
    }
    getName() {
      return this.context.injector.get(Name);
    }
  };
  __decorate(
    [ExecutionContext(), __metadata('design:type', Object)],
    Foo.prototype,
    'context',
    void 0
  );
  Foo = __decorate(
    [
      Injectable({
        scope: Scope.Singleton,
      }),
      __metadata('design:paramtypes', []),
    ],
    Foo
  );
  let Bar = class Bar {
    constructor(foo) {
      this.foo = foo;
      spies.bar(foo);
    }
    getName() {
      return this.foo.getName();
    }
  };
  Bar = __decorate(
    [
      Injectable({
        scope: Scope.Singleton,
      }),
      __metadata('design:paramtypes', [Foo]),
    ],
    Bar
  );
  const mod = createModule({
    id: 'mod',
    providers: [Foo, Bar],
    typeDefs: gql`
      type Query {
        getName: String
        getDependencyName: String
      }
    `,
    resolvers: {
      Query: {
        getName: (_a, _b, { injector }) => injector.get(Foo).getName(),
        getDependencyName: (_a, _b, { injector }) =>
          injector.get(Bar).getName(),
      },
    },
  });
  const expectedName = 'works';
  const app = createApplication({
    modules: [mod],
    providers: [
      {
        provide: Name,
        useValue: expectedName,
      },
    ],
  });
  const result = await testkit.execute(app, {
    contextValue: {},
    document: gql`
      {
        getName
        getDependencyName
      }
    `,
  });
  expect(spies.bar).toHaveBeenCalledTimes(1);
  expect(spies.foo).toHaveBeenCalledTimes(1);
  expect(result.errors).not.toBeDefined();
  expect(result.data).toEqual({
    getName: expectedName,
    getDependencyName: expectedName,
  });
});
//# sourceMappingURL=execution-context.spec.js.map
