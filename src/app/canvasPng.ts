export async function canvasPng(
  canvas: HTMLCanvasElement,
): Promise<Uint8Array | null> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  return blob ? new Uint8Array(await blob.arrayBuffer()) : null;
}
