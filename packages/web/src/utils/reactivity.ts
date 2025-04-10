import { createEffect, createMemo, untrack, type Accessor } from 'solid-js';

export function useLastChanged<T>(source: Accessor<T>) {
  let prev = source();
  let next = source();

  createEffect(() => {
    prev = next;
    next = source();
  });

  return createMemo(() => prev);
}

export function useWatch<T>(
  source: Accessor<T>,
  callback: (newv: T, oldv?: T) => void,
) {
  const lastChanged = useLastChanged(source);
  createEffect(() => {
    untrack(() => callback(source(), lastChanged()));
  });
}
