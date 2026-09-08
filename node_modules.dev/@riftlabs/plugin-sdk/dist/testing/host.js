// src/testing/host.ts
var RESULT_MAX_BYTES = 8 * 1024 * 1024;
async function validate(schema, value) {
  const result = await schema["~standard"].validate(value);
  if (result.issues !== void 0) {
    throw new Error(result.issues.map((issue) => issue.message).join("; "));
  }
  return result.value;
}
function normalizeJson(value, label) {
  let serialized;
  try {
    serialized = JSON.stringify(value);
  } catch {
    serialized = void 0;
  }
  if (serialized === void 0) {
    throw new Error(`${label} is not JSON-serializable`);
  }
  if (Buffer.byteLength(serialized) > RESULT_MAX_BYTES) {
    throw new Error(`${label} exceeds ${RESULT_MAX_BYTES} bytes`);
  }
  return JSON.parse(serialized);
}
function experimental_createHostEntryHarness(entry, harnessOptions = {}) {
  const lifecycleController = new AbortController();
  const activeCalls = /* @__PURE__ */ new Set();
  const capturedSignals = [];
  const watchSubscriptions = /* @__PURE__ */ new Set();
  const retainedWorkerLeases = /* @__PURE__ */ new Set();
  const paths = harnessOptions.experimental_paths ?? {
    dataDir: "/test/plugin-data",
    tempDir: "/test/plugin-temp"
  };
  let disposePromise = null;
  return {
    get experimental_lifecycleSignal() {
      return lifecycleController.signal;
    },
    async experimental_call(methodName, input, options = {}) {
      if (disposePromise !== null) {
        throw new Error("host entry harness is disposed");
      }
      const method = entry.contract[methodName];
      const handler = entry.handlers[methodName];
      if (method === void 0 || handler === void 0) {
        throw new Error(`unknown host method "${String(methodName)}"`);
      }
      const controller = new AbortController();
      activeCalls.add(controller);
      const abort = () => controller.abort();
      lifecycleController.signal.addEventListener("abort", abort, {
        once: true
      });
      options.signal?.addEventListener("abort", abort, { once: true });
      if (lifecycleController.signal.aborted || options.signal?.aborted === true) {
        controller.abort();
      }
      let contextOpen = true;
      try {
        const serverInput = await validate(method.input, input);
        const workerInput = await validate(
          method.input,
          normalizeJson(serverInput, `host input for ${methodName}`)
        );
        const rawOutput = await handler(workerInput, {
          signal: controller.signal,
          lifecycle: { signal: lifecycleController.signal },
          experimental_paths: paths,
          async experimental_emitSignal(signalName, payload) {
            const descriptor = entry.experimental_signals?.[signalName];
            if (descriptor === void 0) {
              throw new Error(`unknown host signal "${String(signalName)}"`);
            }
            const workerPayload = await validate(descriptor.payload, payload);
            const serverPayload = await validate(
              descriptor.payload,
              normalizeJson(workerPayload, `host signal ${String(signalName)}`)
            );
            capturedSignals.push({
              signal: String(signalName),
              payload: serverPayload
            });
          },
          async experimental_watch(watchOptions, listener) {
            if (lifecycleController.signal.aborted) {
              throw new Error("host entry harness is disposed");
            }
            const resolvedWatchOptions = {
              rootPath: watchOptions.rootPath,
              ignoredPaths: watchOptions.ignoredPaths ?? [],
              debounceMs: watchOptions.debounceMs ?? 75,
              maxWaitMs: watchOptions.maxWaitMs ?? 500
            };
            const underlying = await (harnessOptions.experimental_watch?.(
              resolvedWatchOptions,
              listener
            ) ?? { dispose: async () => void 0 });
            let disposed = false;
            const subscription = {
              async dispose() {
                if (disposed) return;
                disposed = true;
                watchSubscriptions.delete(subscription);
                await underlying.dispose();
              }
            };
            watchSubscriptions.add(subscription);
            return subscription;
          },
          experimental_retainWorker() {
            if (!contextOpen || controller.signal.aborted || lifecycleController.signal.aborted) {
              throw new Error("host call context is no longer active");
            }
            let disposed = false;
            const lease = {
              async dispose() {
                if (disposed) return;
                disposed = true;
                retainedWorkerLeases.delete(lease);
              }
            };
            retainedWorkerLeases.add(lease);
            return lease;
          }
        });
        const workerOutput = await validate(method.output, rawOutput);
        return await validate(
          method.output,
          normalizeJson(workerOutput, `host output for ${methodName}`)
        );
      } finally {
        contextOpen = false;
        activeCalls.delete(controller);
        lifecycleController.signal.removeEventListener("abort", abort);
        options.signal?.removeEventListener("abort", abort);
      }
    },
    experimental_getSignals() {
      return capturedSignals;
    },
    experimental_getRetainedWorkerLeaseCount() {
      return retainedWorkerLeases.size;
    },
    experimental_dispose() {
      disposePromise ??= (async () => {
        lifecycleController.abort();
        for (const call of activeCalls) call.abort();
        activeCalls.clear();
        await Promise.all(
          [...watchSubscriptions].map((subscription) => subscription.dispose())
        );
        try {
          await entry.dispose?.();
        } finally {
          retainedWorkerLeases.clear();
        }
      })();
      return disposePromise;
    }
  };
}
export {
  experimental_createHostEntryHarness
};
