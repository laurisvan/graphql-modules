import { __decorate, __metadata } from 'tslib';
import 'reflect-metadata';
import {
  createApplication,
  createModule,
  Injectable,
  Scope,
  ExecutionContext,
  gql,
  testkit,
} from '../src';
const posts = ['Foo', 'Bar'];
test('OnDestroy hook', async () => {
  const spies = {
    onDestroy: jest.fn(),
  };
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
  let PostsConnection = class PostsConnection {
    constructor() {
      this.id = Math.random();
    }
    all() {
      return posts;
    }
    onDestroy() {
      spies.onDestroy();
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
  expect(result1.data).toEqual(data);
  expect(spies.onDestroy).toBeCalledTimes(1);
  const result2 = await testkit.execute(app, {
    contextValue: createContext(),
    document,
  });
  expect(result2.data).toEqual(data);
  expect(spies.onDestroy).toBeCalledTimes(2);
});
//# sourceMappingURL=di-hooks.spec.js.map
