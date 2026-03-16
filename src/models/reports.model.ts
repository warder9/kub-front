export type Reports_Revenue_Request = {
  start_date?: string
  end_date?: string
  period?: string
  department?: string
}

export type Reports_Revenue_Response = Array<{
  date?: string
  revenue?: number
  deals?: number
  clients?: number
}>

export type Reports_Funnel_Response = any
export type Reports_Leads_Response = any

export type Reports_Revenue_Export_Response = Blob