import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { data: domains } = await supabase
      .from('domains')
      .select('id, name, slug, icon, color_scheme')
      .eq('status', 'active')
      .order('name', { ascending: true });

    return NextResponse.json({
      success: true,
      data: domains || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
