export function getUserRole(user: { publicMetadata?: Record<string, unknown> } | null | undefined): string | null {
  const role = (user?.publicMetadata as { role?: string })?.role;
  return role || null;
}
