import { useState, useEffect, useRef } from "react";
import { model } from "@modern-js-reduck/react";
import { createExecutor } from "use-hook-anywhere";

const defaultValue = {
  step: 10
};
export const countModel = model<typeof defaultValue>("count").define(
  (_, { use: useModal, onMount }) => {
    let update = () => {};

    const useStep = createExecutor<() => [number]>(undefined, {
      key: "count",
      isEqual: ([a], [b]) => a === b
    });

    onMount(() => {
      [, { update }] = useModal(countModel);
      useStep.subscribe(update);
    });
    return {
      state: { ...defaultValue },
      actions: {
        update(state) {
          return { ...state };
        },
        resetAll() {
          useStep.remount();
          return { ...defaultValue };
        }
      },
      computed: {
        count(state) {
          console.log("count");
          return useStep.setHook((step: number) => {
            const [count, setCount] = useState(0);
            const stepRef = useRef(step);
            stepRef.current = step;
            useEffect(() => {
              const t = setInterval(
                () => setCount((count) => count + stepRef.current),
                1000
              );
              return () => clearInterval(t);
            }, []);
            return [count, setCount] as const;
          })(state.step);
        }
      }
    };
  }
);
