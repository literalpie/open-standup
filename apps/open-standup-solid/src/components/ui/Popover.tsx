import { JSXElement } from "solid-js";
import { Popover as KPopover } from "@kobalte/core";

export function Popover(props: { label: string; children: JSXElement }) {
  return (
    <KPopover.Root>
      <KPopover.Trigger class="btn btn-sm flex flex-row">
        {props.label}
        <span class="h-5">⌄</span>
      </KPopover.Trigger>
      <KPopover.Portal>
        <KPopover.Content class="menu bg-base-200 rounded-box animate-popover-fade-out data-[expanded]:animate-popover-fade-in w-56 p-2">
          <KPopover.Arrow />
          {props.children}
        </KPopover.Content>
      </KPopover.Portal>
    </KPopover.Root>
  );
}
