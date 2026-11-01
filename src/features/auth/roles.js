export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
}

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.ADMIN]: 'School Admin',
  [ROLES.STAFF]: 'Staff',
}

// Roles that can sign in to this web panel, in the order shown on the login screen.
export const PANEL_ROLES = [ROLES.ADMIN, ROLES.STAFF, ROLES.SUPER_ADMIN]
