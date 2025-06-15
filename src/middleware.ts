// middleware.js
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Utility function for Base64 encoding
const base64Encode = (str: string) => {
  return Buffer.from(str).toString('base64');
};

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Allow /health path to continue without token checks
  if (pathname === '/health') {
    return NextResponse.next();
  }

  const refreshToken = req.cookies.get('refresh_token')?.value;

  const sessionTokens = req.cookies.getAll();
  let sessionToken = null;

  for (const cookie of sessionTokens) {
    if (cookie.name.startsWith('next-auth.session-token')) {
      sessionToken = cookie.value;
      break;
    }
  }

  if (refreshToken) {
    try {
      const JWT_REFRESH_TOKEN = process.env.NEXT_PUBLIC_JWT_REFRESH_TOKEN;
      const JWT_SECRET_BUFFER = new TextEncoder().encode(JWT_REFRESH_TOKEN);
      if (!JWT_REFRESH_TOKEN) {
        console.error("JWT_SECRET is not set in environment variables");
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_TOA_END_POINT}/login`);
      }

      const { payload } = await jwtVerify(refreshToken, JWT_SECRET_BUFFER);
      if (payload) {
        const listApplication = Array.isArray(payload.listApplication) ? payload.listApplication : [];
        const hasDots = listApplication.includes('DOTS');

        if (!hasDots) {
          console.error("Dots application not found in listApplication");
          return NextResponse.redirect(`${process.env.NEXT_PUBLIC_TOA_END_POINT}/login`);
        }

        const response = NextResponse.next();
        response.headers.set('X-User-Payload', JSON.stringify(payload));
        return response;
      } else {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_TOA_END_POINT}/login`);
      }
    } catch (error) {
      console.error("Token invalid or verification failed", error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_TOA_END_POINT}/login`);
    }
  } else {
    const originalUrl = req.nextUrl.href;
    const encodedUrl = base64Encode(originalUrl);

    const loginUrl = new URL(`${process.env.NEXT_PUBLIC_TOA_END_POINT}/login`);
    loginUrl.searchParams.set('redirect', encodedUrl);
    const response = NextResponse.redirect(loginUrl);
    response.headers.set('X-Original-URL', originalUrl);

    return response;
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/:path*'],
};
