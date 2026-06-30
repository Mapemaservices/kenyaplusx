export interface SurveyFormData {
  county: string
  constituency: string
  ward: string
  full_name: string
  phone_number: string
  gender: string
  age_group: string
  preferred_governor: string
  support_reason: string
  biggest_issue: string
  issue_details: string
}

export interface SurveyResponse extends SurveyFormData {
  id: string
  created_at: string
}

export interface AspirantFormData {
  full_name: string
  county: string
  seat: string
  party: string
  phone_number: string
  brief_bio: string
}

export interface Aspirant extends AspirantFormData {
  id: string
  created_at: string
}

export interface AdminStats {
  totalResponses: number
  countiesCovered: number
  totalAspirants: number
  genderBreakdown: Record<string, number>
  ageBreakdown: Record<string, number>
  countyBreakdown: Record<string, number>
  issueBreakdown: Record<string, number>
}
