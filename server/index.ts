import express from 'express'
import Database from 'better-sqlite3'
import ExcelJS from 'exceljs'
import path from 'node:path'
import fs from 'node:fs'

type WorkItem = { serviceId: number; quantity: number }
const app = express()
const port = Number(process.env.PORT ?? 3001)
const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123'
const dataDir = path.resolve(process.env.DATA_DIR ?? 'data')
fs.mkdirSync(dataDir, { recursive: true })
const db = new Database(path.join(dataDir, 'spa.sqlite'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')
db.exec(`
  CREATE TABLE IF NOT EXISTS employees (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1);
  CREATE TABLE IF NOT EXISTS services (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, price INTEGER NOT NULL, category TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1);
  CREATE TABLE IF NOT EXISTS employee_service_prices (employee_id INTEGER NOT NULL, service_id INTEGER NOT NULL, price INTEGER NOT NULL, PRIMARY KEY (employee_id, service_id), FOREIGN KEY(employee_id) REFERENCES employees(id), FOREIGN KEY(service_id) REFERENCES services(id));
  CREATE TABLE IF NOT EXISTS work_records (id INTEGER PRIMARY KEY AUTOINCREMENT, employee_id INTEGER NOT NULL, work_date TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(employee_id, work_date), FOREIGN KEY(employee_id) REFERENCES employees(id));
  CREATE TABLE IF NOT EXISTS work_record_items (id INTEGER PRIMARY KEY AUTOINCREMENT, work_record_id INTEGER NOT NULL, service_id INTEGER NOT NULL, quantity INTEGER NOT NULL DEFAULT 0, unit_price INTEGER NOT NULL DEFAULT 0, UNIQUE(work_record_id, service_id), FOREIGN KEY(work_record_id) REFERENCES work_records(id) ON DELETE CASCADE, FOREIGN KEY(service_id) REFERENCES services(id));
`)
app.use((req, res, next) => {
  const allowedOrigin = process.env.FRONTEND_URL ?? '*'
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})
const columns = db
  .prepare('PRAGMA table_info(work_record_items)')
  .all() as Array<{ name: string }>
if (!columns.some((column) => column.name === 'unit_price'))
  db.exec(
    'ALTER TABLE work_record_items ADD COLUMN unit_price INTEGER NOT NULL DEFAULT 0',
  )
db.exec(
  'UPDATE work_record_items SET unit_price = (SELECT price FROM services WHERE services.id = work_record_items.service_id) WHERE unit_price = 0',
)

if (
  (
    db.prepare('SELECT COUNT(*) count FROM employees').get() as {
      count: number
    }
  ).count === 0
) {
  const insert = db.prepare('INSERT INTO employees (name) VALUES (?)')
  ;['Kin', 'A', 'B', 'Linh'].forEach((name) => insert.run(name))
}
const serviceCatalog: Array<[string, number, string]> = [
  ['60 phút', 60000, 'Massage'],
  ['90 phút', 90000, 'Massage'],
  ['120 phút', 120000, 'Massage'],
  ['Thái 60 phút', 70000, 'Massage'],
  ['Thái 90 phút', 100000, 'Massage'],
  ['Thái 120 phút', 120000, 'Massage'],
  ['Yêu cầu', 20000, 'Dịch vụ thêm'],
  ['Gội 30 phút', 20000, 'Gội đầu'],
  ['Gội 60 phút', 35000, 'Gội đầu'],
  ['Gội 90 phút', 60000, 'Gội đầu'],
  ['Di chuyển', 10000, 'Dịch vụ thêm'],
]
const syncServices = db.transaction(() => {
  // Hide services removed from the catalog without deleting historical records.
  db.prepare('UPDATE services SET active = 0').run()
  const find = db.prepare('SELECT id, price FROM services WHERE name = ? LIMIT 1')
  const insert = db.prepare(
    'INSERT INTO services (name, price, category) VALUES (?, ?, ?)',
  )
  const update = db.prepare(
    'UPDATE services SET price = ?, category = ?, active = 1 WHERE id = ?',
  )
  const updateInheritedPrices = db.prepare(
    'UPDATE employee_service_prices SET price = ? WHERE service_id = ? AND price = ?',
  )
  for (const [name, price, category] of serviceCatalog) {
    const existing = find.get(name) as { id: number; price: number } | undefined
    if (existing) {
      update.run(price, category, existing.id)
      // Keep custom employee prices; update only prices inherited from the old default.
      updateInheritedPrices.run(price, existing.id, existing.price)
    } else {
      insert.run(name, price, category)
    }
  }
})
syncServices()
db.exec(
  'INSERT OR IGNORE INTO employee_service_prices (employee_id, service_id, price) SELECT e.id, s.id, s.price FROM employees e CROSS JOIN services s',
)
app.use(express.json())

app.get('/api/employees', (_req, res) =>
  res.json(
    db
      .prepare('SELECT id, name FROM employees WHERE active = 1 ORDER BY name')
      .all(),
  ),
)
app.post('/api/employees', (req, res) => {
  const name = String(req.body?.name ?? '').trim()
  if (!name) return res.status(400).json({ error: 'Tên nhân viên không hợp lệ' })
  const create = db.transaction(() => {
    const employee = db.prepare('INSERT INTO employees (name, active) VALUES (?, 1) RETURNING id, name').get(name) as { id: number; name: string }
    db.prepare('INSERT INTO employee_service_prices (employee_id, service_id, price) SELECT ?, id, price FROM services WHERE active = 1').run(employee.id)
    return employee
  })
  res.status(201).json(create())
})
app.put('/api/employees/:id', (req, res) => {
  const employeeId = Number(req.params.id)
  const name = String(req.body?.name ?? '').trim()
  if (!employeeId || !name) return res.status(400).json({ error: 'Tên nhân viên không hợp lệ' })
  const result = db.prepare('UPDATE employees SET name = ? WHERE id = ? AND active = 1').run(name, employeeId)
  if (!result.changes) return res.status(404).json({ error: 'Không tìm thấy nhân viên' })
  res.json({ ok: true })
})
app.delete('/api/employees/:id', (req, res) => {
  const employeeId = Number(req.params.id)
  const password = String(req.body?.adminPassword ?? '')
  if (!employeeId || password !== adminPassword) return res.status(403).json({ error: 'Mật khẩu admin không đúng' })
  const result = db.prepare('UPDATE employees SET active = 0 WHERE id = ? AND active = 1').run(employeeId)
  if (!result.changes) return res.status(404).json({ error: 'Không tìm thấy nhân viên' })
  res.json({ ok: true })
})
app.get('/api/services', (req, res) => {
  const employeeId = Number(req.query.employeeId)
  const query = employeeId
    ? `SELECT s.id, s.name, s.category "group", esp.price FROM services s JOIN employee_service_prices esp ON esp.service_id = s.id AND esp.employee_id = ? WHERE s.active = 1 ORDER BY s.id`
    : 'SELECT id, name, category "group", price FROM services WHERE active = 1 ORDER BY id'
  res.json(
    employeeId ? db.prepare(query).all(employeeId) : db.prepare(query).all(),
  )
})
app.get('/api/pricing', (req, res) => {
  const employeeId = Number(req.query.employeeId)
  if (!employeeId) return res.status(400).json({ error: 'Thiếu employeeId' })
  res.json(
    db
      .prepare(
        'SELECT s.id, s.name, s.category "group", esp.price FROM services s JOIN employee_service_prices esp ON esp.service_id = s.id AND esp.employee_id = ? WHERE s.active = 1 ORDER BY s.id',
      )
      .all(employeeId),
  )
})
app.put('/api/pricing', (req, res) => {
  const { employeeId, prices } = req.body as {
    employeeId: number
    prices: Array<{ serviceId: number; price: number }>
  }
  if (!employeeId || !Array.isArray(prices))
    return res.status(400).json({ error: 'Bảng giá không hợp lệ' })
  const save = db.transaction(() => {
    const update = db.prepare(
      'INSERT INTO employee_service_prices (employee_id, service_id, price) VALUES (?, ?, ?) ON CONFLICT(employee_id, service_id) DO UPDATE SET price = excluded.price',
    )
    prices.forEach(({ serviceId, price }) =>
      update.run(
        employeeId,
        serviceId,
        Math.max(0, Math.round(Number(price) || 0)),
      ),
    )
  })
  save()
  res.json({ ok: true })
})
app.get('/api/summary', (req, res) => {
  const mode = req.query.mode === 'day' ? 'day' : 'month'
  const period = String(
    req.query.period ??
      new Date().toISOString().slice(0, mode === 'day' ? 10 : 7),
  )
  const employeeId = Number(req.query.employeeId ?? 0)
  const dateFilter =
    mode === 'day' ? 'r.work_date = ?' : 'substr(r.work_date, 1, 7) = ?'
  const employeeFilter = employeeId ? ' AND e.id = ?' : ''
  const params = employeeId ? [period, employeeId] : [period]
  const rows = db
    .prepare(
      `SELECT e.id, e.name, COALESCE(SUM(i.quantity), 0) services, COALESCE(SUM(i.quantity * i.unit_price), 0) money FROM employees e LEFT JOIN work_records r ON r.employee_id = e.id AND ${dateFilter} LEFT JOIN work_record_items i ON i.work_record_id = r.id AND i.quantity > 0 AND i.service_id IN (SELECT id FROM services WHERE active = 1) WHERE e.active = 1${employeeFilter} GROUP BY e.id ORDER BY money DESC`,
    )
    .all(...params) as Array<{
    id: number
    name: string
    services: number
    money: number
  }>
  const total = rows.reduce(
    (result, row) => ({
      services: result.services + Number(row.services),
      money: result.money + Number(row.money),
    }),
    { services: 0, money: 0 },
  )
  res.json({
    month: mode === 'month' ? period : period.slice(0, 7),
    total,
    employees: rows,
  })
})
app.get('/api/work-records', (req, res) => {
  const employeeId = Number(req.query.employeeId)
  const workDate = String(req.query.date ?? '')
  if (!employeeId || !/^\d{4}-\d{2}-\d{2}$/.test(workDate))
    return res
      .status(400)
      .json({ error: 'Thiếu nhân viên hoặc ngày chấm công' })
  const record = db
    .prepare(
      'SELECT id FROM work_records WHERE employee_id = ? AND work_date = ?',
    )
    .get(employeeId, workDate) as { id: number } | undefined
  if (!record) return res.json({ id: null, employeeId, workDate, counts: {} })
  const rows = db
    .prepare(
      'SELECT service_id serviceId, quantity FROM work_record_items WHERE work_record_id = ? AND service_id IN (SELECT id FROM services WHERE active = 1)',
    )
    .all(record.id) as Array<{ serviceId: number; quantity: number }>
  res.json({
    id: record.id,
    employeeId,
    workDate,
    counts: Object.fromEntries(
      rows.map((row) => [row.serviceId, row.quantity]),
    ),
  })
})
app.post('/api/work-records', (req, res) => {
  const { employeeId, workDate, items } = req.body as {
    employeeId: number
    workDate: string
    items: WorkItem[]
  }
  if (
    !employeeId ||
    !/^\d{4}-\d{2}-\d{2}$/.test(workDate) ||
    !Array.isArray(items)
  )
    return res.status(400).json({ error: 'Dữ liệu bảng công không hợp lệ' })
  const save = db.transaction(() => {
    const record = db
      .prepare(
        'INSERT INTO work_records (employee_id, work_date) VALUES (?, ?) ON CONFLICT(employee_id, work_date) DO UPDATE SET created_at = CURRENT_TIMESTAMP RETURNING id',
      )
      .get(employeeId, workDate) as { id: number }
    db.prepare('DELETE FROM work_record_items WHERE work_record_id = ? AND service_id NOT IN (SELECT id FROM services WHERE active = 1)').run(record.id)
    const item = db.prepare(
      `INSERT INTO work_record_items (work_record_id, service_id, quantity, unit_price) SELECT ?, ?, ?, esp.price FROM employee_service_prices esp JOIN services s ON s.id = esp.service_id AND s.active = 1 WHERE esp.employee_id = ? AND esp.service_id = ? ON CONFLICT(work_record_id, service_id) DO UPDATE SET quantity = excluded.quantity, unit_price = excluded.unit_price`,
    )
    items.forEach(({ serviceId, quantity }) =>
      item.run(
        record.id,
        serviceId,
        Math.max(0, Math.floor(Number(quantity) || 0)),
        employeeId,
        serviceId,
      ),
    )
    return record.id
  })
  res.json({ id: save() })
})
app.get('/api/export.xlsx', async (req, res) => {
  const mode = req.query.mode === 'day' ? 'day' : 'month'
  const period = String(
    req.query.period ??
      new Date().toISOString().slice(0, mode === 'day' ? 10 : 7),
  )
  const employeeId = Number(req.query.employeeId ?? 0)
  const dateFilter =
    mode === 'day' ? 'r.work_date = ?' : 'substr(r.work_date, 1, 7) = ?'
  const employeeFilter = employeeId ? ' AND e.id = ?' : ''
  const params = employeeId ? [period, employeeId] : [period]
  const rows = db
    .prepare(
      `SELECT r.work_date workDate, e.name employee, s.name service, i.unit_price price, i.quantity, i.quantity * i.unit_price total FROM work_records r JOIN employees e ON e.id = r.employee_id JOIN work_record_items i ON i.work_record_id = r.id JOIN services s ON s.id = i.service_id AND s.active = 1 WHERE ${dateFilter}${employeeFilter} AND i.quantity > 0 ORDER BY r.work_date, e.name, s.id`,
    )
    .all(...params) as Array<Record<string, string | number>>
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Bảng công')
  sheet.columns = [
    { header: 'Ngày', key: 'workDate', width: 14 },
    { header: 'Nhân viên', key: 'employee', width: 18 },
    { header: 'Dịch vụ', key: 'service', width: 22 },
    { header: 'Đơn giá riêng', key: 'price', width: 16 },
    { header: 'Số lượng', key: 'quantity', width: 12 },
    { header: 'Thành tiền', key: 'total', width: 15 },
  ]
  sheet.addRows(rows)
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } }
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '173F3C' },
  }
  sheet.getColumn(4).numFmt = '#,##0'
  sheet.getColumn(6).numFmt = '#,##0'
  sheet.autoFilter = 'A1:F1'
  sheet.views = [{ state: 'frozen', ySplit: 1 }]
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="bang-cong-${period}.xlsx"`,
  )
  await workbook.xlsx.write(res)
  res.end()
})
app.listen(port, () =>
  console.log(`SQLite API running at http://localhost:${port}`),
)
