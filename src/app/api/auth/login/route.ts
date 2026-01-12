import { NextResponse } from "next/server";
import { db } from "~/server/db";
import * as crypto from "crypto";
import { encode } from "next-auth/jwt";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; password?: string };
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const hashedPassword = hashPassword(password);
    if (!user.password || user.password !== hashedPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create JWT token - NextAuth v5 format
    const secret = process.env.AUTH_SECRET!;
    const now = Math.floor(Date.now() / 1000);
    
    const token = await encode({
      token: {
        sub: user.id,
        name: user.name,
        email: user.email,
        picture: user.image,
        iat: now,
        exp: now + 30 * 24 * 60 * 60, // 30 days
        jti: crypto.randomUUID(),
      },
      secret,
      salt: "authjs.session-token",
    });

    console.log("Generated token for user:", user.email, "token length:", token.length);

    // Create response with Set-Cookie header
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });

    // Set cookie via header for reliable cross-browser support
    const maxAge = 30 * 24 * 60 * 60;
    const cookieValue = `authjs.session-token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
    
    response.headers.set("Set-Cookie", cookieValue);
    
    console.log("Cookie header set");

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
