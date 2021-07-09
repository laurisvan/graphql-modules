export function execute(app, inputs, options) {
  const executor = app.createExecution(options);
  return executor({
    schema: app.schema,
    ...inputs,
  });
}
//# sourceMappingURL=graphql.js.map
