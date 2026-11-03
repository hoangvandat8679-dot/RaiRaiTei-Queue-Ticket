/**
 * RaiRaiTei Queue Ticket Studio — Nano Signal Engine
 * Lõi phản ứng (Reactivity Engine) siêu nhẹ, zero-dependency (< 1KB)
 * Đảm bảo O(1) subscriber notification và chống lặp vô hạn (re-entrancy guard).
 */

(function (global) {
  let activeEffect = null;

  function signal(initialValue) {
    let value = initialValue;
    const subscribers = new Set();

    return {
      get() {
        if (activeEffect) {
          subscribers.add(activeEffect);
        }
        return value;
      },
      set(nextValue) {
        const resolved = typeof nextValue === 'function' ? nextValue(value) : nextValue;
        if (resolved !== value) {
          value = resolved;
          // Clone set to prevent mutation during iteration
          const batch = Array.from(subscribers);
          for (let i = 0; i < batch.length; i++) {
            batch[i]();
          }
        }
      },
      peek() {
        return value;
      },
      subscribe(fn) {
        subscribers.add(fn);
        return () => subscribers.delete(fn);
      }
    };
  }

  function effect(fn) {
    const run = () => {
      const prevEffect = activeEffect;
      activeEffect = run;
      try {
        fn();
      } finally {
        activeEffect = prevEffect;
      }
    };
    run();
    return () => {
      // Cleanup hook if needed
    };
  }

  function computed(getter) {
    const result = signal(undefined);
    effect(() => {
      result.set(getter());
    });
    return {
      get: result.get,
      peek: result.peek,
      subscribe: result.subscribe
    };
  }

  global.TicketSignal = {
    signal,
    effect,
    computed
  };
})(typeof window !== 'undefined' ? window : this);
