import { CalendarDays, CircleDollarSign, Download, Users } from 'lucide-react'
import type { Employee, Summary } from '../types'

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value)
const greeting = () => {
  const hour = new Date().getHours()
  if (hour < 11) return 'Chào buổi sáng'
  if (hour < 14) return 'Chào buổi trưa'
  if (hour < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}
export function Dashboard({
  summary,
  employees,
  mode,
  period,
  employeeId,
  onModeChange,
  onPeriodChange,
  onEmployeeChange,
  onAttendance,
  onExport,
}: {
  summary: Summary
  employees: Employee[]
  mode: 'day' | 'month'
  period: string
  employeeId: number | null
  onModeChange: (mode: 'day' | 'month') => void
  onPeriodChange: (period: string) => void
  onEmployeeChange: (id: number | null) => void
  onAttendance: () => void
  onExport: () => void
}) {
  const periodLabel =
    mode === 'day'
      ? `NGÀY ${period}`
      : `THÁNG ${period.slice(5, 7)} / ${period.slice(0, 4)}`
  return (
    <section className='dashboard'>
      <div className='hero'>
        <div>
          <p className='eyebrow light'>{periodLabel}</p>
          <h2>
            {greeting()}, Cục Vàng <span>✦</span>
          </h2>
          <p className='hero-copy'>
            Theo dõi nhịp vận hành của spa, từng lượt dịch vụ một cách nhẹ
            nhàng.
          </p>
        </div>
      </div>
      <div className='report-filters'>
        <label>
          Kiểu xem
          <select
            value={mode}
            onChange={(event) =>
              onModeChange(event.target.value as 'day' | 'month')
            }
          >
            <option value='month'>Theo tháng</option>
            <option value='day'>Theo ngày</option>
          </select>
        </label>
        <label>
          {mode === 'day' ? 'Ngày' : 'Tháng'}
          <input
            type={mode === 'day' ? 'date' : 'month'}
            value={period}
            onChange={(event) => onPeriodChange(event.target.value)}
          />
        </label>
        <label>
          Nhân viên
          <select
            value={employeeId ?? ''}
            onChange={(event) =>
              onEmployeeChange(
                event.target.value ? Number(event.target.value) : null,
              )
            }
          >
            <option value=''>Tất cả nhân viên</option>
            {employees.map((employee) => (
              <option value={employee.id} key={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className='stats-grid'>
        <Stat
          icon={<CalendarDays size={19} />}
          color='green'
          label='TỔNG LƯỢT DỊCH VỤ'
          value={`${summary.total.services}`}
          note='Từ bảng chấm công thực tế'
        />
        <Stat
          icon={<CircleDollarSign size={19} />}
          color='orange'
          label='TỔNG TIỀN DỊCH VỤ'
          value={`${money(summary.total.money)}đ`}
          note='Tính theo giá từng nhân viên'
        />
        <Stat
          icon={<Users size={19} />}
          color='blue'
          label='TỔNG NHÂN VIÊN'
          value={`${summary.employees.length}`}
          note='Babylon Spa'
          muted
        />
      </div>
      <div className='section-heading'>
        <div>
          <p className='eyebrow'>PHÂN TÍCH</p>
          <h3>Hiệu suất nhân viên</h3>
        </div>
        <button className='primary-button' onClick={onExport}>
          <Download size={16} />
          Xuất Excel
        </button>
      </div>
      <div className='table-card'>
        <div className='table-head'>
          <span>NHÂN VIÊN</span>
          <span>LƯỢT DỊCH VỤ</span>
          <span>TỔNG TIỀN</span>
          <span>TRẠNG THÁI</span>
        </div>
        {summary.employees.map((employee, index) => (
          <div className='table-row' key={employee.id}>
            <div className='employee-cell'>
              <span className={`employee-avatar a${index}`}>
                {employee.name.slice(0, 1)}
              </span>
              <strong>{employee.name}</strong>
            </div>
            <span>{employee.services} lượt</span>
            <strong>{money(employee.money)}đ</strong>
            <span className='status'>
              <i />
              Đang hoạt động
            </span>
          </div>
        ))}
      </div>
      {summary.employees.length === 0 && (
        <div className='empty-state'>
          Không có dữ liệu trong phạm vi đã chọn.
        </div>
      )}
      <button className='link-button' onClick={onAttendance}>
        Mở bảng chấm công <span>→</span>
      </button>
    </section>
  )
}
function Stat({
  icon,
  color,
  label,
  value,
  note,
  muted,
}: {
  icon: React.ReactNode
  color: string
  label: string
  value: string
  note: string
  muted?: boolean
}) {
  return (
    <div className='stat-card'>
      <span className={`stat-icon ${color}`}>{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
      <em className={muted ? 'muted' : ''}>{note}</em>
    </div>
  )
}
