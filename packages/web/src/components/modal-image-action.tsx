import { path } from '@tauri-apps/api';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-fs';
import prettyBytes from 'pretty-bytes';
import { For, createEffect, createSignal, onMount, useContext } from 'solid-js';
import { render } from 'solid-js/web';
import { globalStore } from '../App';
import type { ImageObj } from '../env';

type ModalExpose = {
  toggleVisible?: (val?: boolean) => void;
};
type ModalProps = {
  expose?: ModalExpose;
  onMounted?: () => void;
};
const Modal = (props: ModalProps) => {
  let root: HTMLDialogElement | undefined;

  const [visible, setVisible] = createSignal(false);
  type ResultItem = ImageObj & { new_stat: Omit<ImageObj['stat'], 'basename'> };
  const [result, setResult] = createSignal<ResultItem[]>([]);

  createEffect(async () => {
    if (visible()) {
      for (const img of globalStore.images) {
        const tarpath = await path.join(
          globalStore.output_dir,
          img.stat.basename,
        );
        await invoke('compress_image', {
          srcpath: img.local_path,
          tarpath: tarpath,
        });
        const output = await open(tarpath);
        const new_stat = await output.stat();
        setResult((old) => [...old, Object.assign({}, img, { new_stat })]);
      }
    }
  });

  onMount(() => {
    props.expose ??= {};
    props.expose.toggleVisible = (val?: boolean) => {
      const el = root!;
      const foo = val ?? !el.open;
      foo ? el.showModal() : el.close();
      setVisible(foo);
    };
    props.onMounted?.();
  });

  return (
    <dialog ref={root} class="modal">
      <div class="modal-box size-full max-w-full rounded-none">
        <div class="h-full overflow-auto">
          <For each={result()}>
            {(val, i) => (
              <div class="grid grid-cols-[4rem_4rem_auto_4rem_4rem] items-center justify-items-center p-2 mb-2 bg-[#f0f0f0] border-[1px_solid_#cfdbde] rounded-md">
                <img class="size-12 rounded-sm" src={val.blob_url} />
                <span class="text-[#7eb631]">{prettyBytes(val.stat.size)}</span>
                <div class="w-full p-1 bg-white rounded-2xl justify-self-start">
                  <div
                    class="w-(--percent) h-6 bg-[#92ed14] rounded-xl"
                    style={{
                      '--percent': `${+(val.new_stat.size / val.stat.size).toFixed(2) * 100}%`,
                    }}
                  />
                </div>
                <span class="text-[#7eb631]">
                  {prettyBytes(val.new_stat.size)}
                </span>
                <span class="font-semibold">
                  {`-${+((val.stat.size - val.new_stat.size) / val.stat.size).toFixed(2) * 100}%`}
                </span>
              </div>
            )}
          </For>
        </div>
      </div>
    </dialog>
  );
};

let inst: ModalExpose;

export async function showImageAction() {
  await new Promise<void>((resolve) => {
    if (!inst) {
      inst = {};
      render(
        () => <Modal expose={inst} onMounted={resolve} />,
        document.getElementById('root')!,
      );
    } else {
      resolve();
    }
  });

  inst.toggleVisible!(true);
}
