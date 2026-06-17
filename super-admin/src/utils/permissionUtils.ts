// Permission utilities for super-admin portal
// Super-admin users have full access to all features

export const isSystemAdmin = (role?: string): boolean => {
  if (!role) return false;
  const normalized = String(role).trim().toLowerCase().replace(/[-\s]+/g, '_');
  return normalized === 'super_admin' || normalized === 'system_admin';
};

export const requiresSystemAdmin = (role?: string): boolean => {
  return isSystemAdmin(role);
};

export const canAccessFeature = (role?: string, feature?: string): boolean => {
  // Super admin can access all features
  if (isSystemAdmin(role)) return true;
  return false;
};

export const getAccessDeniedMessage = (feature: string): string => {
  return `You don't have permission to access ${feature}. System Administrator access required.`;
};
