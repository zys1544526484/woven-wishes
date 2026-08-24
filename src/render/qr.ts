import QRCode from "qrcode";

export function createQrDataUrl(value: string, width = 420): Promise<string> {
  return QRCode.toDataURL(value, {
    errorCorrectionLevel: "Q",
    width,
    margin: 4,
    color: { dark: "#07111f", light: "#fffdf7" },
  });
}

export async function imageFromDataUrl(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load generated image"));
    image.src = source;
  });
}
