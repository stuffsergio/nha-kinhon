/** JWT access token claims shared by buyer and delivery auth. */
export function accessPayload(user) {
  return { id: user.id, role: user.role, locale: user.locale ?? null };
}

/** Public user fields returned on login/register (buyer + delivery). */
export function publicAuthUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    locale: user.locale ?? null,
  };
}
