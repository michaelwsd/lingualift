import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', 'admin_password')
      .single();

    if (error) {
      console.error('Failed to fetch admin password:', error);
      return NextResponse.json({ password: 'admin1234' });
    }

    return NextResponse.json({ password: data.value });
  } catch (error) {
    console.error('Failed to fetch admin password:', error);
    return NextResponse.json({ password: 'admin1234' });
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    const { data: setting, error: fetchError } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', 'admin_password')
      .single();

    if (fetchError || !setting) {
      return NextResponse.json({ error: 'Failed to verify password' }, { status: 500 });
    }

    if (setting.value !== currentPassword) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 });
    }

    if (!newPassword || newPassword.length < 4) {
      return NextResponse.json({ error: 'New password must be at least 4 characters' }, { status: 400 });
    }

    const { error: updateError } = await supabaseAdmin
      .from('app_settings')
      .update({ value: newPassword, updated_at: new Date().toISOString() })
      .eq('key', 'admin_password');

    if (updateError) {
      console.error('Failed to update admin password:', updateError);
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update admin password:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
