import { clerkMiddleware } from "@clerk/nextjs/server";
import { clerkConfigured } from "@/lib/clerk-config";
import { NextResponse } from "next/server";

export default clerkConfigured
  ? clerkMiddleware()
  : function passthrough() {
      return NextResponse.next();
    };

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
