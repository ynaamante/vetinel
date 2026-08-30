/**
 * Migration script to initialize all existing roles with complete permission structure.
 * This ensures every role has entries for all features with all permission types (view, create, edit, delete, export).
 * 
 * Run with: node scripts/initialize_role_permissions.js
 */

const db = require('../config/db');

// All available features across the system
const ALL_FEATURES = [
  // Disease Intelligence
  'Intelligence Dashboard',
  'Disease Monitoring',
  'Risk Monitoring',
  'Community Analytics',
  'Reports',
  'Data Sync Status',
  // Clinic Management
  'Clinic Overview',
  'User & Role Management',
  'Financial Monitoring',
  'Audit Trail',
  // Operations
  'Appointment Management',
  'Patient Queue',
  'Billing & Payments',
  'Client Management',
  'Due Dates & Reminders',
  // Clinical Records
  'Pet Profiles',
  'Medical Records',
  'Vaccination Records',
  'Treatment Records',
];

const DEFAULT_PERMISSION_OBJECT = {
  view: false,
  create: false,
  edit: false,
  delete: false,
  export: false,
};

async function initializeRolePermissions() {
  try {
    console.log('Starting role permissions initialization...\n');

    // Fetch all roles
    const result = await db.query('SELECT id, name, permissions FROM roles ORDER BY id ASC');
    const roles = result.rows;

    if (roles.length === 0) {
      console.log('No roles found in database.');
      return;
    }

    console.log(`Found ${roles.length} role(s) to process:\n`);

    for (const role of roles) {
      const currentPermissions = typeof role.permissions === 'string'
        ? JSON.parse(role.permissions || '{}')
        : (role.permissions || {});

      const updatedPermissions = { ...currentPermissions };
      let hasChanges = false;

      // Ensure all features exist in permissions
      for (const feature of ALL_FEATURES) {
        if (!updatedPermissions[feature]) {
          updatedPermissions[feature] = { ...DEFAULT_PERMISSION_OBJECT };
          hasChanges = true;
        } else {
          // Ensure all permission types exist for this feature
          const featurePerms = updatedPermissions[feature];
          for (const permType of Object.keys(DEFAULT_PERMISSION_OBJECT)) {
            if (!(permType in featurePerms)) {
              featurePerms[permType] = false;
              hasChanges = true;
            }
          }
        }
      }

      if (hasChanges) {
        console.log(`✓ Updating role "${role.name}" (ID: ${role.id})`);
        
        await db.query(
          'UPDATE roles SET permissions = $1 WHERE id = $2',
          [JSON.stringify(updatedPermissions), role.id]
        );
        
        // Show what permissions were added
        const addedFeatures = ALL_FEATURES.filter(f => !currentPermissions[f]);
        if (addedFeatures.length > 0) {
          console.log(`  Added ${addedFeatures.length} feature(s)\n`);
        }
      } else {
        console.log(`- Role "${role.name}" (ID: ${role.id}) already has complete permissions\n`);
      }
    }

    console.log('✓ Role permissions initialization complete!');
    console.log(`\nNote: The permission matrix is now fully dynamic.`);
    console.log(`All access control depends on the permissions you set in the matrix, not on role titles.`);

  } catch (error) {
    console.error('Error during initialization:', error.message);
    process.exit(1);
  }
}

// Run the migration
initializeRolePermissions().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
