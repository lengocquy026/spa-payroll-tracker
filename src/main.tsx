import { StrictMode, useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  Menu,
  Settings2,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { createRoot } from 'react-dom/client'
import { spaApi } from './api/spaApi'
import { AttendancePage } from './components/AttendancePage'
import { Dashboard } from './components/Dashboard'
import { EmployeesPage } from './components/EmployeesPage'
import { PricingPage } from './components/PricingPage'
import { useSpaData } from './hooks/useSpaData'
import type { Counts } from './types'
import './styles.css'

const today = new Date().toISOString().slice(0, 10)
const month = today.slice(0, 7)

function App() {
  const [active, setActive] = useState('Tổng quan')
  const [pricingEmployeeId, setPricingEmployeeId] = useState<number | null>(
    null,
  )
  const [reportEmployeeId, setReportEmployeeId] = useState<number | null>(null)
  const [reportMode, setReportMode] = useState<'day' | 'month'>('month')
  const [reportPeriod, setReportPeriod] = useState(month)
  const [selectedDate, setSelectedDate] = useState(today)
  const [counts, setCounts] = useState<Counts>({})
  const [notice, setNotice] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const {
    employees,
    services,
    summary,
    loading,
    error,
    reloadSummary,
    reloadPricing,
    reloadEmployees,
  } = useSpaData(reportMode, reportPeriod, pricingEmployeeId, reportEmployeeId)
  useEffect(() => {
    if (pricingEmployeeId === null && employees[0])
      setPricingEmployeeId(employees[0].id)
  }, [pricingEmployeeId, employees])
  const selectedEmployeeId = pricingEmployeeId ?? employees[0]?.id ?? 0
  useEffect(() => {
    if (!selectedEmployeeId || !selectedDate) return
    spaApi
      .getWorkRecord(selectedEmployeeId, selectedDate)
      .then((record) => setCounts(record.counts))
      .catch(() => flash('Không tải được bảng công đã lưu'))
  }, [selectedEmployeeId, selectedDate])
  const selectedName =
    employees.find((employee) => employee.id === selectedEmployeeId)?.name ?? ''
  const totalMoney = useMemo(
    () =>
      services.reduce(
        (sum, service) => sum + service.price * (counts[service.id] ?? 0),
        0,
      ),
    [services, counts],
  )
  const updateCount = (id: number, delta: number) =>
    setCounts((current) => ({
      ...current,
      [id]: Math.max(0, (current[id] ?? 0) + delta),
    }))
  const selectEmployee = (id: number) => {
    setPricingEmployeeId(id)
    setCounts({})
  }
  const flash = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2600)
  }
  const saveWork = async () => {
    try {
      await spaApi.saveWorkRecord(selectedEmployeeId, selectedDate, counts)
      await reloadSummary()
      flash(`Đã lưu bảng công của ${selectedName} vào SQLite`)
    } catch {
      flash('Không thể lưu bảng công')
    }
  }
  const savePricing = async (prices: Record<number, number>) => {
    try {
      await spaApi.savePricing(selectedEmployeeId, prices)
      await reloadPricing(selectedEmployeeId)
      flash(`Đã lưu bảng giá riêng cho ${selectedName}`)
    } catch {
      flash('Không thể lưu bảng giá')
    }
  }
  const updateEmployee = async (id: number, name: string) => {
    try {
      await spaApi.updateEmployee(id, name)
      await reloadEmployees()
      flash('Đã cập nhật nhân viên')
    } catch {
      flash('Không thể cập nhật nhân viên')
      throw new Error('update employee failed')
    }
  }
  const deleteEmployee = async (id: number, password: string) => {
    try {
      await spaApi.deleteEmployee(id, password)
      await reloadEmployees()
      if (pricingEmployeeId === id) setPricingEmployeeId(null)
      flash('Đã xóa nhân viên')
    } catch {
      flash('Mật khẩu admin không đúng hoặc không thể xóa')
      throw new Error('delete employee failed')
    }
  }
  const navigation = [
    ['Tổng quan', BarChart3],
    ['Chấm công', CalendarDays],
    ['Nhân viên', Users],
    ['Bảng giá', CircleDollarSign],
  ] as const
  const changePage = (page: string) => {
    setActive(page)
    setMenuOpen(false)
  }

  return (
    <div className='app-shell'>
      <aside className={menuOpen ? 'sidebar open' : 'sidebar'}>
        <div className='brand'>
          <span className='brand-mark'>✦</span>Babylon
          <span className='brand-accent'>Spa</span>
        </div>
        <div className='workspace-label'>WORKSPACE</div>
        <nav>
          {navigation.map(([label, Icon]) => (
            <button
              className={active === label ? 'nav-item active' : 'nav-item'}
              key={label}
              onClick={() => changePage(label)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <div className='sidebar-bottom'>
          <div className='profile'>
            <div className='avatar'>AD</div>
            <div>
              <strong>Hello, Cục Vàng</strong>
              <small>Quản trị viên</small>
            </div>
            <span className='dots'>•••</span>
          </div>
        </div>
      </aside>
      <main className='main-content'>
        <header className='topbar'>
          <button
            className='mobile-menu'
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
          <div>
            <p className='eyebrow'>{today}</p>
            <h1>{active}</h1>
          </div>
          <div className='header-actions'>
            <button className='icon-button'>
              <Sparkles size={17} />
            </button>
            <div className='header-avatar'>AD</div>
          </div>
        </header>
        {loading ? (
          <div className='empty-state'>Đang tải dữ liệu từ SQLite...</div>
        ) : error ? (
          <div className='empty-state error-state'>{error}</div>
        ) : !summary || !selectedEmployeeId ? (
          <div className='empty-state'>Chưa có dữ liệu từ SQLite.</div>
        ) : active === 'Nhân viên' ? (
          <EmployeesPage
            employees={employees}
            onUpdate={updateEmployee}
            onDelete={deleteEmployee}
          />
        ) : active === 'Chấm công' ? (
          <AttendancePage
            employeeId={selectedEmployeeId}
            employeeList={employees}
            selectedName={selectedName}
            selectedDate={selectedDate}
            services={services}
            counts={counts}
            totalMoney={totalMoney}
            onEmployeeChange={selectEmployee}
            onDateChange={setSelectedDate}
            onCountChange={updateCount}
            onSave={saveWork}
          />
        ) : active === 'Bảng giá' ? (
          <PricingPage
            employeeList={employees}
            services={services}
            employeeId={selectedEmployeeId}
            onEmployeeChange={selectEmployee}
            onSave={savePricing}
          />
        ) : (
          <Dashboard
            summary={summary}
            employees={employees}
            mode={reportMode}
            period={reportPeriod}
            employeeId={reportEmployeeId}
            onModeChange={(mode) => {
              setReportMode(mode)
              setReportPeriod(mode === 'day' ? today : month)
            }}
            onPeriodChange={setReportPeriod}
            onEmployeeChange={setReportEmployeeId}
            onAttendance={() => changePage('Chấm công')}
            onExport={() =>
              spaApi.exportExcel(
                reportMode,
                reportPeriod,
                reportEmployeeId ?? undefined,
              )
            }
          />
        )}
        {notice && <div className='toast'>✓ {notice}</div>}
      </main>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
