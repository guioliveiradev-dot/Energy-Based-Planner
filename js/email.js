// Validação de e-mail (formato) e sugestão para erros de digitação comuns.
// Importante: sem servidor, o app NÃO consegue saber se a caixa de e-mail existe de verdade.
// O que dá para garantir aqui é que o endereço está bem escrito e que o domínio não é um erro de digitação óbvio.

export const normalizeEmail = (raw) => String(raw ?? '').trim().toLowerCase();

const EXEMPLO = 'Exemplo: nome@gmail.com';

// Devolve { ok: true, email } ou { ok: false, error }.
export function validateEmail(raw) {
  const email = normalizeEmail(raw);
  if (!email) return { ok: false, error: 'Digite seu e-mail.' };
  if (/\s/.test(email)) return { ok: false, error: `O e-mail não pode ter espaços. ${EXEMPLO}` };
  const parts = email.split('@');
  if (parts.length < 2) return { ok: false, error: `Falta o @ no e-mail. ${EXEMPLO}` };
  if (parts.length > 2) return { ok: false, error: `O e-mail tem mais de um @. ${EXEMPLO}` };
  const [local, domain] = parts;
  if (!local) return { ok: false, error: `Falta o nome antes do @. ${EXEMPLO}` };
  if (!domain) return { ok: false, error: `Falta o endereço depois do @. ${EXEMPLO}` };
  if (email.length > 254 || local.length > 64) return { ok: false, error: 'Esse e-mail é longo demais.' };
  if (!/^[a-z0-9._%+-]+$/.test(local) || local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
    return { ok: false, error: `O nome antes do @ tem caracteres que não podem ser usados. ${EXEMPLO}` };
  }
  const labels = domain.split('.');
  if (labels.length < 2) return { ok: false, error: 'Falta o final do endereço, como .com ou .com.br.' };
  const labelOk = (l) => /^[a-z0-9-]{1,63}$/.test(l) && !l.startsWith('-') && !l.endsWith('-');
  if (!labels.every(labelOk)) return { ok: false, error: `O endereço depois do @ não parece correto. ${EXEMPLO}` };
  const tld = labels[labels.length - 1];
  if (!(/^[a-z]{2,24}$/.test(tld) || /^xn--[a-z0-9-]{2,}$/.test(tld))) {
    return { ok: false, error: 'O final do endereço (depois do último ponto) parece incorreto.' };
  }
  return { ok: true, email };
}

// ---------- erros de digitação comuns ----------
const COMMON = [
  'gmail.com', 'hotmail.com', 'hotmail.com.br', 'outlook.com', 'outlook.com.br', 'yahoo.com', 'yahoo.com.br',
  'icloud.com', 'uol.com.br', 'bol.com.br', 'terra.com.br', 'live.com', 'msn.com', 'globo.com', 'ig.com.br',
  'protonmail.com', 'proton.me',
];
// Domínios reais parecidos com os de cima: nunca sugerir trocar.
const REAL = new Set(['mail.com', 'email.com', 'aol.com', 'me.com', 'gmx.com', 'zoho.com', 'yandex.com', 'pm.me', 'live.com.br']);
const FIXES = { 'gmail.com.br': 'gmail.com', 'gmail.co': 'gmail.com', 'hotmail.com.com': 'hotmail.com' };

function distance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return d[a.length][b.length];
}

// Se o domínio parece um erro de um domínio famoso (gmial.com, hotmial.com, gmail.con), devolve o e-mail corrigido.
export function suggestEmail(raw) {
  const v = validateEmail(raw);
  if (!v.ok) return null;
  const [local, domain] = v.email.split('@');
  if (COMMON.includes(domain) || REAL.has(domain)) return null;
  if (FIXES[domain]) return `${local}@${FIXES[domain]}`;
  if (domain.length < 6) return null;
  let best = null;
  for (const c of COMMON) {
    const dist = distance(domain, c);
    if (dist <= 2 && (!best || dist < best.dist)) best = { c, dist };
  }
  return best ? `${local}@${best.c}` : null;
}
