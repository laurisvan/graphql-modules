import { mergeDeepWith } from 'ramda';
import { isDefined } from './utils';
import { ExtraMiddlewareError, useLocation } from './errors';
export function compose(middleware) {
  if (!Array.isArray(middleware)) {
    throw new TypeError('Middleware stack must be an array!');
  }
  for (const fn of middleware) {
    if (typeof fn !== 'function') {
      throw new TypeError('Middleware must be composed of functions!');
    }
  }
  return function composed(context, next) {
    // last called middleware
    let index = -1;
    function dispatch(i) {
      if (i <= index) {
        return Promise.reject(new Error('next() called multiple times'));
      }
      index = i;
      const fn = i === middleware.length ? next : middleware[i];
      if (!fn) {
        return Promise.resolve();
      }
      try {
        return Promise.resolve(fn(context, dispatch.bind(null, i + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    }
    return dispatch(0);
  };
}
export function createMiddleware(path, middlewareMap) {
  const middlewares = middlewareMap ? pickMiddlewares(path, middlewareMap) : [];
  return compose(middlewares);
}
export function mergeMiddlewareMaps(app, mod) {
  const merge = (left, right) => {
    return mergeDeepWith(
      (l, r) => {
        if (Array.isArray(l)) {
          return l.concat(r || []);
        }
        return merge(l, r);
      },
      left,
      right
    );
  };
  return merge(app, mod);
}
function pickMiddlewares(path, middlewareMap) {
  var _a;
  const middlewares = [];
  const [type, field] = path;
  if ((_a = middlewareMap['*']) === null || _a === void 0 ? void 0 : _a['*']) {
    middlewares.push(...middlewareMap['*']['*']);
  }
  const typeMap = middlewareMap[type];
  if (typeMap) {
    if (typeMap['*']) {
      middlewares.push(...typeMap['*']);
    }
    if (field && typeMap[field]) {
      middlewares.push(...typeMap[field]);
    }
  }
  return middlewares.filter(isDefined);
}
export function validateMiddlewareMap(middlewareMap, metadata) {
  const exists = checkExistence(metadata);
  for (const typeName in middlewareMap.types) {
    if (middlewareMap.types.hasOwnProperty(typeName)) {
      const typeMiddlewareMap = middlewareMap[typeName];
      if (!exists.type(typeName)) {
        throw new ExtraMiddlewareError(
          `Cannot apply a middleware to non existing "${typeName}" type`,
          useLocation({ dirname: metadata.dirname, id: metadata.id })
        );
      }
      for (const fieldName in typeMiddlewareMap[typeName]) {
        if (typeMiddlewareMap[typeName].hasOwnProperty(fieldName)) {
          if (!exists.field(typeName, fieldName)) {
            throw new ExtraMiddlewareError(
              `Cannot apply a middleware to non existing "${typeName}.${fieldName}" type.field`,
              useLocation({ dirname: metadata.dirname, id: metadata.id })
            );
          }
        }
      }
    }
  }
}
/**
 * Helps to make sure a middleware has a corresponding type/field definition.
 * We don't want to pass a module-level middlewares that are not related to the module.
 * Not because it's dangerous but to prevent unused middlewares.
 */
function checkExistence(metadata) {
  return {
    type(name) {
      var _a, _b;
      return isDefined(
        ((_a = metadata.implements) === null || _a === void 0
          ? void 0
          : _a[name]) ||
          ((_b = metadata.extends) === null || _b === void 0
            ? void 0
            : _b[name])
      );
    },
    field(type, name) {
      var _a, _b, _c, _d;
      return isDefined(
        ((_b =
          (_a = metadata.implements) === null || _a === void 0
            ? void 0
            : _a[type]) === null || _b === void 0
          ? void 0
          : _b.includes(name)) ||
          ((_d =
            (_c = metadata.extends) === null || _c === void 0
              ? void 0
              : _c[type]) === null || _d === void 0
            ? void 0
            : _d.includes(name))
      );
    },
  };
}
//# sourceMappingURL=middleware.js.map
