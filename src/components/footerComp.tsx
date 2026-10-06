import { connection } from "next/server";

export async function FooterDate() {
  await connection();
  return (
    <footer className="mt-16 text-sm text-neutral-500">
      © {new Date().getFullYear()} f3 Drive. All rights reserved.
    </footer>
  );
}
