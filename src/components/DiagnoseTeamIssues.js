import React, { useState } from 'react'
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function DiagnoseTeamIssues({ session }) {
  const [diagnosis, setDiagnosis] = useState(null)
  const [fixing, setFixing] = useState(false)
  const [fixed, setFixed] = useState(false)

  const runDiagnosis = async () => {
    setDiagnosis({ loading: true })

    try {
      const userId = session?.user?.id
      if (!userId) {
        setDiagnosis({ error: 'No user session found' })
        return
      }

      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('*, organization:organization_id(*)')
        .eq('user_id', userId)
        .maybeSingle()

      if (memberError) {
        setDiagnosis({ error: 'Database error: ' + memberError.message })
        return
      }

      if (!memberData) {
        setDiagnosis({
          issue: 'NO_MEMBERSHIP',
          message: 'User is not a member of any organization',
          canFix: true
        })
        return
      }

      const issues = []

      if (memberData.role === 'admin' && !memberData.is_owner) {
        issues.push({
          type: 'ADMIN_NOT_OWNER',
          message: 'You have admin role but is_owner is not set',
          details: 'This can happen if your account was created before the role system update'
        })
      }

      if (!memberData.organization) {
        issues.push({
          type: 'ORPHANED_MEMBERSHIP',
          message: 'Organization record is missing',
          details: 'Your membership exists but the organization was deleted'
        })
      }

      if (issues.length > 0) {
        setDiagnosis({
          issues,
          memberData,
          canFix: true
        })
      } else {
        setDiagnosis({
          healthy: true,
          memberData,
          message: 'Everything looks good! You should see the Invite button.'
        })
      }
    } catch (error) {
      setDiagnosis({ error: 'Unexpected error: ' + error.message })
    }
  }

  const fixIssues = async () => {
    setFixing(true)

    try {
      const userId = session?.user?.id

      if (diagnosis.issue === 'NO_MEMBERSHIP') {
        const { data: orgData } = await supabase
          .from('organizations')
          .insert({
            name: session.user.email || 'My Organization',
            owner_id: userId,
            counted_user_count: 0
          })
          .select()
          .single()

        if (orgData) {
          await supabase
            .from('organization_members')
            .insert({
              organization_id: orgData.id,
              user_id: userId,
              role: 'owner',
              is_owner: true,
              counted_in_limit: false
            })

          setFixed(true)
          setDiagnosis({ fixed: true, message: 'Organization created successfully!' })
        }
      } else if (diagnosis.issues?.some(i => i.type === 'ADMIN_NOT_OWNER')) {
        const { data: memberData } = await supabase
          .from('organization_members')
          .select('id, organization_id')
          .eq('user_id', userId)
          .maybeSingle()

        if (memberData) {
          await supabase
            .from('organization_members')
            .update({
              role: 'owner',
              is_owner: true,
              counted_in_limit: false
            })
            .eq('id', memberData.id)

          await supabase
            .from('organizations')
            .update({ owner_id: userId })
            .eq('id', memberData.organization_id)

          setFixed(true)
          setDiagnosis({ fixed: true, message: 'Role updated to owner successfully!' })
        }
      }
    } catch (error) {
      setDiagnosis({ error: 'Fix failed: ' + error.message })
    } finally {
      setFixing(false)
    }
  }

  return (
    <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-yellow-400 font-bold mb-2">Troubleshooting: Can't see Invite button?</h3>
          <p className="text-yellow-200 text-sm mb-3">
            Click the button below to diagnose and fix common issues with team management permissions.
          </p>

          <button
            onClick={runDiagnosis}
            disabled={diagnosis?.loading}
            className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 mb-3"
          >
            <RefreshCw className={`w-4 h-4 ${diagnosis?.loading ? 'animate-spin' : ''}`} />
            Run Diagnosis
          </button>

          {diagnosis && !diagnosis.loading && (
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              {diagnosis.error && (
                <div className="text-red-400">
                  <strong>Error:</strong> {diagnosis.error}
                </div>
              )}

              {diagnosis.healthy && (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <div>
                    <strong>All Good!</strong>
                    <p className="text-sm text-gray-300 mt-1">{diagnosis.message}</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Role: {diagnosis.memberData.role} | Owner: {diagnosis.memberData.is_owner ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              )}

              {diagnosis.issue && (
                <div>
                  <div className="text-yellow-400 font-semibold mb-2">Issue Found:</div>
                  <div className="text-gray-300 text-sm mb-3">{diagnosis.message}</div>
                  {diagnosis.canFix && !fixed && (
                    <button
                      onClick={fixIssues}
                      disabled={fixing}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      {fixing ? 'Fixing...' : 'Fix Automatically'}
                    </button>
                  )}
                </div>
              )}

              {diagnosis.issues && diagnosis.issues.length > 0 && (
                <div>
                  <div className="text-yellow-400 font-semibold mb-2">Issues Found:</div>
                  {diagnosis.issues.map((issue, index) => (
                    <div key={index} className="mb-3">
                      <div className="text-gray-300 text-sm font-medium">{issue.message}</div>
                      <div className="text-gray-400 text-xs mt-1">{issue.details}</div>
                    </div>
                  ))}
                  {diagnosis.canFix && !fixed && (
                    <button
                      onClick={fixIssues}
                      disabled={fixing}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 mt-3"
                    >
                      {fixing ? 'Fixing...' : 'Fix Automatically'}
                    </button>
                  )}
                </div>
              )}

              {diagnosis.fixed && (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <div>
                    <strong>Fixed!</strong>
                    <p className="text-sm text-gray-300 mt-1">{diagnosis.message}</p>
                    <p className="text-sm text-yellow-300 mt-2">
                      Please close and reopen Team Management to see the changes.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
