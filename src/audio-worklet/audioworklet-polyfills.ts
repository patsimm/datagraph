if (typeof crypto === "undefined" || typeof crypto.getRandomValues === "undefined") {
  (globalThis as unknown as Record<string, unknown>).crypto = {
    getRandomValues<T extends ArrayBufferView>(array: T): T {
      const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
      return array;
    },
  };
}

if (typeof TextEncoder === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).TextEncoder = class TextEncoder {
    encode(str: string): Uint8Array {
      const buf = new Uint8Array(str.length * 3);
      let pos = 0;
      for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        if (code < 0x80) {
          buf[pos++] = code;
        } else if (code < 0x800) {
          buf[pos++] = 0xc0 | (code >> 6);
          buf[pos++] = 0x80 | (code & 0x3f);
        } else {
          buf[pos++] = 0xe0 | (code >> 12);
          buf[pos++] = 0x80 | ((code >> 6) & 0x3f);
          buf[pos++] = 0x80 | (code & 0x3f);
        }
      }
      return buf.subarray(0, pos);
    }
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).TextDecoder = class TextDecoder {
    decode(buf: Uint8Array): string {
      return new Uint8Array(buf).reduce((s, b) => s + String.fromCharCode(b), "");
    }
  };
}
