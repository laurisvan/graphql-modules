import { __decorate } from 'tslib';
import 'reflect-metadata';
import {
  createApplication,
  createModule,
  gql,
  testkit,
  Injectable,
  Scope,
} from '../src';
test('should share context and injection', async () => {
  let Data = class Data {
    constructor() {
      this.enabled = true;
    }
    enable() {
      this.enabled = true;
    }
    disable() {
      this.enabled = false;
    }
  };
  Data = __decorate([Injectable({ scope: Scope.Operation })], Data);
  const mod = createModule({
    id: 'test',
    typeDefs: [
      gql`
        type Query {
          enabled: Boolean
        }
      `,
    ],
    resolvers: {
      Query: {
        enabled(_, __, { injector }) {
          return injector.get(Data).enabled;
        },
      },
    },
  });
  const app = createApplication({
    modules: [mod],
    providers: [Data],
  });
  const controller = app.createOperationController({
    context: {},
  });
  const data = controller.injector.get(Data);
  const query = {
    document: gql`
      {
        enabled
      }
    `,
  };
  expect(
    await testkit.execute(app, query, {
      controller,
    })
  ).toMatchObject({
    data: {
      enabled: true,
    },
  });
  data.disable();
  expect(
    await testkit.execute(app, query, {
      controller,
    })
  ).toMatchObject({
    data: {
      enabled: false,
    },
  });
});
test('execution should not destroy operation', async () => {
  const destroySpy = jest.fn();
  let Data = class Data {
    constructor() {
      this.enabled = true;
    }
    enable() {
      this.enabled = true;
    }
    disable() {
      this.enabled = false;
    }
    onDestroy() {
      destroySpy();
    }
  };
  Data = __decorate([Injectable({ scope: Scope.Operation })], Data);
  const mod = createModule({
    id: 'test',
    typeDefs: [
      gql`
        type Query {
          enabled: Boolean
        }
      `,
    ],
    resolvers: {
      Query: {
        enabled(_, __, { injector }) {
          return injector.get(Data).enabled;
        },
      },
    },
  });
  const app = createApplication({
    modules: [mod],
    providers: [Data],
  });
  const controller = app.createOperationController({
    context: {},
  });
  const query = {
    document: gql`
      {
        enabled
      }
    `,
  };
  await testkit.execute(app, query, {
    controller,
  });
  expect(destroySpy).not.toHaveBeenCalled();
  controller.destroy();
  expect(destroySpy).toHaveBeenCalledTimes(1);
});
test('autoDestroy enabled should destroy operation after execution', async () => {
  const destroySpy = jest.fn();
  let Data = class Data {
    constructor() {
      this.enabled = true;
    }
    enable() {
      this.enabled = true;
    }
    disable() {
      this.enabled = false;
    }
    onDestroy() {
      destroySpy();
    }
  };
  Data = __decorate([Injectable({ scope: Scope.Operation })], Data);
  const mod = createModule({
    id: 'test',
    typeDefs: [
      gql`
        type Query {
          enabled: Boolean
        }
      `,
    ],
    resolvers: {
      Query: {
        enabled(_, __, { injector }) {
          return injector.get(Data).enabled;
        },
      },
    },
  });
  const app = createApplication({
    modules: [mod],
    providers: [Data],
  });
  const controller = app.createOperationController({
    context: {},
    autoDestroy: true,
  });
  const query = {
    document: gql`
      {
        enabled
      }
    `,
  };
  await testkit.execute(app, query, {
    controller,
  });
  expect(destroySpy).toHaveBeenCalledTimes(1);
});
//# sourceMappingURL=operation-controller.spec.js.map
