// Configurações do app que você pode querer mudar.

// O painel admin (ferramentas de teste: pontos, vínculo, sequência...) só abre nestes endereços.
// No site publicado (GitHub Pages) ele fica desligado, então ninguém mexe nos dados por ali.
// Para liberar para os amigos testarem, acrescente o endereço, por exemplo 'guioliveiradev-dot.github.io'
// (aí qualquer pessoa que souber os 8 toques e a senha do painel consegue abrir).
export const ADMIN_HOSTS = ['localhost', '127.0.0.1', '[::1]', '::1'];

export const isAdminAllowed = (hostname = typeof location !== 'undefined' ? location.hostname : '') => ADMIN_HOSTS.includes(hostname);
