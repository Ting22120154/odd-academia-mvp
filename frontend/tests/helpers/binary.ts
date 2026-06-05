/** Minimal valid JPEG file header for upload tests. */
export function minimalJpegBytes(): Uint8Array {
  return Uint8Array.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00,
    0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
  ]);
}

/** PNG signature — should be rejected by avatar upload. */
export function minimalPngBytes(): Uint8Array {
  return Uint8Array.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  ]);
}

export function jpegFile(name = "avatar.jpg"): File {
  return new File([minimalJpegBytes()], name, { type: "image/jpeg" });
}

export function pngFile(name = "avatar.png"): File {
  return new File([minimalPngBytes()], name, { type: "image/png" });
}
