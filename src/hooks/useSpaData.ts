import { useCallback, useEffect, useState } from 'react'
import { spaApi } from '../api/spaApi'
import type { Employee, Service, Summary } from '../types'

export function useSpaData(
  reportMode: 'day' | 'month',
  reportPeriod: string,
  employeeId: number | null,
  reportEmployeeId: number | null,
) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const reloadSummary = useCallback(
    async () =>
      setSummary(
        await spaApi.getSummary(
          reportMode,
          reportPeriod,
          reportEmployeeId ?? undefined,
        ),
      ),
    [reportMode, reportPeriod, reportEmployeeId],
  )
  const reloadPricing = useCallback(
    async (id = employeeId) => {
      if (!id) return
      setServices(await spaApi.getPricing(id))
    },
    [employeeId],
  )
  const reloadEmployees = useCallback(
    async () => setEmployees(await spaApi.getEmployees()),
    [],
  )

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError('')
    Promise.all([
      spaApi.getEmployees(),
      spaApi.getSummary(
        reportMode,
        reportPeriod,
        reportEmployeeId ?? undefined,
      ),
    ])
      .then(([people, report]) => {
        if (mounted) {
          setEmployees(people)
          setSummary(report)
        }
      })
      .catch(
        () =>
          mounted &&
          setError('Không kết nối được SQLite API. Hãy chạy npm run server.'),
      )
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [reportMode, reportPeriod, reportEmployeeId])
  useEffect(() => {
    let mounted = true
    reloadPricing().catch(
      () => mounted && setError('Không tải được bảng giá của nhân viên.'),
    )
    return () => {
      mounted = false
    }
  }, [reloadPricing])
  return {
    employees,
    services,
    summary,
    loading,
    error,
    reloadSummary,
    reloadPricing,
    reloadEmployees,
  }
}
