import type { Counts, Employee, Service, Summary, WorkRecord } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? ''

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!response.ok) throw new Error(`API ${response.status}`)
  return response.json() as Promise<T>
}

export const spaApi = {
  getEmployees: () => request<Employee[]>('/api/employees'),
  createEmployee: (name: string) => request<Employee>('/api/employees', {
    method: 'POST',
    body: JSON.stringify({ name }),
  }),
  updateEmployee: (employeeId: number, name: string) => request<{ ok: boolean }>(`/api/employees/${employeeId}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  }),
  deleteEmployee: (employeeId: number, adminPassword: string) => request<{ ok: boolean }>(`/api/employees/${employeeId}`, {
    method: 'DELETE',
    body: JSON.stringify({ adminPassword }),
  }),
  getPricing: (employeeId: number) =>
    request<Service[]>(`/api/pricing?employeeId=${employeeId}`),
  getWorkRecord: (employeeId: number, workDate: string) =>
    request<WorkRecord>(
      `/api/work-records?employeeId=${employeeId}&date=${workDate}`,
    ),
  getSummary: (mode: 'day' | 'month', period: string, employeeId?: number) =>
    request<Summary>(
      `/api/summary?mode=${mode}&period=${period}${employeeId ? `&employeeId=${employeeId}` : ''}`,
    ),
  saveWorkRecord: (employeeId: number, workDate: string, counts: Counts) =>
    request<{ id: number }>('/api/work-records', {
      method: 'POST',
      body: JSON.stringify({
        employeeId,
        workDate,
        items: Object.entries(counts).map(([serviceId, quantity]) => ({
          serviceId: Number(serviceId),
          quantity,
        })),
      }),
    }),
  savePricing: (employeeId: number, prices: Record<number, number>) =>
    request<{ ok: boolean }>('/api/pricing', {
      method: 'PUT',
      body: JSON.stringify({
        employeeId,
        prices: Object.entries(prices).map(([serviceId, price]) => ({
          serviceId: Number(serviceId),
          price,
        })),
      }),
    }),
  exportExcel: (mode: 'day' | 'month', period: string, employeeId?: number) => {
    window.location.href = `${API_BASE_URL}/api/export.xlsx?mode=${mode}&period=${period}${employeeId ? `&employeeId=${employeeId}` : ''}`
  },
}
