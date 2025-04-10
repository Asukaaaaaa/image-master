import { webview, path } from '@tauri-apps/api';
import { open } from '@tauri-apps/plugin-fs';
import { open as open_dialog } from '@tauri-apps/plugin-dialog';
import { curry, identity, pipe, tap } from 'ramda';
import { onMount, useContext } from 'solid-js';
import { GlobalContext } from './App';

export const DnD = () => {
  let root: HTMLDivElement | undefined;
  const [globalStore, { appendImage }] = useContext(GlobalContext);

  onMount(() => {
    // ? tauri 事件和 web 事件只能触发其中一个，通过 dragDropEnabled 切换
    webview.getCurrentWebview().onDragDropEvent(async (e) => {
      if (e.payload.type === 'drop') {
        loadFiles(e.payload.paths);
      }
    });
  });

  const preventDefaults = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: DragEvent) => {
    console.log('from web', e, e.dataTransfer?.files);
  };
  const handleClick = async (e: Event) => {
    const paths = await open_dialog({
      filters: [{ name: 'png-filter', extensions: ['png'] }],
      multiple: true,
    });
    await loadFiles(paths ?? []);
  };

  async function loadFiles(paths: string[]) {
    for (const filepath of paths) {
      if (!/\.png$/i.test(filepath)) continue;
      const file = await open(filepath);
      const stat = await file.stat();
      const buffer = new Uint8Array(stat.size);
      await file.read(buffer);
      const blob = new Blob([buffer], {
        type: `image/${path.extname(filepath)}`.toLowerCase(),
      });
      const blob_url = URL.createObjectURL(blob);
      appendImage!({
        blob_url,
        local_path: filepath,
        stat: { ...stat, basename: await path.basename(filepath) },
      });
      console.log('from tauri', file, filepath, stat, blob_url);
    }
  }

  return (
    <div
      class="bg-white mb-8 p-12 border-4 border-gray-300 hover:border-blue-500 border-dashed rounded-lg text-center transition-colors duration-300"
      ref={root}
      ondragenter={preventDefaults}
      ondragover={preventDefaults}
      ondragleave={preventDefaults}
      ondrop={pipe(tap(preventDefaults), tap(handleDrop))}
      onclick={handleClick}
    >
      <div class="mx-auto mb-4 text-blue-500">
        <svg
          class="inline-block w-16 h-16"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      </div>
      <p class="mb-2 text-gray-600">拖放文件至此或点击上传</p>
      <p class="text-gray-500 text-sm">支持PNG格式</p>
    </div>
  );
};
