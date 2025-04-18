use image::DynamicImage;
use std::path::Path;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command(rename_all = "snake_case")]
async fn compress_image(srcpath: String, tarpath: String) {
    println!("Compressing image at {srcpath}");

    let image = image::open(srcpath.clone()).unwrap();
    let width = image.width();
    let height = image.height();
    let rgba_pixels = image
        .into_rgba8()
        .pixels()
        .map(|p| {
            let [r, g, b, a] = p.0;
            imagequant::RGBA::new(r, g, b, a)
        })
        .collect::<Vec<_>>();

    let mut liq = imagequant::new();
    liq.set_speed(5).unwrap();
    liq.set_quality(70, 99).unwrap();
    let mut img = liq
        .new_image(rgba_pixels, width as usize, height as usize, 0.0)
        .unwrap();
    let mut res = match liq.quantize(&mut img) {
        Ok(res) => res,
        Err(err) => panic!("Quantization failed, because: {err:?}"),
    };
    res.set_dithering_level(1.0).unwrap();
    let (palette, pixels) = res.remapped(&mut img).unwrap();
    println!(
        "Done! Got palette and {} pixels with {}% quality",
        pixels.len(),
        res.quantization_quality().unwrap()
    );

    // let output_path = Path::new(srcpath.as_str())
    //     .parent()
    //     .unwrap()
    //     .join("output.png");
    println!("Writing to {tarpath:?}");

    // let color_map = png::ColorType::from();
    // let new_image = image::ImageBuffer::from_raw(width, height, pixels).expect("无法创建新图片");
    // DynamicImage::ImageLuma8(new_image).save(output_path);

    let mut state = lodepng::Encoder::new();
    state.info_raw_mut().colortype = lodepng::ColorType::PALETTE;
    state.info_raw_mut().try_set_bitdepth(8);
    state.info_png_mut().color.colortype = lodepng::ColorType::PALETTE;
    state.info_png_mut().color.try_set_bitdepth(8);
    state.set_palette(&palette);
    state.encode_file(tarpath, &pixels, width as usize, height as usize);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, compress_image])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tokio::test]
async fn test_compress_png() {
    compress_image("C:\\Users\\Yalla\\Downloads\\test.png".to_string()).await
}
