import { createEffect, createSignal, onMount } from 'solid-js';

export default function WebGPU() {
  const [source, setSource] = createSignal('');

  return (
    <div>
      <ImageComparison src={source()} />
    </div>
  );
}

function ImageComparison(props: { src: string }) {
  let canvas: HTMLCanvasElement | undefined;
  let sm: ShaderManager;

  createEffect(async () => {
    const img = await loadImage(props.src);
  });

  onMount(async () => {
    sm = new ShaderManager();
    await sm.init();
    sm.bindContext(canvas!);
  });

  function loadImage(src: string) {
    const ret = Promise.withResolvers<HTMLImageElement>();
    const img = new Image();
    img.onload = () => ret.resolve(img);
    img.onerror = ret.reject;
    img.src = src;
    return ret.promise;
  }

  return (
    <div>
      <img src={props.src} alt="" />
      <canvas ref={canvas} />
    </div>
  );
}

class ShaderManager {
  device?: GPUDevice;
  context?: GPUCanvasContext;

  async init() {
    if (!navigator.gpu) {
      throw new Error('WebGPU is not supported in this browser.');
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error('Could not request WebGPU adapter.');
    }

    this.device = await adapter.requestDevice();
  }

  bindContext(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('webgpu')!;
    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
      device: this.device!,
      format: format,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST,
    });
  }

  async loadShader(shaderPath: string) {
    // const response = await fetch(shaderPath);
    // const shaderCode = await response.text();
    const shaderCode = `
    struct VertexOutput {
        @builtin(position) Position: vec4<f32>,
        @location(0) texCoord: vec2<f32>
    };

    @vertex
    fn vertex_main(@builtin(vertex_index) VertexIndex: u32) -> VertexOutput {
        var pos = array<vec2<f32>, 6>(
            vec2<f32>(-1.0, -1.0),
            vec2<f32>(1.0, -1.0),
            vec2<f32>(-1.0, 1.0),
            vec2<f32>(-1.0, 1.0),
            vec2<f32>(1.0, -1.0),
            vec2<f32>(1.0, 1.0)
        );

        var uv = array<vec2<f32>, 6>(
            vec2<f32>(0.0, 1.0),
            vec2<f32>(1.0, 1.0),
            vec2<f32>(0.0, 0.0),
            vec2<f32>(0.0, 0.0),
            vec2<f32>(1.0, 1.0),
            vec2<f32>(1.0, 0.0)
        );

        var output: VertexOutput;
        output.Position = vec4<f32>(pos[VertexIndex], 0.0, 1.0);
        output.texCoord = uv[VertexIndex];
        return output;
    }

    @group(0) @binding(0) var myTexture: texture_2d<f32>;
    @group(0) @binding(1) var mySampler: sampler;

    @fragment
    fn fragment_main(@location(0) texCoord: vec2<f32>) -> @location(0) vec4<f32> {
        // 这里可以添加 Anime4K 滤镜逻辑
        return textureSample(myTexture, mySampler, texCoord);
    }`;
    const shaderModule = this.device!.createShaderModule({ code: shaderCode });
    return shaderModule;
  }

  async createTexture(source: HTMLImageElement) {
    const w = source.naturalWidth;
    const h = source.naturalHeight;
    const size = w * h * 4;

    // async function loadImage(src: string) {
    //   const response = await fetch(source.src);
    //   return [
    //     await response.bytes(),
    //     response.headers.get('Content-Type') ?? '',
    //   ] as const;
    // }

    // const [bytes, type] = await loadImage(source.src);
    // const decoder = new ImageDecoder({ data: bytes, type });
    // const frame = (await decoder.decode()).image;
    // const pixels = new Uint8Array();
    // frame.copyTo(pixels);

    // const buffer = this.device!.createBuffer({
    //   size,
    //   usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    // });

    const texture = this.device!.createTexture({
      size: [w, h],
      format: 'rgba8unorm',
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });

    // this.device!.queue.writeBuffer(buffer, 0, pixels, 0, size);
    this.device!.queue.copyExternalImageToTexture({ source }, { texture }, [
      w,
      h,
    ]);

    // const commandEncoder = this.device!.createCommandEncoder();
    // commandEncoder.copyBufferToTexture({ buffer }, { texture }, [
    //   source.width,
    //   source.height,
    // ]);
    // this.device!.queue.submit([commandEncoder.finish()]);

    return texture;
  }

  createRenderPipeline(
    device: GPUDevice,
    shaderModule: GPUShaderModule,
    format: GPUTextureFormat,
  ) {
    const pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: shaderModule,
        entryPoint: 'vertex_main',
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fragment_main',
        targets: [{ format: format }],
      },
      primitive: {
        topology: 'triangle-list',
      },
    });
    return pipeline;
  }

  createVideoTexture(device: GPUDevice, video: HTMLVideoElement) {
    const texture = device.createTexture({
      size: [video.videoWidth, video.videoHeight],
      format: 'rgba8unorm',
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });
    return texture;
  }

  updateVideoTexture(
    device: GPUDevice,
    texture: GPUTexture,
    video: HTMLVideoElement,
  ) {
    const commandEncoder = device.createCommandEncoder();
    const copyEncoder = commandEncoder.beginCopy();
    copyEncoder.copyExternalImageToTexture(
      { source: video },
      { texture: texture },
      [video.videoWidth, video.videoHeight],
    );
    copyEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }

  processVideoFrame(
    device: GPUDevice,
    pipeline: GPURenderPipeline,
    context: GPUCanvasContext,
    videoTexture: GPUTexture,
  ) {
    const commandEncoder = device.createCommandEncoder();
    const texture = context.getCurrentTexture();
    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: texture.createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    };
    const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor);
    renderPass.setPipeline(pipeline);

    const bindGroupLayout = pipeline.getBindGroupLayout(0);
    const bindGroup = device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: videoTexture.createView(),
        },
        {
          binding: 1,
          resource: device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
          }),
        },
      ],
    });
    renderPass.setBindGroup(0, bindGroup);

    renderPass.draw(6, 1, 0, 0);
    renderPass.end();
    device.queue.submit([commandEncoder.finish()]);
  }
}
