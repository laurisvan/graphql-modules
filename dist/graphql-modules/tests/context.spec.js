import { __decorate, __metadata, __param } from 'tslib';
import 'reflect-metadata';
import {
  createApplication,
  createModule,
  Injectable,
  Inject,
  CONTEXT,
  Scope,
  gql,
  testkit,
} from '../src';
test('Global context and module context should be reachable', async () => {
  const constructorSpy = jest.fn();
  const providerContext = jest.fn();
  const resolverContext = jest.fn();
  const middlewareContext = jest.fn();
  let PostProvider = class PostProvider {
    constructor(context) {
      this.context = context;
      constructorSpy(context);
    }
    post(id) {
      providerContext(this.context);
      return Promise.resolve({
        id: id,
        title: 'Sample Title',
      });
    }
  };
  PostProvider = __decorate(
    [
      Injectable({
        scope: Scope.Operation,
      }),
      __param(0, Inject(CONTEXT)),
      __metadata('design:paramtypes', [Object]),
    ],
    PostProvider
  );
  const postsModule = createModule({
    id: 'posts',
    providers: [PostProvider],
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
        post(_parent, args, { injector, ...context }) {
          resolverContext(context);
          return injector.get(PostProvider).post(args.id);
        },
      },
    },
    middlewares: {
      Query: {
        post: [
          async ({ context }, next) => {
            // mutate context
            context.postRegion = 1234;
            middlewareContext(context);
            return next();
          },
        ],
      },
    },
  });
  const app = createApplication({
    modules: [postsModule],
  });
  const contextValue = () => ({
    locale: 'nl_NL',
    token: 'foo',
  });
  const result = await testkit.execute(app, {
    document: gql`
      {
        post(id: 1) {
          id
          title
        }
      }
    `,
    contextValue: contextValue(),
  });
  expect(result.errors).toBeUndefined();
  expect(result.data).toEqual({
    post: {
      id: 1,
      title: 'Sample Title',
    },
  });
  expect(constructorSpy).toHaveBeenCalledTimes(1);
  expect(constructorSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      locale: 'nl_NL',
      token: 'foo',
    })
  );
  expect(providerContext).toHaveBeenCalledWith(
    expect.objectContaining({
      locale: 'nl_NL',
      postRegion: 1234,
    })
  );
  expect(middlewareContext).toHaveBeenCalledWith(
    expect.objectContaining({
      moduleId: 'posts',
      postRegion: 1234,
    })
  );
  expect(resolverContext).toHaveBeenCalledWith(
    expect.objectContaining({ postRegion: 1234 })
  );
});
//# sourceMappingURL=context.spec.js.map
