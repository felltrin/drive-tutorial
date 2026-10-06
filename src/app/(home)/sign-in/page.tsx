import { SignInButton } from "@clerk/nextjs";
import { Suspense } from "react";
import { FooterDate } from "~/components/footerComp";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function HomePage() {
  return (
    <>
      <SignInButton forceRedirectUrl={"/drive"} />
      <Suspense
        fallback={
          <footer className="mt-16 text-sm text-neutral-500">Loading...</footer>
        }
      >
        <FooterDate />
      </Suspense>
    </>
  );
}
