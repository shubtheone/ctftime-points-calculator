// Polyfill global File in Node 18 so libraries expecting it (e.g., undici v7) don't crash at build/runtime.
if (typeof (globalThis as any).File === "undefined") {
  class NodeFile extends Blob {
    name: string;
    lastModified: number;
    constructor(fileBits: any[], fileName: string, options: any = {}) {
      super(fileBits, options);
      this.name = String(fileName);
      this.lastModified = options?.lastModified ?? Date.now();
    }
    get [Symbol.toStringTag]() {
      return "File";
    }
  }
  (globalThis as any).File = NodeFile as any;
}
