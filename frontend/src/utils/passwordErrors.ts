import type { TFunction } from "i18next";

/**
 * Text for a rejected new password. The server sends validator codes
 * (e.g. password_too_common); each is shown translated, one per line,
 * instead of the server's raw English text.
 */
export function passwordErrorText(data: any, t: TFunction): string | undefined {
  const codes: unknown = data?.codes;

  if (Array.isArray(codes) && codes.length > 0) {
    const lines = codes.map((code) =>
      t(`auth.passwordErrors.${code}`, { defaultValue: "" }),
    );

    if (lines.every(Boolean)) return lines.join("\n");
  }

  return data?.error;
}
