import { useState, useMemo } from 'react'

// Contract để mọi trang report dùng, tự build đúng query string khớp
// PeriodQueryParams bên BE (xem TASKS_Thong_ke_Bao_cao.md mục 1.1/1.2).
export function usePeriodState(defaultPeriod = 'MONTH') {
  const [period, setPeriod] = useState(defaultPeriod) // 'DAY'|'MONTH'|'QUARTER'|'YEAR'|'CUSTOM'
  const [date, setDate] = useState(null)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [quarter, setQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3))
  const [year, setYear] = useState(new Date().getFullYear())
  const [from, setFrom] = useState(null)
  const [to, setTo] = useState(null)
  const [compareWithPrevious, setCompareWithPrevious] = useState(false)

  // Params này build 1 lần, mọi call adminReportApi.* / partnerReportApi.*
  // đều spread thẳng object này vào params axios.
  const queryParams = useMemo(() => ({
    period, date, month, quarter, year, from, to, compareWithPrevious,
  }), [period, date, month, quarter, year, from, to, compareWithPrevious])

  return {
    period, setPeriod, date, setDate, month, setMonth, quarter, setQuarter,
    year, setYear, from, setFrom, to, setTo,
    compareWithPrevious, setCompareWithPrevious, queryParams,
  }
}