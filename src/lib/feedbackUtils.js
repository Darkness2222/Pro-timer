import { supabase } from './supabase'

export const feedbackUtils = {
  async getFeedbackTags(organizationId) {
    try {
      const { data, error } = await supabase
        .from('feedback_tags')
        .select('*')
        .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
        .order('tag_type', { ascending: true })
        .order('tag_name', { ascending: true })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching feedback tags:', error)
      return { data: null, error }
    }
  },

  async createCustomTag(organizationId, tagName, tagType) {
    try {
      const { data, error } = await supabase
        .from('feedback_tags')
        .insert([{
          organization_id: organizationId,
          tag_name: tagName,
          tag_type: tagType,
          is_core_tag: false
        }])
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error creating custom tag:', error)
      return { data: null, error }
    }
  },

  async deleteCustomTag(tagId) {
    try {
      const { error } = await supabase
        .from('feedback_tags')
        .delete()
        .eq('id', tagId)
        .eq('is_core_tag', false)

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Error deleting custom tag:', error)
      return { error }
    }
  },

  async submitAdminFeedback(feedbackData) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data: approvalSettings } = await supabase
        .from('feedback_approval_settings')
        .select('*')
        .eq('organization_id', feedbackData.organizationId)
        .maybeSingle()

      const autoApprove = approvalSettings?.auto_approve ?? true
      const feedbackStatus = autoApprove ? 'approved' : 'pending_approval'

      const insertData = {
        ...feedbackData,
        submitted_by_id: user.id,
        feedback_status: feedbackStatus,
        approved_at: autoApprove ? new Date().toISOString() : null,
        approved_by_id: autoApprove ? user.id : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('admin_feedback')
        .insert([insertData])
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error submitting admin feedback:', error)
      return { data: null, error }
    }
  },

  async getAdminFeedbackForTimer(timerId) {
    try {
      const { data, error } = await supabase
        .from('admin_feedback')
        .select(`
          *,
          submitted_by:submitted_by_id(email, id),
          approved_by:approved_by_id(email, id)
        `)
        .eq('timer_id', timerId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching admin feedback:', error)
      return { data: null, error }
    }
  },

  async getAdminFeedbackForEvent(eventId) {
    try {
      const { data, error } = await supabase
        .from('admin_feedback')
        .select(`
          *,
          submitted_by:submitted_by_id(email, id),
          approved_by:approved_by_id(email, id),
          timer:timer_id(name, presenter_name)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching event admin feedback:', error)
      return { data: null, error }
    }
  },

  async getAdminFeedbackForPresenter(presenterId) {
    try {
      const { data, error } = await supabase
        .from('admin_feedback')
        .select(`
          *,
          submitted_by:submitted_by_id(email, id),
          timer:timer_id(name, presenter_name),
          event:event_id(name, event_date)
        `)
        .eq('presenter_id', presenterId)
        .eq('feedback_status', 'approved')
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching presenter admin feedback:', error)
      return { data: null, error }
    }
  },

  async approveFeedback(feedbackId) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('admin_feedback')
        .update({
          feedback_status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by_id: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', feedbackId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error approving feedback:', error)
      return { data: null, error }
    }
  },

  async submitAttendeeFeedback(feedbackData) {
    try {
      const { data, error } = await supabase
        .from('attendee_feedback')
        .insert([{
          ...feedbackData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error submitting attendee feedback:', error)
      return { data: null, error }
    }
  },

  async getAttendeeFeedbackForEvent(eventId) {
    try {
      const { data, error } = await supabase
        .from('attendee_feedback')
        .select(`
          *,
          timer:timer_id(name, presenter_name)
        `)
        .eq('event_id', eventId)
        .eq('is_flagged', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching attendee feedback:', error)
      return { data: null, error }
    }
  },

  async getAttendeeFeedbackForPresenter(presenterId) {
    try {
      const { data, error } = await supabase
        .from('attendee_feedback')
        .select(`
          *,
          timer:timer_id(name, presenter_name),
          event:event_id(name, event_date)
        `)
        .eq('presenter_id', presenterId)
        .eq('is_flagged', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching presenter attendee feedback:', error)
      return { data: null, error }
    }
  },

  async flagAttendeeFeedback(feedbackId, reason) {
    try {
      const { data, error } = await supabase
        .from('attendee_feedback')
        .update({
          is_flagged: true,
          flagged_reason: reason
        })
        .eq('id', feedbackId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error flagging feedback:', error)
      return { data: null, error }
    }
  },

  async createOrUpdateEventFeedbackSettings(settings) {
    try {
      const { data, error } = await supabase
        .from('event_feedback_settings')
        .upsert([{
          ...settings,
          updated_at: new Date().toISOString()
        }], {
          onConflict: 'event_id'
        })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error saving event feedback settings:', error)
      return { data: null, error }
    }
  },

  async getEventFeedbackSettings(eventId) {
    try {
      const { data, error } = await supabase
        .from('event_feedback_settings')
        .select('*')
        .eq('event_id', eventId)
        .maybeSingle()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching event feedback settings:', error)
      return { data: null, error }
    }
  },

  async getEventFeedbackSettingsByToken(token) {
    try {
      const { data, error } = await supabase
        .from('event_feedback_settings')
        .select(`
          *,
          event:event_id(
            id,
            name,
            event_date,
            description
          )
        `)
        .eq('feedback_link_token', token)
        .eq('is_closed', false)
        .maybeSingle()

      if (error) throw error

      if (data && data.link_expires_at) {
        const expiresAt = new Date(data.link_expires_at)
        if (expiresAt < new Date()) {
          return { data: null, error: { message: 'Feedback link has expired' } }
        }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error fetching event feedback settings by token:', error)
      return { data: null, error }
    }
  },

  async getOrCreateFeedbackApprovalSettings(organizationId) {
    try {
      let { data, error } = await supabase
        .from('feedback_approval_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle()

      if (error) throw error

      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from('feedback_approval_settings')
          .insert([{
            organization_id: organizationId,
            require_approval: false,
            auto_approve: true
          }])
          .select()
          .single()

        if (insertError) throw insertError
        data = newData
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error fetching/creating approval settings:', error)
      return { data: null, error }
    }
  },

  async updateFeedbackApprovalSettings(organizationId, settings) {
    try {
      const { data, error } = await supabase
        .from('feedback_approval_settings')
        .upsert([{
          organization_id: organizationId,
          ...settings,
          updated_at: new Date().toISOString()
        }], {
          onConflict: 'organization_id'
        })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error updating approval settings:', error)
      return { data: null, error }
    }
  },

  async getEventPresentersForFeedback(eventId) {
    try {
      const { data, error } = await supabase
        .from('event_presenter_assignments')
        .select(`
          *,
          timer:timer_id(
            id,
            name,
            presenter_name,
            duration,
            status,
            start_time,
            end_time,
            actual_duration
          ),
          presenter:presenter_id(
            id,
            email
          )
        `)
        .eq('event_id', eventId)
        .order('order_index', { ascending: true })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching event presenters:', error)
      return { data: null, error }
    }
  },

  calculateFeedbackStats(feedbackArray) {
    if (!feedbackArray || feedbackArray.length === 0) {
      return {
        averageRating: 0,
        totalCount: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      }
    }

    const totalCount = feedbackArray.length
    const sumRatings = feedbackArray.reduce((sum, fb) => sum + fb.overall_rating, 0)
    const averageRating = sumRatings / totalCount

    const ratingDistribution = feedbackArray.reduce((dist, fb) => {
      dist[fb.overall_rating] = (dist[fb.overall_rating] || 0) + 1
      return dist
    }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 })

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalCount,
      ratingDistribution
    }
  },

  extractTagFrequencies(feedbackArray) {
    if (!feedbackArray || feedbackArray.length === 0) {
      return []
    }

    const tagCounts = {}

    feedbackArray.forEach(feedback => {
      if (feedback.selected_tags && Array.isArray(feedback.selected_tags)) {
        feedback.selected_tags.forEach(tagId => {
          tagCounts[tagId] = (tagCounts[tagId] || 0) + 1
        })
      }
    })

    return Object.entries(tagCounts)
      .map(([tagId, count]) => ({ tagId, count }))
      .sort((a, b) => b.count - a.count)
  }
}

export default feedbackUtils
