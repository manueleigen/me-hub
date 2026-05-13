import { auth } from "@/lib/auth"
import { features } from "@/lib/config"
import { toNextJsHandler } from "better-auth/next-js"
import { NextResponse } from "next/server"

// Export handlers for better-auth
// Auth is disabled by feature flag - returns 503 when disabled

const handlers = toNextJsHandler(auth)

export async function GET(request: Request) {
  if (!features.auth) {
    return NextResponse.json(
      { error: "Authentication is currently disabled" },
      { status: 503 }
    )
  }
  return handlers.GET(request)
}

export async function POST(request: Request) {
  if (!features.auth) {
    return NextResponse.json(
      { error: "Authentication is currently disabled" },
      { status: 503 }
    )
  }
  return handlers.POST(request)
}
