import { createPrefersDark } from "@solid-primitives/media";
import { makePersisted } from "@solid-primitives/storage";
import { createEffect, createSignal } from "solid-js";
import { Popover } from "./ui/Popover";

const defaultColors = {
  complete: "#36d399",
  completeDark: "#206257",
  inProgress: "#3abff8",
  inProgressDark: "#644e73",
};

/**
 * Component that allows user to change colors in the theme.
 * When colors are changed, they are immediately applied to the appropriate CSS variables.
 * Changes only apply to the current appearance (dark or light mode).
 */
export function Themer() {
  const prefersDark = createPrefersDark();

  /* eslint-disable solid/reactivity -- makePersisted handles reactivity */
  const [completeColorLight, setCompleteColorLight] = makePersisted(
    createSignal<string>(defaultColors.complete),
    { name: "complete-color" },
  );
  const [completeColorDark, setCompleteColorDark] = makePersisted(
    createSignal<string>(defaultColors.completeDark),
    { name: "complete-color-dark" },
  );
  const [inProgressColorLight, setInProgressColorLight] = makePersisted(
    createSignal<string>(defaultColors.inProgress),
    { name: "in-prograss-color" },
  );
  const [inProgressColorDark, setInProgressColorDark] = makePersisted(
    createSignal<string>(defaultColors.inProgressDark),
    { name: "in-prograss-color-dark" },
  );
  /* eslint-enable solid/reactivity */

  createEffect(() => {
    if (prefersDark()) {
      document.documentElement.style.setProperty(
        "--complete-dark",
        completeColorDark(),
      );
      return;
    }
    document.documentElement.style.setProperty(
      "--complete",
      completeColorLight(),
    );
  });
  createEffect(() => {
    if (prefersDark()) {
      document.documentElement.style.setProperty(
        "--in-progress-dark",
        inProgressColorDark(),
      );
      return;
    }
    document.documentElement.style.setProperty(
      "--in-progress",
      inProgressColorLight(),
    );
  });
  const completeColor = () =>
    prefersDark() ? completeColorDark() : completeColorLight();
  const inProgressColor = () =>
    prefersDark() ? inProgressColorDark() : inProgressColorLight();

  return (
    <>
      <Popover label={"Theme"}>
        <div class="flex flex-col gap-2 p-2">
          <label class="flex justify-between">
            Complete Color
            <input
              type="color"
              name="complete-color"
              value={completeColor()}
              onChange={(ev) => {
                if (prefersDark()) {
                  setCompleteColorDark(ev.target.value);
                  return;
                }
                setCompleteColorLight(ev.target.value);
              }}
            />
          </label>
          <label class="flex justify-between">
            In Progress Color
            <input
              type="color"
              name="in-progress-color"
              value={inProgressColor()}
              onChange={(ev) => {
                if (prefersDark()) {
                  setInProgressColorDark(ev.target.value);
                  return;
                }
                setInProgressColorLight(ev.target.value);
              }}
            />
          </label>
          <button
            class="btn btn-sm self-center"
            onClick={() => {
              if (prefersDark()) {
                setCompleteColorDark(defaultColors.completeDark);
                setInProgressColorDark(defaultColors.inProgressDark);
                return;
              }
              setCompleteColorLight(defaultColors.complete);
              setInProgressColorLight(defaultColors.inProgress);
            }}
          >
            Reset Colors
          </button>
        </div>
      </Popover>
    </>
  );
}
