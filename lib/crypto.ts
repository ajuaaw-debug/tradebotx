const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;

function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes.buffer as ArrayBuffer;
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getKey(): Promise<CryptoKey> {
  const masterKey = process.env.ENCRYPTION_MASTER_KEY;
  if (!masterKey) throw new Error("ENCRYPTION_MASTER_KEY is not set");
  const keyBuffer = hexToBuffer(masterKey);
  return crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encrypt(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded
  );
  const ivHex = bufferToHex(iv.buffer as ArrayBuffer);
  const cipherHex = bufferToHex(ciphertext);
  return `${ivHex}:${cipherHex}`;
}

export async function decrypt(encrypted: string): Promise<string> {
  const key = await getKey();
  const [ivHex, cipherHex] = encrypted.split(":");
  const iv = hexToBuffer(ivHex);
  const ciphertext = hexToBuffer(cipherHex);
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}