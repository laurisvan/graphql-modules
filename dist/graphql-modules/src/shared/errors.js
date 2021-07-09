export class ModuleNonUniqueIdError extends ExtendableBuiltin(Error) {
  constructor(message, ...rest) {
    super(composeMessage(message, ...rest));
    this.name = this.constructor.name;
    this.message = composeMessage(message, ...rest);
  }
}
export class ModuleDuplicatedError extends ExtendableBuiltin(Error) {
  constructor(message, ...rest) {
    super(composeMessage(message, ...rest));
    this.name = this.constructor.name;
    this.message = composeMessage(message, ...rest);
  }
}
export class ExtraResolverError extends ExtendableBuiltin(Error) {
  constructor(message, ...rest) {
    super(composeMessage(message, ...rest));
    this.name = this.constructor.name;
    this.message = composeMessage(message, ...rest);
  }
}
export class ExtraMiddlewareError extends ExtendableBuiltin(Error) {
  constructor(message, ...rest) {
    super(composeMessage(message, ...rest));
    this.name = this.constructor.name;
    this.message = composeMessage(message, ...rest);
  }
}
export class ResolverDuplicatedError extends ExtendableBuiltin(Error) {
  constructor(message, ...rest) {
    super(composeMessage(message, ...rest));
    this.name = this.constructor.name;
    this.message = composeMessage(message, ...rest);
  }
}
export class ResolverInvalidError extends ExtendableBuiltin(Error) {
  constructor(message, ...rest) {
    super(composeMessage(message, ...rest));
    this.name = this.constructor.name;
    this.message = composeMessage(message, ...rest);
  }
}
export class NonDocumentNodeError extends ExtendableBuiltin(Error) {
  constructor(message, ...rest) {
    super(composeMessage(message, ...rest));
    this.name = this.constructor.name;
    this.message = composeMessage(message, ...rest);
  }
}
// helpers
export function useLocation({ dirname, id }) {
  return dirname
    ? `Module "${id}" located at ${dirname}`
    : [
        `Module "${id}"`,
        `Hint: pass __dirname to "dirname" option of your modules to get more insightful errors`,
      ].join('\n');
}
export function ExtendableBuiltin(cls) {
  function ExtendableBuiltin() {
    cls.apply(this, arguments);
  }
  ExtendableBuiltin.prototype = Object.create(cls.prototype);
  Object.setPrototypeOf(ExtendableBuiltin, cls);
  return ExtendableBuiltin;
}
export function composeMessage(...lines) {
  return lines.join('\n');
}
//# sourceMappingURL=errors.js.map
