export type Employee = { id: number; name: string };
export type Service = { id: number; name: string; price: number; group: string };
export type Counts = Record<number, number>;
export type SummaryEmployee = Employee & { services: number; money: number };
export type Summary = { month: string; total: { services: number; money: number }; employees: SummaryEmployee[] };
export type WorkRecord = { id: number | null; employeeId: number; workDate: string; counts: Counts };
