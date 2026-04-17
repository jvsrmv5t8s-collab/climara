/**
 * Resizes and compresses an image file to a base64 JPEG data URL.
 * Keeps the longest dimension at or below maxDimension pixels.
 */
export function compressPhoto(file: File, maxDimension = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const { naturalWidth: w, naturalHeight: h } = img;
      const scale = Math.min(maxDimension / w, maxDimension / h, 1);
      const cw = Math.round(w * scale);
      const ch = Math.round(h * scale);

      const canvas = document.createElement("canvas");
      canvas.width = cw;
      canvas.height = ch;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas unavailable"));
        return;
      }

      ctx.drawImage(img, 0, 0, cw, ch);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image failed to load"));
    };

    img.src = url;
  });
}
