import { __decorate, __metadata, __param } from 'tslib';
import 'reflect-metadata';
import {
  createApplication,
  createModule,
  Injectable,
  Inject,
  InjectionToken,
  CONTEXT,
  MODULE_ID,
  Scope,
  gql,
  testkit,
} from '../src';
import { execute } from 'graphql';
import { ExecutionContext } from '../src/di';
const Test = new InjectionToken('test');
const posts = ['Foo', 'Bar'];
const comments = ['Comment #1', 'Comment #2'];
test('general test', async () => {
  const spies = {
    logger: jest.fn(),
    posts: {
      moduleId: jest.fn(),
      test: jest.fn(),
      postService: jest.fn(),
      eventService: jest.fn(),
    },
    comments: {
      moduleId: jest.fn(),
      test: jest.fn(),
      commentsService: jest.fn(),
    },
  };
  let Logger = class Logger {
    constructor() {
      spies.logger();
    }
    log() {}
  };
  Logger = __decorate(
    [
      Injectable({
        scope: Scope.Operation,
      }),
      __metadata('design:paramtypes', []),
    ],
    Logger
  );
  let Events = class Events {
    constructor() {
      spies.posts.eventService();
    }
    emit() {}
  };
  Events = __decorate(
    [
      Injectable({
        scope: Scope.Operation,
      }),
      __metadata('design:paramtypes', []),
    ],
    Events
  );
  let Posts = class Posts {
    constructor() {
      spies.posts.postService();
    }
    all() {
      return posts;
    }
  };
  Posts = __decorate(
    [Injectable(), __metadata('design:paramtypes', [])],
    Posts
  );
  let Comments = class Comments {
    constructor() {
      spies.comments.commentsService();
    }
    all() {
      return comments;
    }
  };
  Comments = __decorate(
    [Injectable(), __metadata('design:paramtypes', [])],
    Comments
  );
  // Child module
  const commonModule = createModule({
    id: 'common',
    typeDefs: gql`
      type Query {
        _noop: String
      }
    `,
  });
  // Child module
  const postsModule = createModule({
    id: 'posts',
    providers: [
      Posts,
      Events,
      {
        provide: Test,
        useValue: 'mod',
      },
    ],
    typeDefs: gql`
      type Post {
        title: String!
      }

      extend type Query {
        posts: [Post!]!
      }
    `,
    resolvers: {
      Query: {
        posts(_parent, __args, { injector }) {
          spies.posts.moduleId(injector.get(MODULE_ID));
          spies.posts.test(injector.get(Test));
          injector.get(Events).emit();
          injector.get(Logger).log();
          return injector.get(Posts).all();
        },
      },
      Post: {
        title: (title) => title,
      },
    },
  });
  // Child module
  const commentsModule = createModule({
    id: 'comments',
    providers: [Comments],
    typeDefs: gql`
      type Comment {
        text: String!
      }

      extend type Query {
        comments: [Comment!]!
      }
    `,
    resolvers: {
      Query: {
        comments(_parent, __args, { injector }) {
          spies.comments.moduleId(injector.get(MODULE_ID));
          spies.comments.test(injector.get(Test));
          injector.get(Logger).log();
          return injector.get(Comments).all();
        },
      },
      Comment: {
        text: (text) => text,
      },
    },
  });
  // root module as application
  const appModule = createApplication({
    modules: [commonModule, postsModule, commentsModule],
    providers: [
      Logger,
      {
        provide: Test,
        useValue: 'app',
      },
    ],
  });
  const createContext = () => ({ request: {}, response: {} });
  const document = gql`
    {
      comments {
        text
      }
      posts {
        title
      }
    }
  `;
  const result = await testkit.execute(appModule, {
    contextValue: createContext(),
    document,
  });
  // Should resolve data correctly
  expect(result.errors).toBeUndefined();
  expect(result.data).toEqual({
    comments: comments.map((text) => ({ text })),
    posts: posts.map((title) => ({ title })),
  });
  // Child Injector has priority over Parent Injector
  expect(spies.posts.test).toHaveBeenCalledWith('mod');
  expect(spies.comments.test).toHaveBeenCalledWith('app');
  // Value of MODULE_ID according to module's resolver
  expect(spies.posts.moduleId).toHaveBeenCalledWith('posts');
  expect(spies.comments.moduleId).toHaveBeenCalledWith('comments');
  await testkit.execute(appModule, {
    contextValue: createContext(),
    document,
  });
  // Singleton providers should be called once
  expect(spies.posts.postService).toHaveBeenCalledTimes(1);
  expect(spies.comments.commentsService).toHaveBeenCalledTimes(1);
  // Operation provider should be called twice
  expect(spies.posts.eventService).toHaveBeenCalledTimes(2);
  expect(spies.logger).toHaveBeenCalledTimes(2);
});
test('useFactory with dependecies', async () => {
  const logSpy = jest.fn();
  let Posts = class Posts {
    all() {
      const connection = this.context.injector.get(PostsConnection);
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
    ],
    Posts
  );
  class PostsConnection {
    constructor(logger) {
      logger.log();
    }
    all() {
      return posts;
    }
  }
  let Logger = class Logger {
    log() {
      logSpy();
    }
  };
  Logger = __decorate([Injectable()], Logger);
  const postsModule = createModule({
    id: 'posts',
    providers: [
      Logger,
      Posts,
      {
        provide: PostsConnection,
        scope: Scope.Operation,
        useFactory(logger) {
          return new PostsConnection(logger);
        },
        deps: [Logger],
      },
    ],
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
  expect(result1.data).toEqual(data);
  expect(logSpy).toHaveBeenCalledTimes(1);
  const result2 = await testkit.execute(app, {
    contextValue: createContext(),
    document,
  });
  expect(result2.data).toEqual(data);
  expect(logSpy).toHaveBeenCalledTimes(2);
});
test('Use @Inject decorator in constructor', async () => {
  const request = new Object();
  const requestSpy = jest.fn();
  let Auth = class Auth {
    constructor(context) {
      this.context = context;
    }
    ping() {
      requestSpy(this.context.request);
      return 'pong';
    }
  };
  Auth = __decorate(
    [
      Injectable({ scope: Scope.Operation }),
      __param(0, Inject(CONTEXT)),
      __metadata('design:paramtypes', [Object]),
    ],
    Auth
  );
  const mod = createModule({
    id: 'auth',
    providers: [Auth],
    typeDefs: gql`
      type Query {
        ping: String
      }
    `,
    resolvers: {
      Query: {
        ping(_, __, { injector }) {
          return injector.get(Auth).ping();
        },
      },
    },
  });
  const app = createApplication({ modules: [mod] });
  const result = await testkit.execute(app, {
    contextValue: { request },
    document: gql`
      {
        ping
      }
    `,
  });
  expect(result.errors).not.toBeDefined();
  expect(result.data).toEqual({ ping: 'pong' });
  expect(requestSpy).toHaveBeenCalledWith(request);
});
test('Use useFactory with deps', async () => {
  const request = new Object();
  const requestSpy = jest.fn();
  const REQUEST = new InjectionToken('request');
  let Auth = class Auth {
    constructor(request) {
      this.request = request;
    }
    ping() {
      requestSpy(this.request);
      return 'pong';
    }
  };
  Auth = __decorate(
    [
      Injectable({ scope: Scope.Operation }),
      __param(0, Inject(REQUEST)),
      __metadata('design:paramtypes', [Object]),
    ],
    Auth
  );
  const mod = createModule({
    id: 'auth',
    providers: [
      Auth,
      {
        provide: REQUEST,
        useFactory(ctx) {
          return ctx.request;
        },
        deps: [CONTEXT],
        scope: Scope.Operation,
      },
    ],
    typeDefs: gql`
      type Query {
        ping: String
      }
    `,
    resolvers: {
      Query: {
        ping(_, __, { injector }) {
          return injector.get(Auth).ping();
        },
      },
    },
  });
  const app = createApplication({ modules: [mod] });
  const result = await testkit.execute(app, {
    contextValue: { request },
    document: gql`
      {
        ping
      }
    `,
  });
  expect(result.errors).not.toBeDefined();
  expect(result.data).toEqual({ ping: 'pong' });
  expect(requestSpy).toHaveBeenCalledWith(request);
});
test('Application allows injector access', () => {
  let SomeProvider = class SomeProvider {};
  SomeProvider = __decorate([Injectable()], SomeProvider);
  const { injector } = createApplication({
    modules: [],
    providers: [SomeProvider],
  });
  expect(injector.get(SomeProvider)).toBeInstanceOf(SomeProvider);
});
test('Operation scoped provider should be created once per GraphQL Operation', async () => {
  const constructorSpy = jest.fn();
  const loadSpy = jest.fn();
  let Dataloader = class Dataloader {
    constructor(context) {
      constructorSpy(context);
    }
    load(id) {
      loadSpy(id);
      return {
        id,
        title: 'Sample Title',
      };
    }
  };
  Dataloader = __decorate(
    [
      Injectable({
        scope: Scope.Operation,
      }),
      __param(0, Inject(CONTEXT)),
      __metadata('design:paramtypes', [Object]),
    ],
    Dataloader
  );
  const postsModule = createModule({
    id: 'posts',
    providers: [Dataloader],
    typeDefs: gql`
      type Post {
        id: Int!
        title: String!
      }

      type Query {
        post(id: Int!): Post!
      }
    `,
    resolvers: {
      Query: {
        post(_parent, args, { injector }) {
          return injector.get(Dataloader).load(args.id);
        },
      },
    },
  });
  const app = createApplication({
    modules: [postsModule],
  });
  const contextValue = { request: {}, response: {} };
  const document = gql`
    {
      foo: post(id: 1) {
        id
        title
      }
      bar: post(id: 1) {
        id
        title
      }
    }
  `;
  const result = await testkit.execute(app, {
    contextValue,
    document,
  });
  // Should resolve data correctly
  expect(result.errors).toBeUndefined();
  expect(result.data).toEqual({
    foo: {
      id: 1,
      title: 'Sample Title',
    },
    bar: {
      id: 1,
      title: 'Sample Title',
    },
  });
  expect(constructorSpy).toHaveBeenCalledTimes(1);
  expect(constructorSpy).toHaveBeenCalledWith(
    expect.objectContaining(contextValue)
  );
  expect(loadSpy).toHaveBeenCalledTimes(2);
  expect(loadSpy).toHaveBeenCalledWith(1);
});
test('Operation scoped provider should be created once per GraphQL Operation (Apollo Server)', async () => {
  const constructorSpy = jest.fn();
  const loadSpy = jest.fn();
  let Dataloader = class Dataloader {
    constructor(context) {
      constructorSpy(context);
    }
    load(id) {
      loadSpy(id);
      return {
        id,
        title: 'Sample Title',
      };
    }
  };
  Dataloader = __decorate(
    [
      Injectable({
        scope: Scope.Operation,
      }),
      __param(0, Inject(CONTEXT)),
      __metadata('design:paramtypes', [Object]),
    ],
    Dataloader
  );
  const postsModule = createModule({
    id: 'posts',
    providers: [Dataloader],
    typeDefs: gql`
      type Post {
        id: Int!
        title: String!
      }

      type Query {
        post(id: Int!): Post!
      }
    `,
    resolvers: {
      Query: {
        post(_parent, args, { injector }) {
          return injector.get(Dataloader).load(args.id);
        },
      },
    },
  });
  const app = createApplication({
    modules: [postsModule],
  });
  const schema = app.createSchemaForApollo();
  const contextValue = { request: {}, response: {} };
  const document = gql`
    {
      foo: post(id: 1) {
        id
        title
      }
      bar: post(id: 1) {
        id
        title
      }
    }
  `;
  const result = await execute({
    schema,
    contextValue,
    document,
  });
  // Should resolve data correctly
  expect(result.errors).toBeUndefined();
  expect(result.data).toEqual({
    foo: {
      id: 1,
      title: 'Sample Title',
    },
    bar: {
      id: 1,
      title: 'Sample Title',
    },
  });
  expect(constructorSpy).toHaveBeenCalledTimes(1);
  expect(constructorSpy).toHaveBeenCalledWith(
    expect.objectContaining(contextValue)
  );
  expect(loadSpy).toHaveBeenCalledTimes(2);
  expect(loadSpy).toHaveBeenCalledWith(1);
});
test('Singleton scoped provider should be created once', async () => {
  const constructorSpy = jest.fn();
  let Data = class Data {
    constructor() {
      constructorSpy();
    }
    lorem() {
      return 'ipsum';
    }
  };
  Data = __decorate(
    [
      Injectable({
        scope: Scope.Singleton,
      }),
      __metadata('design:paramtypes', []),
    ],
    Data
  );
  const mod = createModule({
    id: 'mod',
    // providers: [Data],
    typeDefs: gql`
      type Query {
        lorem: String!
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
  const document = gql`
    {
      lorem
    }
  `;
  const execution = app.createExecution();
  const result1 = await execution({
    schema: app.schema,
    contextValue,
    document,
  });
  expect(result1.errors).toBeUndefined();
  expect(result1.data).toEqual({
    lorem: 'ipsum',
  });
  expect(constructorSpy).toHaveBeenCalledTimes(1);
  const result2 = await execution({
    schema: app.schema,
    contextValue,
    document,
  });
  expect(result2.errors).toBeUndefined();
  expect(result2.data).toEqual({
    lorem: 'ipsum',
  });
  expect(constructorSpy).toHaveBeenCalledTimes(1);
});
test('Global Token provided by one module should be accessible by other modules (operation)', async () => {
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
  const app = createApplication({
    modules: [fooModule, barModule],
  });
  const contextValue = { request: {}, response: {} };
  const document = gql`
    {
      foo
      bar
    }
  `;
  const result = await testkit.execute(app, {
    contextValue,
    document,
  });
  expect(result.errors).toBeUndefined();
  expect(result.data).toEqual({
    foo: 'ipsum',
    bar: 'ipsum',
  });
});
test('Global Token (module) should use other local tokens (operation)', async () => {
  const LogLevel = new InjectionToken('log-level');
  const logger = jest.fn();
  let Data = class Data {
    constructor(logLevel) {
      this.logLevel = logLevel;
    }
    lorem() {
      logger(this.logLevel);
      return 'ipsum';
    }
  };
  Data = __decorate(
    [
      Injectable({
        scope: Scope.Operation,
        global: true,
      }),
      __param(0, Inject(LogLevel)),
      __metadata('design:paramtypes', [String]),
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
    providers: [Data, { provide: LogLevel, useValue: 'info' }],
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
    providers: [
      {
        provide: LogLevel,
        useValue: 'error',
        scope: Scope.Operation,
      },
    ],
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
  const app = createApplication({
    modules: [fooModule, barModule],
    providers: [
      AppData,
      {
        provide: LogLevel,
        useValue: 'verbose',
        scope: Scope.Operation,
      },
    ],
  });
  const contextValue = { request: {}, response: {} };
  const document = gql`
    {
      foo
      bar
    }
  `;
  const result = await testkit.execute(app, {
    contextValue,
    document,
  });
  expect(result.errors).toBeUndefined();
  expect(result.data).toEqual({
    foo: 'ipsum',
    bar: 'ipsum',
  });
  expect(logger).toHaveBeenCalledTimes(2);
  expect(logger).toHaveBeenNthCalledWith(1, 'info');
  expect(logger).toHaveBeenNthCalledWith(2, 'info');
});
test('Global Token provided by one module should be accessible by other modules (singleton)', async () => {
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
  const app = createApplication({
    modules: [fooModule, barModule],
    providers: [AppData],
  });
  const contextValue = { request: {}, response: {} };
  const document = gql`
    {
      foo
      bar
    }
  `;
  const result = await testkit.execute(app, {
    contextValue,
    document,
  });
  expect(result.errors).toBeUndefined();
  expect(result.data).toEqual({
    foo: 'ipsum',
    bar: 'ipsum',
  });
});
test('Global Token (module) should use other local tokens (singleton)', async () => {
  const LogLevel = new InjectionToken('log-level');
  const logger = jest.fn();
  let Data = class Data {
    constructor(logLevel) {
      this.logLevel = logLevel;
    }
    lorem() {
      logger(this.logLevel);
      return 'ipsum';
    }
  };
  Data = __decorate(
    [
      Injectable({
        scope: Scope.Singleton,
        global: true,
      }),
      __param(0, Inject(LogLevel)),
      __metadata('design:paramtypes', [String]),
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
    providers: [Data, { provide: LogLevel, useValue: 'info' }],
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
    providers: [
      {
        provide: LogLevel,
        useValue: 'error',
      },
    ],
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
  const app = createApplication({
    modules: [fooModule, barModule],
    providers: [
      AppData,
      {
        provide: LogLevel,
        useValue: 'verbose',
      },
    ],
  });
  const contextValue = { request: {}, response: {} };
  const document = gql`
    {
      foo
      bar
    }
  `;
  const result = await testkit.execute(app, {
    contextValue,
    document,
  });
  expect(result.errors).toBeUndefined();
  expect(result.data).toEqual({
    foo: 'ipsum',
    bar: 'ipsum',
  });
  expect(logger).toHaveBeenCalledTimes(2);
  expect(logger).toHaveBeenNthCalledWith(1, 'info');
  expect(logger).toHaveBeenNthCalledWith(2, 'info');
});
test('instantiate all singleton providers', async () => {
  const spies = {
    logger: jest.fn(),
    data: jest.fn(),
    appData: jest.fn(),
  };
  let MyLogger = class MyLogger {
    constructor() {
      spies.logger();
    }
  };
  MyLogger = __decorate(
    [Injectable(), __metadata('design:paramtypes', [])],
    MyLogger
  );
  let Data = class Data {
    constructor(logger) {
      spies.data(logger);
    }
    value() {
      return 'foo';
    }
  };
  Data = __decorate(
    [Injectable(), __metadata('design:paramtypes', [MyLogger])],
    Data
  );
  let AppData = class AppData {
    constructor() {
      spies.appData();
    }
  };
  AppData = __decorate(
    [Injectable(), __metadata('design:paramtypes', [])],
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
          return injector.get(Data).value();
        },
      },
    },
  });
  const app = createApplication({
    modules: [fooModule],
    providers: [AppData, MyLogger],
  });
  // make sure all providers are instantiated
  expect(spies.logger).toBeCalledTimes(1);
  expect(spies.data).toBeCalledTimes(1);
  expect(spies.appData).toBeCalledTimes(1);
  const contextValue = { request: {}, response: {} };
  const document = gql`
    {
      foo
    }
  `;
  const result = await testkit.execute(app, {
    contextValue,
    document,
  });
  expect(result.errors).toBeUndefined();
  expect(result.data).toEqual({
    foo: 'foo',
  });
  // make sure no providers are instantiated again
  expect(spies.logger).toBeCalledTimes(1);
  expect(spies.data).toBeCalledTimes(1);
  expect(spies.appData).toBeCalledTimes(1);
});
test('instantiate all singleton and global providers', async () => {
  const spies = {
    logger: jest.fn(),
    data: jest.fn(),
    appData: jest.fn(),
  };
  let MyLogger = class MyLogger {
    constructor() {
      spies.logger();
    }
  };
  MyLogger = __decorate(
    [Injectable(), __metadata('design:paramtypes', [])],
    MyLogger
  );
  let Data = class Data {
    constructor(logger) {
      spies.data(logger);
    }
    value() {
      return 'foo';
    }
  };
  Data = __decorate(
    [
      Injectable({
        global: true,
      }),
      __metadata('design:paramtypes', [MyLogger]),
    ],
    Data
  );
  let AppData = class AppData {
    constructor() {
      spies.appData();
    }
  };
  AppData = __decorate(
    [Injectable(), __metadata('design:paramtypes', [])],
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
        foo() {},
      },
    },
  });
  const barModule = createModule({
    id: 'bar',
    typeDefs: gql`
      extend type Query {
        bar: String!
      }
    `,
    resolvers: {
      Query: {
        bar(_parent, _args, { injector }) {
          return injector.get(Data).value();
        },
      },
    },
  });
  const app = createApplication({
    modules: [fooModule, barModule],
    providers: [AppData, MyLogger],
  });
  // make sure all providers are instantiated
  expect(spies.logger).toBeCalledTimes(1);
  expect(spies.data).toBeCalledTimes(1);
  expect(spies.appData).toBeCalledTimes(1);
  const contextValue = { request: {}, response: {} };
  const document = gql`
    {
      bar
    }
  `;
  const result = await testkit.execute(app, {
    contextValue,
    document,
  });
  expect(result.errors).toBeUndefined();
  expect(result.data).toEqual({
    bar: 'foo',
  });
  // make sure no providers are instantiated again
  expect(spies.logger).toBeCalledTimes(1);
  expect(spies.data).toBeCalledTimes(1);
  expect(spies.appData).toBeCalledTimes(1);
});
//# sourceMappingURL=di-providers.spec.js.map
