import { createSignal, onMount } from 'solid-js';
import { render } from 'solid-js/web';

type ModalExpose = {
  toggleVisible?: (val?: boolean) => void;
};
type ModalProps = {
  expose?: ModalExpose;
  onMounted?: () => void;
};
const Modal = (props: ModalProps) => {
  let root: HTMLDialogElement | undefined;

  const [path, setPath] = createSignal('');

  onMount(() => {
    props.expose ??= {};
    props.expose.toggleVisible = (val?: boolean) => {
      val ? root?.showModal() : root?.close();
    };
    props.onMounted?.();
  });

  return (
    <dialog ref={root} class="modal">
      <div class="modal-box">
        <h3 class="text-lg font-bold">Hello!</h3>
        <p class="py-4">请先选择输出目录</p>
        <div class="modal-action">
          <button class="btn" onclick={() => root?.close()}>
            取消
          </button>
          <button class="btn" onclick={console.log}>
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
