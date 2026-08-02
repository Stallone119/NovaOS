export const DEPARTMENTS = ['Marketing', 'Logistics', 'Finance', 'Protocol', 'Media', 'Hospitality', 'Registration'] as const

export function departmentSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-')
}

export function departmentFromSlug(slug: string) {
  return DEPARTMENTS.find((d) => departmentSlug(d) === slug) ?? null
}
