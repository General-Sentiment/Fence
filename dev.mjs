#!/usr/bin/env node

/**
 * Fence dev server — watches for file changes and tells the extension to reload.
 * Zero dependencies, uses Node built-in modules only.
 * Usage: node dev.mjs
 */

import { createServer } from "http";
import { createHash } from "crypto";
import { watch } from "fs";
import { resolve } from "path";

const PORT = 18923;
const DIR = resolve(import.meta.dirname);
const clients = new Set();

// Minimal WebSocket server (RFC 6455)
const server = createServer((req, res) => {
  res.writeHead(404);
  res.end();
});

server.on("upgrade", (req, socket) => {
  const key = req.headers["sec-websocket-key"];
  if (!key) {
    socket.destroy();
    return;
  }

  const accept = createHash("sha1")
    .update(key + "258EAFA5-E914-47DA-95CA-5AB5DC65B64B")
    .digest("base64");

  socket.write(
    "HTTP/1.1 101 Switching Protocols\r\n" +
      "Upgrade: websocket\r\n" +
      "Connection: Upgrade\r\n" +
      `Sec-WebSocket-Accept: ${accept}\r\n` +
      "\r\n"
  );

  // New connection replaces all previous ones (extension reloads create new sockets)
  for (const old of clients) {
    old.destroy();
  }
  clients.clear();

  clients.add(socket);
  console.log("[dev] Extension connected");

  function remove() { clients.delete(socket); }
  socket.on("close", remove);
  socket.on("end", remove);
  socket.on("error", remove);
});

function sendWsFrame(socket, message) {
  const payload = Buffer.from(message);
  const len = payload.length;
  let header;

  if (len < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x81; // FIN + text frame
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }

  socket.write(Buffer.concat([header, payload]));
}

function notifyReload() {
  for (const socket of clients) {
    try {
      sendWsFrame(socket, "reload");
    } catch {
      clients.delete(socket);
    }
  }
  console.log(`[dev] Reload sent to ${clients.size} client(s)`);
}

// Debounce rapid changes
let timeout = null;
function scheduleReload() {
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(notifyReload, 300);
}

// Watch recursively for changes
watch(DIR, { recursive: true }, (_eventType, filename) => {
  if (!filename) return;
  if (filename.startsWith(".") || filename.includes("node_modules")) return;
  console.log(`[dev] Changed: ${filename}`);
  scheduleReload();
});

server.listen(PORT, () => {
  console.log(`[dev] Fence dev server running on ws://localhost:${PORT}`);
  console.log(`[dev] Watching ${DIR} for changes...`);
});
