export function getAuthHeaders(): HeadersInit {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('casa_admin_access_token') ||
        localStorage.getItem('casa_admin_token') ||
        localStorage.getItem('casa_auth_token')
      : null;

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
