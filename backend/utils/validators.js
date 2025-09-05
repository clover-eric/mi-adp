export function isValidIp(ip) {
  // IPv4 简单校验（不覆盖所有情况）
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip || '');
  if (!m) return false;
  const nums = m.slice(1).map((n) => Number(n));
  return nums.every((n) => n >= 0 && n <= 255);
}
