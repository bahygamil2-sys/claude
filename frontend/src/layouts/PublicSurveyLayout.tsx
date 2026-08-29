import { Outlet } from "react-router-dom";
import { LanguageToggle } from "@/components/LanguageToggle";

// Deliberately minimal — no dashboard chrome, no nav — since this is what a respondent
// sees after scanning a QR code on their phone. Kept out of the main bundle by the
// lazy() wrapping around the route's page component in routes/index.tsx, not by
// anything here (this shell itself is small enough to ship in the main chunk).
export function PublicSurveyLayout() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto flex max-w-xl justify-end px-4 pt-4">
        <LanguageToggle />
      </div>
      <main className="mx-auto max-w-xl px-4 pb-16 pt-4">
        <Outlet />
      </main>
    </div>
  );
}
