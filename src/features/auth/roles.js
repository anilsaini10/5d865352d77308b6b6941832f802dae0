export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
}

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.ADMIN]: 'School Admin',
}

// Roles that can sign in to this web panel, in the order shown on the login screen.
export const PANEL_ROLES = [ROLES.ADMIN, ROLES.SUPER_ADMIN]
