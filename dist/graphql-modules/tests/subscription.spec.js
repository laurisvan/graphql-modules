import { __decorate, __metadata } from 'tslib';
import 'reflect-metadata';
import {
  createApplication,
  createModule,
  Injectable,
  Scope,
  gql,
} from '../src';
import { PubSub } from 'graphql-subscriptions';
test('Operation-Scope provider instantiated on every subscription', async () => {
  const spies = {
    posts: jest.fn(),
  };
  let Posts = class Posts {
    constructor(pubsub) {
      this.pubsub = pubsub;
      spies.posts();
    }
    all() {
      return [];
    }
    add(title) {
      setTimeout(() => {
        this.pubsub.publish('MESSAGE', title);
      }, 0);
      return title;
    }
    listen() {
      return this.pubsub.asyncIterator(['MESSAGE']);
    }
  };
  Posts = __decorate(
    [
      Injectable({
        scope: Scope.Operation,
      }),
      __metadata('design:paramtypes', [PubSub]),
    ],
    Posts
  );
  const pubsub = new PubSub();
  const postsModule = createModule({
    id: 'posts',
    providers: [
      Posts,
      {
        provide: PubSub,
        useValue: pubsub,
      },
    ],
    typeDefs: gql`
      type Post {
        title: String!
      }

      type Query {
        posts: [Post!]!
      }

      type Mutation {
        addPost(title: String!): Post!
      }

      type Subscription {
        onPost: Post!
      }
    `,
    resolvers: {
      Query: {
        posts() {},
      },
      Mutation: {
        addPost(_parent, args, { injector }) {
          return injector.get(Posts).add(args.title);
        },
      },
      Subscription: {
        onPost: {
          subscribe(_parent, _args, { injector }) {
            return injector.get(Posts).listen();
          },
          resolve(title) {
            return title;
          },
        },
      },
      Post: {
        title: (title) => title,
      },
    },
  });
  const newTitle = 'new-title';
  const app = createApplication({
    modules: [postsModule],
  });
  const createContext = () => ({});
  const mutation = gql`
    mutation addPost($title: String!) {
      addPost(title: $title) {
        title
      }
    }
  `;
  const subscription = gql`
    subscription onPost {
      onPost {
        title
      }
    }
  `;
  const execute = app.createExecution();
  const subscribe = app.createSubscription();
  const sub = await subscribe({
    schema: app.schema,
    contextValue: createContext(),
    document: subscription,
  });
  await execute({
    schema: app.schema,
    contextValue: createContext(),
    variableValues: {
      title: newTitle,
    },
    document: mutation,
  });
  await execute({
    schema: app.schema,
    contextValue: createContext(),
    variableValues: {
      title: newTitle,
    },
    document: mutation,
  });
  let receivedEvents = [];
  for await (let event of sub) {
    receivedEvents.push(event);
    if (receivedEvents.length === 2) {
      break;
    }
  }
  expect(receivedEvents[0].data).toEqual({
    onPost: {
      title: newTitle,
    },
  });
  expect(receivedEvents[1].data).toEqual({
    onPost: {
      title: newTitle,
    },
  });
  expect(spies.posts).toBeCalledTimes(3);
});
//# sourceMappingURL=subscription.spec.js.map
