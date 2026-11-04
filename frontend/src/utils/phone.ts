/**
 * True when the input looks like a phone number typed without the Libyan
 * country code (e.g. 0912345678), so the login error can say how to write it.
 */
export function isPhoneWithoutCountryCode(input: string): boolean {
  const compact = input.replace(/[\s\-()]/g, "");

  if (!/^\+?\d{7,15}$/.test(compact)) return false;

  return !(
    compact.startsWith("+218") ||
    compact.startsWith("00218") ||
    compact.startsWith("218")
  );
}
