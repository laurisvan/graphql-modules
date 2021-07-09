import {
  stringify,
  wrappedError,
  ERROR_ORIGINAL_ERROR,
  getOriginalError,
} from './utils';
export function invalidProviderError(provider) {
  return Error(
    `Invalid provider - only instances of Provider and Type are allowed, got: ${provider}`
  );
}
export function noInjectableError(type) {
  return Error(`Missing @Injectable decorator for '${stringify(type)}'`);
}
export function noAnnotationError(typeOrFunc, params) {
  const signature = [];
  for (let i = 0, len = params.length; i < len; i++) {
    const parameter = params[i];
    if (!parameter.type) {
      signature.push('?');
    } else {
      signature.push(stringify(parameter.type));
    }
  }
  return Error(
    "Cannot resolve all parameters for '" +
      stringify(typeOrFunc) +
      "'(" +
      signature.join(', ') +
      '). ' +
      "Make sure that all the parameters are decorated with Inject or have valid type annotations and that '" +
      stringify(typeOrFunc) +
      "' is decorated with Injectable."
  );
}
export function cyclicDependencyError(injector, key) {
  return injectionError(injector, key, function () {
    return `Cannot instantiate cyclic dependency!${constructResolvingPath(
      this.keys
    )}`;
  });
}
export function noProviderError(injector, key) {
  return injectionError(injector, key, function () {
    const first = stringify(this.keys[0].token);
    return `No provider for ${first}!${constructResolvingPath(this.keys)}`;
  });
}
export function instantiationError(injector, originalException, key) {
  return injectionError(
    injector,
    key,
    function () {
      const first = stringify(this.keys[0].token);
      return `Error during instantiation of ${first}: ${
        getOriginalError(this).message
      }${constructResolvingPath(this.keys)}`;
    },
    originalException
  );
}
function injectionError(
  injector,
  key,
  constructResolvingMessage,
  originalError
) {
  const error = originalError ? wrappedError('', originalError) : Error();
  error.addKey = addKey;
  error.keys = [key];
  error.constructResolvingMessage =
    function wrappedConstructResolvingMessage() {
      return (
        constructResolvingMessage.call(this) + ` - in ${injector.displayName}`
      );
    };
  error.message = error.constructResolvingMessage();
  error[ERROR_ORIGINAL_ERROR] = originalError;
  return error;
}
function constructResolvingPath(keys) {
  if (keys.length > 1) {
    const reversed = findFirstClosedCycle(keys.slice().reverse());
    const tokenStrs = reversed.map((k) => stringify(k.token));
    return ' (' + tokenStrs.join(' -> ') + ')';
  }
  return '';
}
function findFirstClosedCycle(keys) {
  const res = [];
  for (let i = 0; i < keys.length; ++i) {
    if (res.indexOf(keys[i]) > -1) {
      res.push(keys[i]);
      return res;
    }
    res.push(keys[i]);
  }
  return res;
}
function addKey(key) {
  this.keys.push(key);
  this.message = this.constructResolvingMessage();
}
//# sourceMappingURL=errors.js.map
