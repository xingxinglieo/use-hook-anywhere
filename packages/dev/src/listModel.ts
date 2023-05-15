import { usePagination } from "ahooks";
import { getUserList } from "./common";
import { model } from "@modern-js-reduck/react";
import { useHookOnePlace } from "use-hook-anywhere";

const defaultValue = {};

export const listModel = model<typeof defaultValue>("list").define(
  (_, { use, onMount }) => {
    let update = () => {};
    onMount(() => {
      [, { update }] = use(listModel);
    });
    return {
      state: { ...defaultValue },
      actions: {
        update: (state) => ({ ...state })
      },
      computed: {
        pagination() {
          return useHookOnePlace(usePagination, {
            key: "list-pagination",
            onUpdate: () => update()
          }).use(getUserList);
        }
      }
    };
  }
);
