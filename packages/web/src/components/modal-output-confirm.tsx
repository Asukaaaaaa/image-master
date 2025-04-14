import { open } from '@tauri-apps/plugin-dialog';
import { createSignal, onMount } from 'solid-js';
import { render } from 'solid-js/web';
import { globalStore } from '../App';
import { showImageAction } from './modal-image-action';

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

  async function onChooseFolder() {
    globalStore.setOutputDir((await open({ directory: true })) ?? '');
  }
  function onConfirm() {
    showImageAction();
  }

  return (
    <dialog ref={root} class="modal">
      <div class="modal-box">
        <div class="flex items-center gap-x-4">
          <button class="btn btn-soft" onclick={onChooseFolder}>
            选择输出目录
          </button>
          <p class="line-clamp">{globalStore.output_dir}</p>
        </div>
        <div class="modal-action">
          <button class="btn btn-soft" onclick={() => root?.close()}>
            取消
          </button>
          <button
            class="btn btn-soft btn-accent"
            disabled={!globalStore.output_dir}
            onclick={onConfirm}
          >
            确认
          </button>
        </div>
      </div>
    </dialog>
  );
};

let inst: ModalExpose;

export async function showOutputConfirm() {
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
