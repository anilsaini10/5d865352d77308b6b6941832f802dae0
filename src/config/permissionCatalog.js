const CAMEL_CASE_RE = /^[a-z][a-zA-Z0-9]{0,63}$/

export const SCHOOL_PERMISSIONS = [
  {
    group: 'Fees',
    items: [
      { key: 'feesModule', label: 'Fees module', type: 'boolean', default: false },
      { key: 'feesCollect', label: 'Collect fees', type: 'boolean', default: false },
    ],
  },
  {
    group: 'Salary',
    items: [
      { key: 'salaryView', label: 'View staff salary', type: 'boolean', default: false },
    ],
  },
  {
    group: 'Reports',
    items: [
      { key: 'reportsView', label: 'View reports', type: 'boolean', default: false },
    ],
  },
]

export const ROLE_PERMISSIONS = [
  {
    group: 'Fees',
    items: [
      { key: 'feesCollect', label: 'Collect fees', type: 'boolean', default: false },
      { key: 'receiptPrint', label: 'Print receipts', type: 'boolean', default: false },
      { key: 'maxDiscountPercent', label: 'Max discount (%)', type: 'number', default: 0, min: 0, max: 100 },
    ],
  },
  {
    group: 'Salary',
    items: [
      { key: 'salaryView', label: 'View staff salary', type: 'boolean', default: false },
    ],
  },
  {
    group: 'Reports',
    items: [
      { key: 'reportsView', label: 'View reports', type: 'boolean', default: false },
      { key: 'reportFormat', label: 'Report format', type: 'select', options: ['pdf', 'excel'], default: 'pdf' },
    ],
  },
]

function assertCatalog(catalog, name) {
  const seen = new Set()
  for (const group of catalog) {
    for (const item of group.items) {
      if (!CAMEL_CASE_RE.test(item.key)) {
        throw new Error(`[${name}] key "${item.key}" is not valid camelCase`)
      }
      if (seen.has(item.key)) {
        throw new Error(`[${name}] duplicate key "${item.key}"`)
      }
      seen.add(item.key)
    }
  }
}

if (import.meta.env.DEV) {
  assertCatalog(SCHOOL_PERMISSIONS, 'SCHOOL_PERMISSIONS')
  assertCatalog(ROLE_PERMISSIONS, 'ROLE_PERMISSIONS')
}

export function getPerm(perms, key, catalogItem) {
  return key in perms ? perms[key] : catalogItem.default
}

export function flatItems(catalog) {
  return catalog.flatMap((g) => g.items)
}
