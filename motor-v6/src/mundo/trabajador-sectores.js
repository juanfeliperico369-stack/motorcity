/* La descarga y el parseo se hacen fuera del hilo de dibujo. */
self.addEventListener('message', async ({ data }) => {
  const { id, url } = data;
  try {
    const respuesta = await fetch(url);
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
    const bytes = await respuesta.arrayBuffer();
    if (bytes.byteLength > 200000) throw new Error('Sector supera 200 KB');
    const sector = JSON.parse(new TextDecoder().decode(bytes));
    self.postMessage({ id, sector });
  } catch (error) { self.postMessage({ id, error: String(error.message || error) }); }
});
