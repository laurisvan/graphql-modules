export function operationControllerCreator(options) {
  const { contextBuilder } = options;
  return (input) => {
    const operation = contextBuilder(input.context);
    const ɵdestroy = input.autoDestroy ? operation.ɵdestroy : () => {};
    return {
      context: operation.context,
      injector: operation.ɵinjector,
      destroy: operation.ɵdestroy,
      ɵdestroy,
    };
  };
}
//# sourceMappingURL=operation-controller.js.map
