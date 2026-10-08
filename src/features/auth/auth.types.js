/**
 * @typedef {Object} PanelUser
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string|null} phone
 * @property {'SUPER_ADMIN'|'ADMIN'} role
 * @property {string|null} schoolId
 * @property {string|null} schoolName
 */

/**
 * @typedef {Object} AuthTokens
 * @property {string} accessToken
 * @property {string} refreshToken
 * @property {string} expiresAt
 */

/**
 * @typedef {Object} LoginResult
 * @property {PanelUser} user
 * @property {AuthTokens} tokens
 */

export {}
