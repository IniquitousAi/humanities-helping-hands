export async function recheck(wasmBytes, exportBytes) {
  const { instance } = await WebAssembly.instantiate(wasmBytes, {});
  const x = instance.exports;
  const readMsg = () => new TextDecoder().decode(new Uint8Array(x.memory.buffer, x.msg_ptr(), x.msg_len()));
  const ptr = x.alloc(exportBytes.length);
  new Uint8Array(x.memory.buffer, ptr, exportBytes.length).set(exportBytes);
  const t0 = performance.now();
  try {
    const code = x.check(ptr, exportBytes.length);
    return { pass: code === 0, ms: performance.now() - t0, msg: readMsg() };
  } catch (e) {
    return { pass: false, ms: performance.now() - t0, msg: readMsg() || String(e) };
  }
}
