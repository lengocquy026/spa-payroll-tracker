import { Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Employee, Service } from '../types'
const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value)
export function PricingPage({
  employeeList,
  services,
  employeeId,
  onEmployeeChange,
  onSave,
}: {
  employeeList: Employee[]
  services: Service[]
  employeeId: number
  onEmployeeChange: (id: number) => void
  onSave: (prices: Record<number, number>) => Promise<void>
}) {
  const [prices, setPrices] = useState<Record<number, number>>({})
  const selectedName =
    employeeList.find((employee) => employee.id === employeeId)?.name ?? ''
  useEffect(
    () =>
      setPrices(
        Object.fromEntries(
          services.map((service) => [service.id, service.price]),
        ),
      ),
    [services],
  )
  return (
    <section className='attendance-page'>
      <div className='page-heading'>
        <div>
          <p className='eyebrow'>CẤU HÌNH GIÁ</p>
          <h2>Bảng giá theo nhân viên</h2>
        </div>
        <button className='primary-button' onClick={() => onSave(prices)}>
          <Save size={16} />
          Lưu bảng giá
        </button>
      </div>
      <div className='control-row'>
        <label>
          Nhân viên
          <select
            value={employeeId}
            onChange={(event) => onEmployeeChange(Number(event.target.value))}
          >
            {employeeList.map((employee) => (
              <option value={employee.id} key={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className='service-card'>
        <div className='card-title'>
          <div>
            <p className='eyebrow'>{selectedName.toUpperCase()}</p>
            <h3>Đơn giá áp dụng khi chấm công</h3>
          </div>
        </div>
        <div className='service-list'>
          {services.map((service) => (
            <div className='service-row' key={service.id}>
              <div>
                <strong>{service.name}</strong>
                <small>
                  {service.group} · hiện tại {money(service.price)}đ
                </small>
              </div>
              <label className='price-input'>
                <input
                  type='number'
                  min='0'
                  value={prices[service.id] ?? ''}
                  onChange={(event) =>
                    setPrices((current) => ({
                      ...current,
                      [service.id]: Number(event.target.value),
                    }))
                  }
                />
                đ
              </label>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
