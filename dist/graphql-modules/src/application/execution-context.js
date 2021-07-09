import { createHook, executionAsyncId } from 'async_hooks';
const executionContextStore = new Map();
const executionContextHook = createHook({
  init(asyncId, _, triggerAsyncId) {
    // Store same context data for child async resources
    if (executionContextStore.has(triggerAsyncId)) {
      executionContextStore.set(
        asyncId,
        executionContextStore.get(triggerAsyncId)
      );
    }
  },
  destroy(asyncId) {
    if (executionContextStore.has(asyncId)) {
      executionContextStore.delete(asyncId);
    }
  },
});
export const executionContext = {
  create(picker) {
    executionContextStore.set(executionAsyncId(), picker);
  },
  getModuleContext(moduleId) {
    const picker = executionContextStore.get(executionAsyncId());
    return picker.getModuleContext(moduleId);
  },
  getApplicationContext() {
    const picker = executionContextStore.get(executionAsyncId());
    return picker.getApplicationContext();
  },
};
let executionContextEnabled = false;
export function enableExecutionContext() {
  if (!executionContextEnabled) {
    executionContextHook.enable();
  }
}
//# sourceMappingURL=execution-context.js.map
