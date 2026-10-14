/** Mirrors the backend policy in routes/profile.py: 8+ chars, an uppercase letter, a special character. */
export const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { id: 'upper', label: 'An uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { id: 'special', label: 'A symbol like ! or #', test: (pw) => /[!@#$%^&*(),.?":{}|<>\-_+=[\]\\;'`~]/.test(pw) },
]

export function checkPassword(pw = '') {
  const results = PASSWORD_RULES.map((r) => ({ ...r, ok: r.test(pw) }))
  const passed = results.filter((r) => r.ok).length
  // Bonus for length beyond the minimum and a digit, capped at 4.
  const bonus = (pw.length >= 12 ? 1 : 0) + (/\d/.test(pw) ? 0.5 : 0)
  const score = pw ? Math.min(4, Math.floor(passed + (passed === 3 ? bonus : 0))) : 0
  const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']
  return { results, valid: passed === PASSWORD_RULES.length, score, label: labels[score] }
}
