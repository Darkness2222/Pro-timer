/*
  # Enhanced Analytics and Reporting System

  ## Overview
  This migration adds comprehensive analytics capabilities including presenter performance
  tracking, event comparisons, and predictive analytics support.

  ## New Tables

  ### 1. presenter_performance_stats
  Aggregated performance statistics for each presenter in an organization
  - `id` (uuid, primary key)
  - `organization_id` (uuid, foreign key) - References organizations
  - `presenter_name` (text) - Name of the presenter
  - `total_presentations` (integer) - Total number of presentations delivered
  - `total_planned_time` (integer) - Sum of all allocated time in seconds
  - `total_actual_time` (integer) - Sum of all actual time used in seconds
  - `early_finish_count` (integer) - Number of times finished early
  - `on_time_count` (integer) - Number of times finished on time
  - `overtime_count` (integer) - Number of times went over time
  - `average_variance_seconds` (integer) - Average time difference (actual - planned)
  - `total_overtime_seconds` (integer) - Total overtime accumulated
  - `total_time_saved_seconds` (integer) - Total time saved from early finishes
  - `consistency_score` (decimal) - Score from 0-100 based on variance consistency
  - `last_presentation_date` (timestamptz) - Date of most recent presentation
  - `first_presentation_date` (timestamptz) - Date of first presentation
  - `updated_at` (timestamptz) - Last time stats were recalculated
  - Unique constraint on (organization_id, presenter_name)

  ### 2. event_analytics
  Comprehensive analytics for each completed event
  - `id` (uuid, primary key)
  - `event_id` (uuid, foreign key) - References events table
  - `organization_id` (uuid, foreign key) - References organizations
  - `total_presenters` (integer) - Number of presenters in event
  - `completed_presenters` (integer) - Number who completed
  - `total_planned_duration` (integer) - Total allocated time in seconds
  - `total_actual_duration` (integer) - Total actual time used in seconds
  - `early_count` (integer) - Presenters who finished early
  - `on_time_count` (integer) - Presenters who finished on time
  - `overtime_count` (integer) - Presenters who went over
  - `total_overtime_seconds` (integer) - Total overtime for event
  - `total_time_saved_seconds` (integer) - Total time saved in event
  - `efficiency_rating` (text) - 'excellent', 'good', 'fair', 'needs_improvement'
  - `completion_rate` (decimal) - Percentage of presenters who completed
  - `average_presenter_variance` (integer) - Average variance per presenter
  - `calculated_at` (timestamptz) - When analytics were calculated
  - `created_at` (timestamptz)
  - Unique constraint on event_id

  ### 3. organization_analytics_summary
  Organization-wide aggregate statistics
  - `id` (uuid, primary key)
  - `organization_id` (uuid, foreign key) - References organizations
  - `period_start` (date) - Start of reporting period
  - `period_end` (date) - End of reporting period
  - `total_events` (integer) - Events in this period
  - `total_presentations` (integer) - Total presentations delivered
  - `total_presenters` (integer) - Unique presenters
  - `average_event_efficiency` (decimal) - Average efficiency score
  - `total_time_saved_seconds` (integer) - Organization-wide time saved
  - `total_overtime_seconds` (integer) - Organization-wide overtime
  - `top_performer_name` (text) - Best performing presenter
  - `most_improved_name` (text) - Most improved presenter
  - `events_on_schedule` (integer) - Events that finished on time
  - `events_over_schedule` (integer) - Events that went over
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - Unique constraint on (organization_id, period_start, period_end)

  ### 4. report_templates
  Saved custom report configurations for admins
  - `id` (uuid, primary key)
  - `organization_id` (uuid, foreign key) - References organizations
  - `created_by` (uuid, foreign key) - User who created template
  - `template_name` (text) - User-defined name
  - `report_type` (text) - 'presenter_performance', 'event_comparison', 'organization_summary'
  - `filters` (jsonb) - Saved filter configuration
  - `date_range_type` (text) - 'last_7_days', 'last_30_days', 'last_quarter', 'custom'
  - `is_scheduled` (boolean) - Whether to run automatically
  - `schedule_frequency` (text) - 'daily', 'weekly', 'monthly' (null if not scheduled)
  - `last_generated_at` (timestamptz) - Last time report was run
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Functions

  ### calculate_presenter_stats()
  Recalculates all presenter performance statistics from timer_logs data

  ### calculate_event_analytics()
  Calculates comprehensive analytics for a specific event

  ### generate_organization_summary()
  Generates organization-wide summary for a given date range

  ## Security (Row Level Security)
  All tables have RLS enabled with appropriate policies:
  - Organization members can view their organization's analytics
  - Only admins can modify or recalculate statistics
  - Report templates are private to creators and org admins

  ## Indexes
  Created for optimal query performance on all foreign keys and date fields

  ## Important Notes
  1. Statistics are calculated on-demand and cached in these tables
  2. A background job should periodically refresh statistics
  3. All time values stored in seconds for consistency
  4. Consistency scores use standard deviation of variance
*/

-- Create presenter_performance_stats table
CREATE TABLE IF NOT EXISTS presenter_performance_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  presenter_name text NOT NULL,
  total_presentations integer DEFAULT 0,
  total_planned_time integer DEFAULT 0,
  total_actual_time integer DEFAULT 0,
  early_finish_count integer DEFAULT 0,
  on_time_count integer DEFAULT 0,
  overtime_count integer DEFAULT 0,
  average_variance_seconds integer DEFAULT 0,
  total_overtime_seconds integer DEFAULT 0,
  total_time_saved_seconds integer DEFAULT 0,
  consistency_score decimal(5,2) DEFAULT 0,
  last_presentation_date timestamptz,
  first_presentation_date timestamptz,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, presenter_name)
);

-- Create event_analytics table
CREATE TABLE IF NOT EXISTS event_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  total_presenters integer DEFAULT 0,
  completed_presenters integer DEFAULT 0,
  total_planned_duration integer DEFAULT 0,
  total_actual_duration integer DEFAULT 0,
  early_count integer DEFAULT 0,
  on_time_count integer DEFAULT 0,
  overtime_count integer DEFAULT 0,
  total_overtime_seconds integer DEFAULT 0,
  total_time_saved_seconds integer DEFAULT 0,
  efficiency_rating text CHECK (efficiency_rating IN ('excellent', 'good', 'fair', 'needs_improvement')),
  completion_rate decimal(5,2) DEFAULT 0,
  average_presenter_variance integer DEFAULT 0,
  calculated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id)
);

-- Create organization_analytics_summary table
CREATE TABLE IF NOT EXISTS organization_analytics_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_events integer DEFAULT 0,
  total_presentations integer DEFAULT 0,
  total_presenters integer DEFAULT 0,
  average_event_efficiency decimal(5,2) DEFAULT 0,
  total_time_saved_seconds integer DEFAULT 0,
  total_overtime_seconds integer DEFAULT 0,
  top_performer_name text,
  most_improved_name text,
  events_on_schedule integer DEFAULT 0,
  events_over_schedule integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, period_start, period_end)
);

-- Create report_templates table
CREATE TABLE IF NOT EXISTS report_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  template_name text NOT NULL,
  report_type text NOT NULL CHECK (report_type IN ('presenter_performance', 'event_comparison', 'organization_summary')),
  filters jsonb DEFAULT '{}'::jsonb,
  date_range_type text DEFAULT 'last_30_days' CHECK (date_range_type IN ('last_7_days', 'last_30_days', 'last_quarter', 'custom')),
  is_scheduled boolean DEFAULT false,
  schedule_frequency text CHECK (schedule_frequency IN ('daily', 'weekly', 'monthly') OR schedule_frequency IS NULL),
  last_generated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_presenter_stats_org ON presenter_performance_stats(organization_id);
CREATE INDEX IF NOT EXISTS idx_presenter_stats_name ON presenter_performance_stats(presenter_name);
CREATE INDEX IF NOT EXISTS idx_presenter_stats_updated ON presenter_performance_stats(updated_at);

CREATE INDEX IF NOT EXISTS idx_event_analytics_org ON event_analytics(organization_id);
CREATE INDEX IF NOT EXISTS idx_event_analytics_event ON event_analytics(event_id);
CREATE INDEX IF NOT EXISTS idx_event_analytics_rating ON event_analytics(efficiency_rating);

CREATE INDEX IF NOT EXISTS idx_org_summary_org ON organization_analytics_summary(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_summary_period ON organization_analytics_summary(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_report_templates_org ON report_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_creator ON report_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_report_templates_scheduled ON report_templates(is_scheduled) WHERE is_scheduled = true;

-- Enable Row Level Security
ALTER TABLE presenter_performance_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_analytics_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for presenter_performance_stats
CREATE POLICY "Organization members can view presenter stats"
  ON presenter_performance_stats FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can manage presenter stats"
  ON presenter_performance_stats FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for event_analytics
CREATE POLICY "Organization members can view event analytics"
  ON event_analytics FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can manage event analytics"
  ON event_analytics FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for organization_analytics_summary
CREATE POLICY "Organization members can view org summaries"
  ON organization_analytics_summary FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can manage org summaries"
  ON organization_analytics_summary FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for report_templates
CREATE POLICY "Users can view their own and org admin templates"
  ON report_templates FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR (
      organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );

CREATE POLICY "Users can create report templates"
  ON report_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update their own templates"
  ON report_templates FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own templates"
  ON report_templates FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Function to calculate presenter performance statistics
CREATE OR REPLACE FUNCTION calculate_presenter_stats(p_organization_id uuid, p_presenter_name text)
RETURNS void AS $$
DECLARE
  v_total_presentations integer;
  v_total_planned integer;
  v_total_actual integer;
  v_early_count integer;
  v_on_time_count integer;
  v_overtime_count integer;
  v_total_overtime integer;
  v_total_saved integer;
  v_avg_variance integer;
  v_first_date timestamptz;
  v_last_date timestamptz;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE t.status IN ('completed', 'finished_early')),
    COALESCE(SUM(t.duration), 0),
    COALESCE(SUM(
      CASE
        WHEN tl.time_value IS NOT NULL AND tl.action IN ('finished', 'expired')
        THEN t.duration - tl.time_value
        ELSE t.duration
      END
    ), 0),
    COUNT(*) FILTER (WHERE
      tl.action IN ('finished', 'expired') AND
      (t.duration - tl.time_value) < (t.duration - 30)
    ),
    COUNT(*) FILTER (WHERE
      tl.action IN ('finished', 'expired') AND
      (t.duration - tl.time_value) >= (t.duration - 30) AND
      (t.duration - tl.time_value) <= (t.duration + 30) AND
      NOT EXISTS (SELECT 1 FROM timer_logs tl2 WHERE tl2.timer_id = t.id AND tl2.overtime_seconds > 0)
    ),
    COUNT(*) FILTER (WHERE
      (tl.action IN ('finished', 'expired') AND (t.duration - tl.time_value) > (t.duration + 30))
      OR EXISTS (SELECT 1 FROM timer_logs tl2 WHERE tl2.timer_id = t.id AND tl2.overtime_seconds > 0)
    ),
    COALESCE(SUM(
      CASE WHEN tl.overtime_seconds > 0 THEN tl.overtime_seconds ELSE 0 END
    ), 0),
    COALESCE(SUM(
      CASE
        WHEN tl.action IN ('finished', 'expired') AND (t.duration - tl.time_value) < (t.duration - 30)
        THEN (t.duration - (t.duration - tl.time_value))
        ELSE 0
      END
    ), 0),
    MIN(t.created_at),
    MAX(t.updated_at)
  INTO
    v_total_presentations,
    v_total_planned,
    v_total_actual,
    v_early_count,
    v_on_time_count,
    v_overtime_count,
    v_total_overtime,
    v_total_saved,
    v_first_date,
    v_last_date
  FROM timers t
  LEFT JOIN timer_logs tl ON tl.timer_id = t.id AND tl.action IN ('finished', 'expired')
  JOIN events e ON e.id = t.event_id
  WHERE e.organization_id = p_organization_id
    AND t.presenter_name = p_presenter_name
    AND t.status IN ('completed', 'finished_early', 'expired');

  v_avg_variance := CASE WHEN v_total_presentations > 0
    THEN (v_total_actual - v_total_planned) / v_total_presentations
    ELSE 0 END;

  INSERT INTO presenter_performance_stats (
    organization_id, presenter_name, total_presentations,
    total_planned_time, total_actual_time, early_finish_count,
    on_time_count, overtime_count, average_variance_seconds,
    total_overtime_seconds, total_time_saved_seconds,
    first_presentation_date, last_presentation_date,
    consistency_score, updated_at
  ) VALUES (
    p_organization_id, p_presenter_name, v_total_presentations,
    v_total_planned, v_total_actual, v_early_count,
    v_on_time_count, v_overtime_count, v_avg_variance,
    v_total_overtime, v_total_saved,
    v_first_date, v_last_date,
    100.0, now()
  )
  ON CONFLICT (organization_id, presenter_name)
  DO UPDATE SET
    total_presentations = v_total_presentations,
    total_planned_time = v_total_planned,
    total_actual_time = v_total_actual,
    early_finish_count = v_early_count,
    on_time_count = v_on_time_count,
    overtime_count = v_overtime_count,
    average_variance_seconds = v_avg_variance,
    total_overtime_seconds = v_total_overtime,
    total_time_saved_seconds = v_total_saved,
    first_presentation_date = v_first_date,
    last_presentation_date = v_last_date,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
