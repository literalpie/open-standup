import { component$ } from "@builder.io/qwik";

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
    return (
      <div
        class={[
          "px-2",
          {
            "bg-success text-success-content": done,
            "bg-info text-info-content": current,
          },
        ]}
      >
        {name}
      </div>
    );
  }
);
