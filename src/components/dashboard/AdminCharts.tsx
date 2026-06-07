'use client'

import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import type { BloodRequest, Profile } from '@/types'

interface AdminChartsProps {
  users: Profile[]
  requests: BloodRequest[]
}

const bloodTypeCounts = (requests: BloodRequest[]) =>
  requests.reduce((acc, request) => {
    acc[request.blood_type] = (acc[request.blood_type] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

const urgencyCounts = (requests: BloodRequest[]) =>
  requests.reduce((acc, request) => {
    acc[request.urgency] = (acc[request.urgency] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

const COLORS = ['#C41E3A', '#F97316', '#3B82F6', '#9333EA', '#10B981', '#F59E0B']

export function AdminCharts({ users, requests }: AdminChartsProps) {
  const bloodTypeData = Object.entries(bloodTypeCounts(requests)).map(([blood_type, value]) => ({ blood_type, value }))
  const urgencyData = Object.entries(urgencyCounts(requests)).map(([urgency, value]) => ({ urgency, value }))
  const roleData = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)
  const roleChartData = Object.entries(roleData).map(([role, value]) => ({ role, value }))

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="rounded-3xl border bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900">Requests by blood type</h3>
        <div className="h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bloodTypeData}>
              <XAxis dataKey="blood_type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#C41E3A" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-3xl border bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900">Requests by urgency</h3>
        <div className="h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={urgencyData} dataKey="value" nameKey="urgency" outerRadius={90} label>
                {urgencyData.map((entry, index) => (
                  <Cell key={entry.urgency} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-3xl border bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900">User roles</h3>
        <div className="h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={roleChartData} dataKey="value" nameKey="role" outerRadius={90} label>
                {roleChartData.map((entry, index) => (
                  <Cell key={entry.role} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
