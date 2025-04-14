import prettyBytes from 'pretty-bytes';
import {
  For,
  createEffect,
  createMemo,
  createSignal,
  on,
  onMount,
} from 'solid-js';
import { createStore, produce, reconcile } from 'solid-js/store';

import dayjs from 'dayjs';
import pluginRelativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(pluginRelativeTime);

import './App.css';
import { showOutputConfirm } from './components/modal-output-confirm';
import { DnD } from './dnd';
import type { GlobalStore, ImageObj } from './env';

export const [globalStore, setGlobalStore] = createStore<GlobalStore>({
  images: [],
  output_dir: '',
  appendImage(val: ImageObj) {
    setGlobalStore('images', (images) => [...images, val]);
  },
  setOutputDir(val: string) {
    setGlobalStore('output_dir', val);
  },
});

const App = () => {
  const [isAllSelected, setIsAllSelected] = createSignal(false);
  const [selected, setSelected] = createSignal<ImageObj[]>([]);
  createEffect(() => {
    setIsAllSelected(
      true &&
        selected().length > 0 &&
        selected().length === globalStore.images?.length &&
        selected().every((val, i) => val === globalStore.images[i]),
    );
  });
  createEffect(
    on(
      createMemo(() => globalStore.images),
      (newv, oldv) => {
        console.log('images changed', newv, oldv);
        const diff = newv?.filter((val) => !oldv?.includes(val));
        if (diff?.length) setSelected(selected().concat(diff ?? []));
      },
    ),
  );

  onMount(async () => {
    // console.log(await open({ multiple: true }));
  });

  function toggleIsAllSelected(val: boolean) {
    setIsAllSelected(val);
    setSelected(val ? globalStore.images : []);
  }
  function toggleUnitSelected(val: boolean, target: ImageObj) {
    if (val) {
      setSelected(
        selected()
          .toSpliced(-1, 0, target)
          .toSorted((a, b) => {
            const ai = globalStore.images.findIndex((val) => val === a);
            const bi = globalStore.images.findIndex((val) => val === b);
            return ai - bi;
          }),
      );
    } else {
      const index = selected().findIndex((val) => val === target);
      setSelected(selected().toSpliced(index, 1));
    }
  }
  async function onCompressFiles() {
    showOutputConfirm();
    // for (const file of selected()) {
    //   await invoke('compress_image', { filepath: file.local_path });
    // }
  }

  return (
    <div class="bg-gray-100">
      <DnD />

      <div class="container mx-auto px-4 py-8 text-center">
        {/* <!-- 图片列表 --> */}
        <div class="gap-4 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-8 mb-24">
          {/* <!-- 示例图片条目 --> */}
          <For each={globalStore.images}>
            {(val, i) => (
              <div class="group relative bg-white shadow-sm hover:shadow-md rounded-lg overflow-hidden transition-shadow duration-300">
                <div class="relative bg-gray-100 aspect-square">
                  <img
                    src={val.blob_url}
                    alt="示例图片"
                    class="w-full h-full object-cover"
                  />
                  <div class="top-2 right-2 absolute">
                    <input
                      type="checkbox"
                      class="opacity-0 checked:opacity-100 group-hover:opacity-100 border-gray-300 rounded focus:ring-blue-500 w-5 h-5 text-blue-600 transition-opacity cursor-pointer"
                      checked={selected().includes(val)}
                      onchange={(e) =>
                        toggleUnitSelected(e.currentTarget.checked, val)
                      }
                    />
                  </div>
                </div>
                <div class="p-3">
                  <p class="font-medium text-gray-900 text-sm truncate">
                    {val.stat.basename}
                  </p>
                  <div class="flex justify-between mt-1 text-gray-500 text-xs">
                    <span>{prettyBytes(val.stat.size)}</span>
                    <span>{dayjs().from(val.stat.mtime)}</span>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>

        {/* <!-- 底部操作栏 --> */}
        <div class="right-0 bottom-0 left-0 fixed bg-white shadow-lg px-6 py-4 border-gray-200 border-t">
          <div class="flex justify-between items-center mx-auto container">
            <div class="flex items-center gap-1 text-gray-600 text-sm">
              <input
                type="checkbox"
                class="checkbox checkbox-sm"
                checked={isAllSelected()}
                onchange={(e) => toggleIsAllSelected(e.currentTarget.checked)}
              />
              <span>全选</span>
              <div class="text-gray-600 text-sm">
                <span>已选择</span>
                <span class="font-medium text-blue-600">
                  {selected().length}
                </span>
                <span>个文件</span>
              </div>
            </div>

            <div class="space-x-4">
              <button
                class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-md text-white transition-colors disabled:cursor-not-allowed"
                disabled={selected().length === 0}
                onclick={onCompressFiles}
              >
                压缩图片
              </button>
              {/* <button
                  class="bg-green-600 hover:bg-green-700 disabled:opacity-50 px-4 py-2 rounded-md text-white transition-colors disabled:cursor-not-allowed"
                  disabled
                >
                  格式转换
                </button>
                <button
                  class="bg-red-600 hover:bg-red-700 disabled:opacity-50 px-4 py-2 rounded-md text-white transition-colors disabled:cursor-not-allowed"
                  disabled
                >
                  删除文件
                </button> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
