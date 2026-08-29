import { PlaceholderPage } from "@/components/PlaceholderPage";

// Replaced with the real mobile-first, all-9-question-types renderer in the
// "Public survey-taking page" phase. Its own file (rather than inline in
// routes/index.tsx) is what routes/index.tsx's lazy() import points at, so
// this is a real code-split point from day one, not just a placeholder.
export default function SurveyRespondPage() {
  return <PlaceholderPage title="Survey" />;
}
