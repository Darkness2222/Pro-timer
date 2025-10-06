import React, { useState, useEffect } from 'react'
import { Lock, Check, Clock, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function AccessManagement({ eventId }) {
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [logs, setLogs] = useState([])

  useEffect(() => {
    if (eventId) {
      loadAccessData()
      const interval = setInterval(loadAccessData, 5000)
      return () => clearInterval(interval)
    }
  }, [eventId])

  const loadAccessData = async () => {
    try {
      const [tokenResult, assignmentsResult, logsResult] = await Promise.all([
        supabase
          .from('event_access_tokens')
          .select('*')
          .eq('event_id', eventId)
          .eq('is_active', true)
          .maybeSingle(),
        supabase
          .from('event_presenter_assignments')
          .select('*')
          .eq('event_id', eventId)
          .order('presenter_name'),
        supabase
          .from('event_access_logs')
          .select('*, event_access_tokens!inner(event_id)')
          .eq('event_access_tokens.event_id', eventId)
          .order('accessed_at', { ascending: false })
          .limit(10)
      ])

      if (tokenResult.data) setToken(tokenResult.data)
      if (assignmentsResult.data) setAssignments(assignmentsResult.data)
      if (logsResult.data) setLogs(logsResult.data)
    } catch (error) {
      console.error('Error loading access data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      </div>
    )
  }

  const claimedCount = assignments.filter(a => a.assigned_at).length
  const totalCount = assignments.length

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <Lock className="w-6 h-6 text-blue-500" />
        <div>
          <h2 className="text-xl font-bold text-white">Access Management</h2>
          <p className="text-sm text-gray-400">Monitor presenter access and claims</p>
        </div>
      </div>

      {token ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">QR Code Scans</div>
              <div className="text-2xl font-bold text-white">
                {token.current_uses}
                {token.max_uses && ` / ${token.max_uses}`}
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Slots Claimed</div>
              <div className="text-2xl font-bold text-white">
                {claimedCount} / {totalCount}
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Status</div>
              <div className="text-lg font-semibold text-green-400">
                Active
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Presenter Claims</h3>
            <div className="space-y-2">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    assignment.assigned_at
                      ? 'bg-green-500/10 border border-green-500/30'
                      : 'bg-gray-700 border border-gray-600'
                  }`}
                >
                  <div>
                    <div className="font-medium text-white">{assignment.presenter_name}</div>
                    {assignment.assigned_at && (
                      <div className="text-xs text-gray-400 mt-1">
                        Claimed {new Date(assignment.assigned_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                  {assignment.assigned_at ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {logs.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Recent Activity</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between p-3 rounded-lg bg-gray-700 text-sm"
                  >
                    <div className="flex-1">
                      <div className="text-white">
                        {log.action === 'viewed' && 'QR code scanned'}
                        {log.action === 'assigned' && `${log.presenter_name} claimed slot`}
                        {log.action === 'error' && 'Access error occurred'}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(log.accessed_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <Lock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No QR code generated yet</p>
          <p className="text-sm text-gray-500 mt-1">Click the QR Code button above to create one</p>
        </div>
      )}
    </div>
  )
}
