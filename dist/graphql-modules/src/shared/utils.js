import { GraphQLSchema } from 'graphql';
export function flatten(arr) {
  return Array.prototype.concat(...arr);
}
export function isDefined(val) {
  return !isNil(val);
}
export function isNil(val) {
  return val === null || typeof val === 'undefined';
}
export function isObject(val) {
  return Object.prototype.toString.call(val) === '[object Object]';
}
export function isPrimitive(val) {
  return ['number', 'string', 'boolean', 'symbol', 'bigint'].includes(
    typeof val
  );
}
export function isAsyncIterable(obj) {
  return obj && typeof obj[Symbol.asyncIterator] === 'function';
}
export function tapAsyncIterator(iterable, doneCallback) {
  const iteratorMethod = iterable[Symbol.asyncIterator];
  const iterator = iteratorMethod.call(iterable);
  function mapResult(result) {
    if (result.done) {
      doneCallback();
    }
    return result;
  }
  return {
    async next() {
      try {
        let result = await iterator.next();
        return mapResult(result);
      } catch (error) {
        doneCallback();
        throw error;
      }
    },
    async return() {
      try {
        const result = await iterator.return();
        return mapResult(result);
      } catch (error) {
        doneCallback();
        throw error;
      }
    },
    async throw(error) {
      doneCallback();
      return iterator.throw(error);
    },
    [Symbol.asyncIterator]() {
      return this;
    },
  };
}
export function once(cb) {
  let called = false;
  return () => {
    if (!called) {
      called = true;
      cb();
    }
  };
}
export function share(factory) {
  let cached = null;
  return (arg) => {
    if (!cached) {
      cached = factory(arg);
    }
    return cached;
  };
}
export function uniqueId(isNotUsed) {
  let id;
  while (!isNotUsed((id = Math.random().toString(16).substr(2)))) {}
  return id;
}
export function isNotSchema(obj) {
  return obj instanceof GraphQLSchema === false;
}
export function merge(source, target) {
  const result = {
    ...source,
    ...target,
  };
  function attachSymbols(obj) {
    const symbols = Object.getOwnPropertySymbols(obj);
    for (const symbol of symbols) {
      result[symbol] = obj[symbol];
    }
  }
  if (source) {
    attachSymbols(source);
  }
  attachSymbols(target);
  return result;
}
//# sourceMappingURL=utils.js.map
