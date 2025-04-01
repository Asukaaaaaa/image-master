import { invoke } from '@tauri-apps/api/core';
import { ask, open } from '@tauri-apps/plugin-dialog';
import { createContext, For, onMount } from 'solid-js';

import './App.css';
import { DnD } from './dnd';
import { createStore, produce } from 'solid-js/store';

type ImageObj = {
  blob_url: string;
  local_path: string;
};
type GlobalStoreObj = {
  images?: ImageObj[];
};
type GlobalMethods = {
  appendImage?: (val: ImageObj) => void;
};
export const GlobalContext = createContext([
  {} as GlobalStoreObj,
  {} as GlobalMethods,
] as const);

const App = () => {
  const [state, setState] = createStore<GlobalStoreObj>({ images: [] });
  const store = [
    state,
    {
      appendImage(val: ImageObj) {
        setState(produce((s) => s.images!.push(val)));
        invoke('compress_image', { filepath: val.local_path });
      },
    },
  ] as const;

  onMount(async () => {
    // console.log(await open({ multiple: true }));
  });

  return (
    <GlobalContext.Provider value={store}>
      <div class="bg-gray-100">
        <DnD />

        <div class="container mx-auto px-4 py-8 text-center">
          {/* <!-- 图片列表 --> */}
          <div class="gap-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 mb-24">
            {/* <!-- 示例图片条目 --> */}
            <For each={state.images}>
              {(val) => (
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
                      />
                    </div>
                  </div>
                  <div class="p-3">
                    <p class="font-medium text-gray-900 text-sm truncate">
                      example.jpg
                    </p>
                    <div class="flex justify-between mt-1 text-gray-500 text-xs">
                      <span>2.4 MB</span>
                      <span>2024-03-20</span>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>

          {/* <!-- 底部操作栏 --> */}
          <div class="right-0 bottom-0 left-0 fixed bg-white shadow-lg px-6 py-4 border-gray-200 border-t">
            <div class="flex justify-between items-center mx-auto container">
              <div class="text-gray-600 text-sm">
                已选择 <span class="font-medium text-blue-600">0</span> 个文件
              </div>
              <div class="space-x-4">
                <button
                  class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-md text-white transition-colors disabled:cursor-not-allowed"
                  disabled
                >
                  压缩图片
                </button>
                <button
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
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GlobalContext.Provider>
  );
};

export default App;
