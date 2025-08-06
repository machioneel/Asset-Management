/*
  # NFC Scan System Schema

  1. New Tables
    - `asset_scan_history`
      - `id` (uuid, primary key)
      - `asset_id` (uuid, references assets)
      - `scanned_at` (timestamp with time zone)
      - `device_id` (text) - For storing Arduino MAC address
      - `created_at` (timestamp with time zone)

  2. Changes to Assets Table
    - Add `nfc_uid` column to assets table
    - Add unique constraint on nfc_uid
    
  3. Security
    - Enable RLS on asset_scan_history
    - Add policies for authenticated users
*/

-- Create asset_scan_history table
CREATE TABLE IF NOT EXISTS asset_scan_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
  scanned_at timestamptz DEFAULT now(),
  device_id text,
  created_at timestamptz DEFAULT now()
);

-- Add nfc_uid column to assets if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assets' AND column_name = 'nfc_uid'
  ) THEN
    ALTER TABLE assets ADD COLUMN nfc_uid text UNIQUE;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE asset_scan_history ENABLE ROW LEVEL SECURITY;

-- Create policies for asset_scan_history
CREATE POLICY "Allow authenticated users to read scan history"
  ON asset_scan_history
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert scan history"
  ON asset_scan_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_asset_scan_history_asset_id 
  ON asset_scan_history(asset_id);

CREATE INDEX IF NOT EXISTS idx_asset_scan_history_scanned_at 
  ON asset_scan_history(scanned_at);

-- Add comment for documentation
COMMENT ON TABLE asset_scan_history IS 'Stores history of NFC tag scans from Arduino devices';