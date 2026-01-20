import { NextResponse } from "next/server";
import { deleteAccountantSession } from "@/lib/auth/accountant-session";

/**
 * POST /api/accountant/logout
 * 
 * Logs out the current accountant by:
 * 1. Deleting the session record from the database
 * 2. Clearing the accountant session cookie
 * 
 * This endpoint is designed for accountants who logged in via invite/OTP flow.
 * Regular users should use the NextAuth signOut flow instead.
 */
export async function POST() {
  try {
    // Delete accountant session (clears cookie and database record)
    await deleteAccountantSession();
    
    // Log successful logout
    console.log('[ACCOUNTANT_LOGOUT_SUCCESS]', {
      timestamp: new Date().toISOString(),
    });
    
    return NextResponse.json(
      { success: true, message: "Uitgelogd" },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ACCOUNTANT_LOGOUT_FAILED]', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return NextResponse.json(
      { success: false, message: "Fout bij uitloggen" },
      { status: 500 }
    );
  }
}
