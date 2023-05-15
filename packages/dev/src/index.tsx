import React, { useState, useEffect } from "react";
// @ts-expect-error
import { render, createRoot } from "react-dom";
import { useModel, Provider } from "@modern-js-reduck/react";
import { countModel } from "./model";
import { HookExecutor } from "use-hook-anywhere";
import { List } from "./List";

const useCountdown = new HookExecutor(
  function useCountdown(initialCountdown: number) {
    const [countdown, setCountdown] = useState(initialCountdown);

    useEffect(() => {
      const timeoutId = setInterval(() => {
        setCountdown((c) => c - 1);
        console.log(countdown);
      }, 1000);
      return () => clearInterval(timeoutId);
    }, []);

    return countdown;
  },
  { isEqual: (a, b) => a === b }
);

useCountdown.subscribe((count) => {
  if (count === 0) {
    useCountdown.unmount();
  }
});
useCountdown.use(5);

function App() {
  const [state, actions] = useModel(countModel);
  const [count, setCount] = state.count;
  return (
    <>
      <button onClick={() => actions.resetAll()}>resetAll</button>
      <br />
      <button onClick={() => actions.setStep(state.step + 10)}>+10</button>
      <button onClick={() => actions.setStep(state.step - 10)}>-10</button>
      <span>step: {state.step}</span>
      <br />
      <button onClick={() => setCount(0)}>reset</button>
      <span>count: {count}</span>
      <List />
    </>
  );
}
if (createRoot) {
  createRoot(document.getElementById("app")).render(
    <Provider>
      <App />
    </Provider>
  );
} else {
  render(
    <Provider>
      <App />
    </Provider>,
    document.getElementById("app")
  );
}
