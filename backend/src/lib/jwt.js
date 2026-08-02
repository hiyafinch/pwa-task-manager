// Generated with Claude Code - CS 3660 Sprint 3
import { SignJWT, jwtVerify, importPKCS8, importSPKI, exportJWK } from "jose";

const ALG = "RS256";

export async function signAccessToken({ sub, email }, keyStore, ttlSeconds) {
  const privateKey = await importPKCS8(keyStore.privateKey, ALG);
  const now = Math.floor(Date.now() / 1000);
  const jwt = await new SignJWT({ email })
    .setProtectedHeader({ alg: ALG, kid: keyStore.kid })
    .setSubject(sub)
    .setIssuedAt(now)
    .setExpirationTime(now + ttlSeconds)
    .sign(privateKey);
  return { token: jwt, expiresIn: ttlSeconds };
}

export async function verifyAccessToken(token, keyStore) {
  const publicKey = await importSPKI(keyStore.publicKey, ALG);
  const { payload } = await jwtVerify(token, publicKey, { algorithms: [ALG] });
  return payload;
}

export async function toJwks(keyStore) {
  const publicKey = await importSPKI(keyStore.publicKey, ALG);
  const jwk = await exportJWK(publicKey);
  return { keys: [{ ...jwk, kid: keyStore.kid, use: "sig", alg: ALG }] };
}
