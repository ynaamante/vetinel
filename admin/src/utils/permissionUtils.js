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

  const normalizedRole = normalizeRoleName(role);
  if (normalizedRole === 'super_admin') return true;

  if (!permissions || Object.keys(permissions).length === 0) {
    if (feature === 'Clinic Overview') {
      return normalizedRole === 'clinic_owner' || normalizedRole === 'doctor' || normalizedRole === 'super_admin';
    }
    if (['User & Role Management', 'Financial Monitoring', 'Audit Trail'].includes(feature)) {
      return normalizedRole === 'clinic_owner' || normalizedRole === 'super_admin';
    }
    if (['Appointment Management', 'Patient Queue', 'Billing & Payments', 'Client Management', 'Due Dates & Reminders'].includes(feature)) {
      return normalizedRole === 'receptionist' || normalizedRole === 'super_admin';
    }
    if (['Intelligence Dashboard', 'Disease Monitoring', 'Risk Monitoring', 'Community Analytics', 'Reports', 'Data Sync Status'].includes(feature)) {
      return normalizedRole === 'clinic_owner' || normalizedRole === 'doctor' || normalizedRole === 'receptionist' || normalizedRole === 'super_admin';
    }
  }

  return false;
};

export const canViewFeature = (permissions, role, feature) => {
  const featurePermissions = getFeaturePermissions(permissions, feature);
  if (featurePermissions) {
    return !!featurePermissions.view;
  }
  return false;
};

export const canExportFeature = (permissions, role, feature) => {
  const featurePermissions = getFeaturePermissions(permissions, feature);
  if (featurePermissions) {
    return !!featurePermissions.export;
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
