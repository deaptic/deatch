import { type Accessor, createUniqueId, mergeProps } from "solid-js";
import { createListNavigation } from "./createListNavigation.ts";

export type ListboxField = {
  readonly "aria-autocomplete": "list";
  readonly "aria-controls": string | undefined;
  readonly "aria-activedescendant": string | undefined;
};

export type ListboxCombobox = ListboxField & {
  readonly role: "combobox";
  readonly "aria-expanded": boolean;
};

type Ids = {
  controls: Accessor<string | undefined>;
  active: Accessor<string | undefined>;
};

function field(ids: Ids): ListboxField {
  return {
    "aria-autocomplete": "list",
    get "aria-controls"() {
      return ids.controls();
    },
    get "aria-activedescendant"() {
      return ids.active();
    },
  };
}

function combobox(ids: Ids): ListboxCombobox {
  return mergeProps(field(ids), {
    role: "combobox" as const,
    get "aria-expanded"() {
      return ids.controls() !== undefined;
    },
  });
}

function idsFrom(source: Accessor<ListboxField | undefined>): Ids {
  return {
    controls: () => source()?.["aria-controls"],
    active: () => source()?.["aria-activedescendant"],
  };
}

export const fieldFrom = (source: Accessor<ListboxField | undefined>) =>
  field(idsFrom(source));

export const comboboxFrom = (source: Accessor<ListboxField | undefined>) =>
  combobox(idsFrom(source));

export function createListbox(opts: {
  count: Accessor<number>;
  open?: Accessor<boolean>;
}) {
  const id = createUniqueId();
  const optionId = (index: number) => `${id}-${index}`;
  const nav = createListNavigation({
    count: opts.count,
    rowAt: (i) => document.getElementById(optionId(i)),
  });
  const expanded = () => (opts.open?.() ?? true) && opts.count() > 0;

  return {
    ...nav,
    field: combobox({
      controls: () => (expanded() ? id : undefined),
      active: () => (expanded() ? optionId(nav.active()) : undefined),
    }),
    list: { id, role: "listbox" } as const,
    option: (index: Accessor<number>) => ({
      role: "option" as const,
      get id() {
        return optionId(index());
      },
      get "aria-selected"() {
        return index() === nav.active();
      },
    }),
  };
}
