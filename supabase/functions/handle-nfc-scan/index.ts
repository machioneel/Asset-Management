import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { tag_id, scanned_at, device_id } = await req.json();

    // First, find the asset with matching NFC UID
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select('id')
      .eq('nfc_uid', tag_id)
      .single();

    if (assetError || !asset) {
      return new Response(
        JSON.stringify({ error: 'Asset not found for this NFC tag' }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Record the scan in asset_scan_history
    const { data: scan, error: scanError } = await supabase
      .from('asset_scan_history')
      .insert([
        {
          asset_id: asset.id,
          scanned_at: scanned_at || new Date().toISOString(),
          device_id,
        },
      ])
      .select()
      .single();

    if (scanError) {
      throw scanError;
    }

    return new Response(
      JSON.stringify({ 
        message: 'Scan recorded successfully',
        scan 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});