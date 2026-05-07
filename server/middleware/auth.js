const DANGEROUS_EXTENSIONS = [
  '.sh', '.bash', '.zsh', '.php', '.exe', '.bat', '.cmd', '.ps1',
  '.py', '.rb', '.pl', '.js', '.ts', '.mjs', '.cjs',
];

export function isExtensionAllowed(filename) {
  const ext = '.' + filename.split('.').pop()?.toLowerCase();
  if (!ext || ext === '.') return false;
  return !DANGEROUS_EXTENSIONS.includes(ext);
}
