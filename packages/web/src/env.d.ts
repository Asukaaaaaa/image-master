/// <reference types="@rsbuild/core/types" />

import type { FileInfo } from '@tauri-apps/plugin-fs';

type ImageObj = {
  blob_url: string;
  local_path: string;
  stat: FileInfo & { basename: string };
};

type GlobalStore = {
  images: ImageObj[];
  output_dir: string;
  appendImage: (val: ImageObj) => void;
  setOutputDir: (val: string) => void;
};
