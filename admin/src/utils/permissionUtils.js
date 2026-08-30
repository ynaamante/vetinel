export const normalizeFeatureName = (feature) => String(feature || '').trim();
export const normalizeRoleName = (role) =>
  String(role || '').trim().toLowerCase().replace(/[-\s]+/g, '_');

const getFeaturePermissions = (permissions, feature) => {
  if (!permissions || typeof permissions !== 'object') return null;
  const normalizedFeature = normalizeFeatureName(feature);
  const featurePermissions = permissions[normalizedFeature];
  return featurePermissions && typeof featurePermissions === 'object' ? featurePermissions : null;
};

export const hasPermissionForFeature = (permissions, role, feature) => {
  const featurePermissions = getFeaturePermissions(permissions, feature);
  if (featurePermissions) {
    return Object.values(featurePermissions).some(Boolean);
  }

  // For super_admin with no explicit permissions, grant access
  const normalizedRole = normalizeRoleName(role);
  if (normalizedRole === 'super_admin') return true;

  // For all other roles, if explicit permissions are not defined, deny access
  // This ensures permissions are ONLY based on what's explicitly set in the matrix
  return false;
};

export const canViewFeature = (permissions, role, feature) => {
  const featurePermissions = getFeaturePermissions(permissions, feature);
  if (featurePermissions) {
    return !!featurePermissions.view;
  }
  
  // For super_admin with no explicit permissions, allow view
  const normalizedRole = normalizeRoleName(role);
  if (normalizedRole === 'super_admin') return true;
  
  // For all other roles, deny access if explicit permissions don't exist
  return false;
};

export const canExportFeature = (permissions, role, feature) => {
  const featurePermissions = getFeaturePermissions(permissions, feature);
  if (featurePermissions) {
    return !!featurePermissions.export;
  }
  return false;
};

export const canCreateFeature = (permissions, role, feature) => {
  const featurePermissions = getFeaturePermissions(permissions, feature);
  if (featurePermissions) {
    return !!featurePermissions.create;
  }
  return false;
};

export const canEditFeature = (permissions, role, feature) => {
  const featurePermissions = getFeaturePermissions(permissions, feature);
  if (featurePermissions) {
    return !!featurePermissions.edit;
  }
  return false;
};

export const canDeleteFeature = (permissions, role, feature) => {
  const featurePermissions = getFeaturePermissions(permissions, feature);
  if (featurePermissions) {
    return !!featurePermissions.delete;
  }
  return false;
};

export const canInteractWithFeature = (permissions, role, feature) => {
  const featurePermissions = getFeaturePermissions(permissions, feature);
  if (featurePermissions) {
    return ['create', 'edit', 'delete', 'export'].some((type) => featurePermissions[type]);
  }
  return false;
};
