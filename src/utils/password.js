const WORDS = ['Vendor', 'Portal', 'Access', 'Secure', 'Supply', 'Orbit', 'Ledger', 'Summit'];

/**
 * Suggests a readable password that satisfies the server rules
 * (8+ characters, at least one letter and one digit).
 */
export function suggestPassword() {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  return `${word}@${Math.floor(1000 + Math.random() * 9000)}`;
}

/** Mirrors the backend password policy so the form can fail fast. */
export function validatePassword(password) {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'At least 8 characters';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password))
    return 'Must contain at least one letter and one number';
  return null;
}

/** Copies "Email / Password" to the clipboard. Resolves to true on success. */
export async function copyCredentials(email, password) {
  try {
    await navigator.clipboard.writeText(`Email: ${email}\nPassword: ${password}`);
    return true;
  } catch {
    return false;
  }
}
