// Hash de senha com WebCrypto (PBKDF2 + SHA-256, 100.000 iterações).
// Idêntico ao original, para que contas já criadas continuem funcionando
// depois de importar os dados.

export async function generateSalt() {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...salt));
}

export async function hashPassword(password, saltB64) {
  const encoder = new TextEncoder();
  const salt = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );

  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

export async function verifyPassword(password, saltB64, storedHash) {
  const hash = await hashPassword(password, saltB64);
  return hash === storedHash;
}
