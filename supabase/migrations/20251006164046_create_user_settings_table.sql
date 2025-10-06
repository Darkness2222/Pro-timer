/*
  # Create User Settings Table

  1. New Tables
    - `user_settings`
      - `id` (uuid, primary key) - Unique identifier for the settings record
      - `user_id` (uuid, foreign key) - References auth.users, unique per user
      - `sound_notifications` (boolean) - Play sound when timer starts, pauses, or finishes
      - `vibration_feedback` (boolean) - Vibrate device on timer events (mobile only)
      - `auto_start_next` (boolean) - Automatically start the next timer in sequence
      - `show_seconds` (boolean) - Display seconds in timer countdown
      - `use_24_hour_format` (boolean) - Use 24-hour time format for timestamps
      - `fullscreen_on_start` (boolean) - Automatically enter fullscreen when timer starts
      - `overtime_warning` (boolean) - Show warning when timer goes into overtime
      - `halfway_notification` (boolean) - Alert when timer reaches 50% completion
      - `final_minute_alert` (boolean) - Special alert when 1 minute remains
      - `created_at` (timestamptz) - Timestamp when settings were created
      - `updated_at` (timestamptz) - Timestamp when settings were last updated

  2. Security
    - Enable RLS on `user_settings` table
    - Add policy for authenticated users to read their own settings
    - Add policy for authenticated users to insert their own settings
    - Add policy for authenticated users to update their own settings

  3. Notes
    - Each user can have only one settings record (enforced by unique constraint on user_id)
    - Default values are set to match the current defaults in SettingsModal
    - Settings are automatically timestamped on creation and update
*/

-- Create the user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sound_notifications boolean DEFAULT true NOT NULL,
  vibration_feedback boolean DEFAULT false NOT NULL,
  auto_start_next boolean DEFAULT false NOT NULL,
  show_seconds boolean DEFAULT true NOT NULL,
  use_24_hour_format boolean DEFAULT false NOT NULL,
  fullscreen_on_start boolean DEFAULT false NOT NULL,
  overtime_warning boolean DEFAULT true NOT NULL,
  halfway_notification boolean DEFAULT true NOT NULL,
  final_minute_alert boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT unique_user_settings UNIQUE (user_id)
);

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own settings
CREATE POLICY "Users can read own settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own settings
CREATE POLICY "Users can insert own settings"
  ON user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own settings
CREATE POLICY "Users can update own settings"
  ON user_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before update
DROP TRIGGER IF EXISTS user_settings_updated_at ON user_settings;
CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_updated_at();

-- Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
