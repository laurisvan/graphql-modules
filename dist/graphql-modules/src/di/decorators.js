import { isType } from './providers';
import {
  INJECTABLE,
  readInjectableMetadata,
  ensureInjectableMetadata,
} from './metadata';
import { enableExecutionContext } from '../application/execution-context';
function ensureReflect() {
  if (!(Reflect && Reflect.getOwnMetadata)) {
    throw 'reflect-metadata shim is required when using class decorators';
  }
}
export function Injectable(options) {
  return (target) => {
    var _a;
    ensureReflect();
    enableExecutionContext();
    const params = (Reflect.getMetadata('design:paramtypes', target) || []).map(
      (param) => (isType(param) ? param : null)
    );
    const existingMeta = readInjectableMetadata(target);
    const meta = {
      params:
        ((_a =
          existingMeta === null || existingMeta === void 0
            ? void 0
            : existingMeta.params) === null || _a === void 0
          ? void 0
          : _a.length) > 0 && params.length === 0
          ? existingMeta === null || existingMeta === void 0
            ? void 0
            : existingMeta.params
          : params.map((param, i) => {
              var _a;
              const existingParam =
                (_a =
                  existingMeta === null || existingMeta === void 0
                    ? void 0
                    : existingMeta.params) === null || _a === void 0
                  ? void 0
                  : _a[i];
              return {
                type:
                  (existingParam === null || existingParam === void 0
                    ? void 0
                    : existingParam.type) || param,
                optional:
                  typeof (existingParam === null || existingParam === void 0
                    ? void 0
                    : existingParam.optional) === 'boolean'
                    ? existingParam.optional
                    : false,
              };
            }),
      options: {
        ...((existingMeta === null || existingMeta === void 0
          ? void 0
          : existingMeta.options) || {}),
        ...(options || {}),
      },
    };
    target[INJECTABLE] = meta;
    return target;
  };
}
export function Optional() {
  return (target, _, index) => {
    ensureReflect();
    ensureInjectableMetadata(target);
    const meta = readInjectableMetadata(target);
    meta.params[index] = {
      ...meta.params[index],
      optional: true,
    };
  };
}
export function Inject(type) {
  return (target, _, index) => {
    ensureReflect();
    ensureInjectableMetadata(target);
    const meta = readInjectableMetadata(target);
    meta.params[index] = {
      type,
      optional: false,
    };
  };
}
export function ExecutionContext() {
  return (obj, propertyKey) => {
    ensureReflect();
    const target = obj.constructor;
    ensureInjectableMetadata(target);
    const meta = readInjectableMetadata(target);
    if (!meta.options) {
      meta.options = {};
    }
    if (!meta.options.executionContextIn) {
      meta.options.executionContextIn = [];
    }
    meta.options.executionContextIn.push(propertyKey);
  };
}
//# sourceMappingURL=decorators.js.map
