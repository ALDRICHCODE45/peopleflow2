import { headers } from "next/headers";
import { auth } from "@core/lib/auth";
import prisma from "@core/lib/prisma";

type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

export interface SessionOtpStatus {
  /** The Better Auth session, or null when there is no valid session. */
  session: Session;
  /** True when a valid session with a user exists (regardless of OTP). */
  isLoggedIn: boolean;
  /** True when the ACTIVE session completed OTP (otpVerifiedAt !== null). */
  otpVerified: boolean;
}

/**
 * Reads the OTP verification status of the current session WITHOUT redirecting.
 *
 * Single source of truth for "is this session OTP-verified?", used by the entry
 * routes (root, sign-in, verify-otp) so their guards can never diverge again.
 *
 * IMPORTANT — why we check otpVerifiedAt on the Session and NOT emailVerified on
 * the User: Better Auth marks user.emailVerified=true PERMANENTLY after the
 * first OTP. A fresh session starts with otpVerifiedAt=null, so checking
 * emailVerified would let an OTP-pending session through and — combined with the
 * sign-in redirect — produced an infinite redirect loop
 * (/sign-in -> / -> /select-tenant -> /verify-otp -> /sign-in). The deep,
 * redirecting guard lives in require-verified-session.ts; this helper only
 * reports status so entry routes can decide where to send the user.
 */
export async function getSessionOtpStatus(): Promise<SessionOtpStatus> {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user) {
    return { session: null, isLoggedIn: false, otpVerified: false };
  }

  const token = session.session?.token;
  const dbSession = token
    ? await prisma.session.findUnique({
        where: { token },
        select: { otpVerifiedAt: true },
      })
    : null;

  return {
    session,
    isLoggedIn: true,
    otpVerified: !!dbSession?.otpVerifiedAt,
  };
}
