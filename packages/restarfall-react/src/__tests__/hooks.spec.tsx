import React from "react";
import { render, act, fireEvent } from "@testing-library/react";
import { create } from "restarfall";

import { Provider, useCall, useEvent, useStore } from "../hooks";

const $store = create.store<string>("");
const event = create.event<string>();
const shape = create.shape();

shape.setValue($store, "VALUE");

test("value from store", () => {
  const Component = () => {
    const [value] = useStore($store);
    return <>{value}</>;
  };
  const renderResult = render(
    <Provider shape={shape}>
      <Component />
    </Provider>,
  );

  expect(renderResult.container.innerHTML).toBe("VALUE");
});

test("value from store after change", () => {
  const Component = () => {
    const [value] = useStore($store);
    return <>{value}</>;
  };
  const renderResult = render(
    <Provider shape={shape}>
      <Component />
    </Provider>,
  );

  act(() => {
    shape.setValue($store, "TEST");
    shape.callEvent($store.changed, "TEST");
  });

  expect(renderResult.container.innerHTML).toBe("TEST");
});

test("change value", () => {
  const Component = () => {
    const [value, setValue] = useStore($store);
    return (
      <input
        value={value}
        onChange={(event) => {
          setValue(event.currentTarget.value);
          setValue(event.currentTarget.value);
        }}
      />
    );
  };
  const renderResult = render(
    <Provider shape={shape}>
      <Component />
    </Provider>,
  );
  const input =
    renderResult.container.querySelector("input") ??
    document.createElement("input");

  fireEvent.change(input, { target: { value: "VALUE_CHANGED" } });
  expect(input.value).toBe("VALUE_CHANGED");
});

test("payload of event", () => {
  const Component = () => {
    const [state] = useEvent(event);
    return <>{state.payload ?? ""}</>;
  };
  const renderResult = render(
    <Provider shape={shape}>
      <Component />
    </Provider>,
  );

  act(() => {
    shape.callEvent(event, "TEST");
  });

  expect(renderResult.container.innerHTML).toBe("TEST");
});

test("call event", () => {
  const Component = () => {
    const [state, callEvent] = useEvent(event);
    return (
      <input
        value={state.payload ?? ""}
        onChange={(event) => callEvent(event.currentTarget.value)}
      />
    );
  };
  const renderResult = render(
    <Provider shape={shape}>
      <Component />
    </Provider>,
  );
  const input =
    renderResult.container.querySelector("input") ??
    document.createElement("input");

  fireEvent.change(input, { target: { value: "VALUE_CHANGED" } });
  expect(input.value).toBe("VALUE_CHANGED");
});

test("call event without payload", () => {
  const okEvent = create.event<void>();

  const Component = () => {
    const callOkEvent = useCall(okEvent);

    return <button onClick={callOkEvent}>ok</button>;
  };

  const renderResult = render(
    <Provider shape={shape}>
      <Component />
    </Provider>,
  );

  const button =
    renderResult.container.querySelector("button") ??
    document.createElement("button");

  const listener = jest.fn();

  shape.listenEvent(okEvent, listener);
  fireEvent.click(button);

  expect(listener.mock.calls).toHaveLength(1);
});
