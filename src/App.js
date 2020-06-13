import React from "react";
import { Machine, actions } from "xstate";
import { useMachine } from "@xstate/react";

const childMachine = Machine({
  id: "child",
  initial: "init",
  strict: true,
  states: {
    init: {
      on: {
        TEST: {
          actions: actions.log("invoked child action"),
          target: "next",
        },
      },
    },
    next: {},
  },
});

const machine = Machine({
  id: "test",
  initial: "init",
  strict: true,
  invoke: {
    id: "child",
    src: childMachine,
    onError: {
      actions: actions.log(),
    },
  },
  states: {
    init: {
      on: {
        START: {
          actions: actions.send("TEST", { to: "child" }),
        },
      },
    },
    next: {},
  },
});

export default function App() {
  const [, send, service] = useMachine(machine);
  console.log("render", "sessionId =", service.sessionId);
  React.useLayoutEffect(() => {
    send("START");
  }, []);
  return null;
}
