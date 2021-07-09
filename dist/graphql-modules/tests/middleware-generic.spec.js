import { compose } from '../src/shared/middleware';
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms || 1));
}
describe('Middleware', () => {
  test('should work', async () => {
    const arr = [];
    const stack = [];
    stack.push(async (_context, next) => {
      arr.push(1);
      await wait(1);
      await next();
      await wait(1);
      arr.push(6);
    });
    stack.push(async (_context, next) => {
      arr.push(2);
      await wait(1);
      await next();
      await wait(1);
      arr.push(5);
    });
    stack.push(async (_context, next) => {
      arr.push(3);
      await wait(1);
      await next();
      await wait(1);
      arr.push(4);
    });
    await compose(stack)({});
    expect(arr).toEqual(expect.arrayContaining([1, 2, 3, 4, 5, 6]));
  });
  it('should be able to be called twice', async () => {
    const stack = [];
    stack.push(async (context, next) => {
      context.arr.push(1);
      await wait(1);
      await next();
      await wait(1);
      context.arr.push(6);
    });
    stack.push(async (context, next) => {
      context.arr.push(2);
      await wait(1);
      await next();
      await wait(1);
      context.arr.push(5);
    });
    stack.push(async (context, next) => {
      context.arr.push(3);
      await wait(1);
      await next();
      await wait(1);
      context.arr.push(4);
    });
    const fn = compose(stack);
    const ctx1 = { arr: [] };
    const ctx2 = { arr: [] };
    const out = [1, 2, 3, 4, 5, 6];
    await fn(ctx1);
    expect(out).toEqual(ctx1.arr);
    await fn(ctx2);
    expect(out).toEqual(ctx2.arr);
  });
  test('should only accept an array', async () => {
    let err = {};
    try {
      await compose();
    } catch (e) {
      err = e;
    }
    return expect(err).toBeInstanceOf(TypeError);
  });
  test('should create next functions that return a Promise', async () => {
    const stack = [];
    const arr = [];
    for (let i = 0; i < 5; i++) {
      stack.push(async (_context, next) => {
        arr.push(next());
      });
    }
    compose(stack)({});
    for (let next of arr) {
      expect(next).toBeInstanceOf(Promise);
    }
  });
  test('should only accept middleware as functions', async () => {
    expect(() => {
      compose([{}]);
    }).toThrowError(TypeError);
  });
  it('should work when yielding at the end of the stack', async () => {
    const stack = [];
    let called = false;
    stack.push(async (_ctx, next) => {
      await next();
      called = true;
    });
    await compose(stack)({});
    expect(called).toBe(true);
  });
  it('should reject on errors in middleware', async () => {
    const stack = [];
    stack.push(() => {
      throw new Error();
    });
    let err = {};
    try {
      await compose(stack)({});
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(Error);
  });
  test('should throw if next() is called multiple times', async () => {
    let err = {};
    try {
      await compose([
        async (_, next) => {
          await next();
          await next();
        },
      ])({});
    } catch (e) {
      err = e;
    }
    expect(err.message).toMatch(/multiple times/);
  });
});
//# sourceMappingURL=middleware-generic.spec.js.map
