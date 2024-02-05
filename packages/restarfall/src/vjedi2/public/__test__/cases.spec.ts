import { attachElement, createShape, dispatch } from "../shape";
import { createUnit } from "../unit";
import { useDepend, useDispatch, useScope, useTake } from "../hooks";

import { createStore } from "../store";
import { createEvent } from "../event";

type FieldName = "name" | "age";

type Value = string;

describe("cache", () => {
  test.skip("change field [prev]", () => {
    type FieldName = "name" | "age";

    interface FieldApi {
      change: (value: string) => void;
      take: () => string;
    }

    const shape = createShape();

    const $apis = createStore<Partial<Record<FieldName, FieldApi>>>({});
    const $value = createStore<string>("");
    const changeField = createEvent<{ name: FieldName; value: string }>();

    const field = createUnit(
      (name: FieldName, callback: (name: FieldName, api: FieldApi) => void) => {
        useScope(useDepend, $value);
        callback(name, {
          change: useScope(() => useDispatch($value)),
          take: useScope(useTake, $value),
        });

        return null;
      },
    );

    const root = createUnit(() => {
      const takeApis = useTake($apis);
      const dispatchApis = useDispatch($apis);
      const changedField = useDepend(changeField);

      const cb = (name: FieldName, api: FieldApi) => {
        dispatchApis({ ...takeApis(), [name]: api }, true);
        console.log(takeApis());
      };

      return [field("name", cb), field("age", cb)];
    });

    attachElement(shape, root());
    dispatch(shape, changeField, { name: "name", value: "_" });
  });

  test("change field", () => {
    const shape = createShape();
    const changeField = createEvent<{ name: FieldName; value: Value }>();
    const fieldChanged = createEvent<{ name: FieldName; value: Value }>();
    const $value = createStore<Value>("");

    const field = createUnit((name: FieldName) => {
      const changeFieldEvent = useDepend(
        changeField,
        (payload) => payload.value?.name === name,
      );
      const valueChangedEvent = useScope(useDepend, $value);

      if (changeFieldEvent.called) {
        const dipatchValue = useScope(() => useDispatch($value));
        const value = changeFieldEvent.payload.value?.value ?? "";

        dipatchValue(value);
      }

      if (valueChangedEvent.called) {
        const dipatchFieldChanged = useDispatch(fieldChanged);
        const value = valueChangedEvent.payload.value ?? "";

        dipatchFieldChanged({ value, name });
      }

      return null;
    });

    const log = createUnit(() => {
      console.log(useDepend(fieldChanged));
      return [];
    });

    attachElement(shape, field("name"));
    attachElement(shape, field("age"));
    attachElement(shape, log());
    dispatch(shape, changeField, { name: "name", value: "__" });
    dispatch(shape, changeField, { name: "age", value: "10" });
  });
});
