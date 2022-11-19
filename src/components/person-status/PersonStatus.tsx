import { component$, useStylesScoped$ } from "@builder.io/qwik";
import style from "./PersonStatus.css?inline";

export const PersonStatus = component$(
  ({
    name,
    done,
    current,
  }: {
    name: string;
    done: boolean;
    current: boolean;
  }) => {
    useStylesScoped$(style);
    return (
      <div
        class={{
          done: done,
          current: current,
        }}
      >
        {name}
      </div>
    );
  }
);
