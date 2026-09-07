export interface NavigationDataEntry {
  tableName: string
  label: string
  icon: string | null
  order: number | null
}

export interface NavigationPersuratanEntry {
  administrationId: number
  label: string
  icon: string | null
  order: number | null
}

export interface NavigationProjection {
  data: NavigationDataEntry[]
  persuratan: NavigationPersuratanEntry[]
}

export interface UpdateMenuPayload {
  menuOrder?: number | null
  menuIcon?: string | null
}
