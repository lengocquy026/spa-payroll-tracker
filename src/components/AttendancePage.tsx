import { Plus } from 'lucide-react'
import type { Counts, Employee, Service } from '../types'
const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value)
export function AttendancePage({
  employeeId,
  employeeList,
  selectedName,
  selectedDate,
  services,
  counts,
  totalMoney,
  onEmployeeChange,
  onDateChange,
  onCountChange,
  onSave,
}: {
  employeeId: number
  employeeList: Employee[]
  selectedName: string
  selectedDate: string
  services: Service[]
  counts: Counts
  totalMoney: number
  onEmployeeChange: (id: number) => void
  onDateChange: (date: string) => void
  onCountChange: (id: number, delta: number) => void
  onSave: () => void
}) {
  return (
    <section className='attendance-page'>
      <div className='page-heading'>
        <div>
          <p className='eyebrow'>BẢNG CÔNG</p>
          <h2>Ghi nhận dịch vụ</h2>
        </div>
        <button className='primary-button' onClick={onSave}>
          <Plus size={17} />
          Lưu bảng công
        </button>
      </div>
      <div className='control-row'>
        <label>
          Ngày làm việc
          <input
            type='date'
            value={selectedDate}
            onChange={(event) => onDateChange(event.target.value)}
          />
        </label>
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
            <h3>Dịch vụ trong ngày</h3>
          </div>
          <span className='date-pill'>{selectedDate}</span>
        </div>
        <div className='service-list'>
          {services.map((service) => (
            <div className='service-row' key={service.id}>
              <div>
                <strong>{service.name}</strong>
                <small>
                  {service.group} · {money(service.price)}đ / lượt của{' '}
                  {selectedName}
                </small>
              </div>
              <div className='stepper'>
                <button onClick={() => onCountChange(service.id, -1)}>-</button>
                <b>{counts[service.id] ?? 0}</b>
                <button onClick={() => onCountChange(service.id, 1)}>+</button>
              </div>
            </div>
          ))}
        </div>
        <div className='total-line'>
          <span>Tạm tính theo bảng giá của {selectedName}</span>
          <strong>{money(totalMoney)}đ</strong>
        </div>
      </div>
    </section>
  )
}
