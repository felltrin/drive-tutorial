"use client";
import { SignInButton } from "@clerk/nextjs";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
// export const instant = false;

export default function HomePage() {
  return (
    <>
      <SignInButton forceRedirectUrl={"/drive"} />
      <footer className="mt-16 text-sm text-neutral-500">
        © {new Date().getFullYear()} f3 Drive. All rights reserved.
      </footer>
    </>
  );
}
