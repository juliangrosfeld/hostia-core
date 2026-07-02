// All authored content (curriculum lessons, roleplay scenarios) is written
// against the "[Property]" placeholder so one content set serves every client.
// These helpers swap in the real property name at the data boundary:
//
//  • substituteProperty      — one string (server prompt assembly, ad-hoc UI text)
//  • substitutePropertyDeep  — a whole content tree (the resolved curriculum,
//    phase data) in one pass, so no render site ever sees the placeholder.
//
// With no name available we fall back to a neutral phrase — a real client must
// NEVER see the literal "[Property]".

const FALLBACK = 'the restaurant';

export function substituteProperty(
  text: string,
  propertyName: string | null | undefined,
): string {
  const name = propertyName?.trim() || FALLBACK;
  // Content uses both casings ("[Property]" in copy, "[PROPERTY]" in prompt
  // section headers). split/join = replaceAll without needing es2021 lib.
  return text.split('[Property]').join(name).split('[PROPERTY]').join(name);
}

export function substitutePropertyDeep<T>(
  value: T,
  propertyName: string | null | undefined,
): T {
  if (typeof value === 'string') {
    // Fast path: the vast majority of strings have no placeholder.
    if (!value.includes('[Property]') && !value.includes('[PROPERTY]')) return value;
    return substituteProperty(value, propertyName) as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => substitutePropertyDeep(v, propertyName)) as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = substitutePropertyDeep(v, propertyName);
    }
    return out as T;
  }
  return value;
}
