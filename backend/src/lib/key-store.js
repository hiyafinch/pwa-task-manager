// Generated with Claude Code - CS 3660 Sprint 3
// Four day scope: one current signing key. Section 6.3 describes a rotation-safe
// design with a previous key published alongside the current one; that is future
// work, not implemented here, and is called out in the README under limitations.
export function loadKeyStore() {
  const privateKey = process.env.JWT_PRIVATE_KEY;
  const publicKey = process.env.JWT_PUBLIC_KEY;
  const kid = process.env.JWT_KID ?? "sprint3-current";

  if (!privateKey || !publicKey) {
    throw new Error("JWT_PRIVATE_KEY and JWT_PUBLIC_KEY must be set");
  }

  return {
    kid,
    privateKey: privateKey.replace(/\\n/g, "\n"),
    publicKey: publicKey.replace(/\\n/g, "\n"),
  };
}
