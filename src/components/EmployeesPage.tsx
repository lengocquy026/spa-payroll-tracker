import { Pencil, Save, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import type { Employee } from '../types'

export function EmployeesPage({
  employees,
  onUpdate,
  onDelete,
}: {
  employees: Employee[]
  onUpdate: (id: number, name: string) => Promise<void>
  onDelete: (id: number, password: string) => Promise<void>
}) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const startEdit = (employee: Employee) => {
    setEditingId(employee.id)
    setEditingName(employee.name)
  }
  const saveEdit = async () => {
    if (!editingId || !editingName.trim()) return
    setBusy(true)
    try {
      await onUpdate(editingId, editingName.trim())
      setEditingId(null)
    } finally {
      setBusy(false)
    }
  }
  const confirmDelete = async () => {
    if (!deleteId || !password) return
    setBusy(true)
    try {
      await onDelete(deleteId, password)
      setDeleteId(null)
      setPassword('')
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className='attendance-page employee-page'>
      <div className='page-heading'>
        <div>
          <p className='eyebrow'>NHÂN SỰ</p>
          <h2>Quản lý nhân viên</h2>
        </div>
        <span className='date-pill'>
          {employees.length} nhân viên đang hoạt động
        </span>
      </div>
      <div className='table-card employee-table'>
        <div className='table-head'>
          <span>NHÂN VIÊN</span>
          <span>TRẠNG THÁI</span>
          <span>THAO TÁC</span>
        </div>
        {employees.map((employee) => (
          <div className='table-row' key={employee.id}>
            <div className='employee-cell'>
              {editingId === employee.id ? (
                <input
                  className='employee-name-input'
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                />
              ) : (
                <>
                  <span className='employee-avatar a0'>
                    {employee.name.slice(0, 1)}
                  </span>
                  <strong>{employee.name}</strong>
                </>
              )}
            </div>
            <span className='status'>
              <i />
              Đang hoạt động
            </span>
            <div className='employee-actions'>
              {editingId === employee.id ? (
                <>
                  <button
                    className='table-action save'
                    disabled={busy}
                    onClick={saveEdit}
                  >
                    <Save size={15} />
                    Lưu
                  </button>
                  <button
                    className='table-action'
                    onClick={() => setEditingId(null)}
                  >
                    <X size={15} />
                    Hủy
                  </button>
                </>
              ) : (
                <>
                  <button
                    className='table-action'
                    onClick={() => startEdit(employee)}
                  >
                    <Pencil size={15} />
                    Sửa
                  </button>
                  <button
                    className='table-action danger'
                    onClick={() => setDeleteId(employee.id)}
                  >
                    <Trash2 size={15} />
                    Xóa
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      {deleteId && (
        <div className='modal-backdrop'>
          <div className='confirm-modal'>
            <p className='eyebrow'>XÁC NHẬN XÓA</p>
            <h3>Nhập mật khẩu admin</h3>
            <p className='modal-copy'>
              Nhân viên sẽ bị ẩn khỏi hệ thống nhưng lịch sử chấm công vẫn được
              giữ lại.
            </p>
            <input
              type='password'
              autoFocus
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder='Mật khẩu admin'
              onKeyDown={(event) =>
                event.key === 'Enter' && void confirmDelete()
              }
            />
            <div className='modal-actions'>
              <button
                className='table-action'
                onClick={() => {
                  setDeleteId(null)
                  setPassword('')
                }}
              >
                Hủy
              </button>
              <button
                className='table-action danger'
                disabled={busy || !password}
                onClick={() => void confirmDelete()}
              >
                <Trash2 size={15} />
                Xóa nhân viên
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
