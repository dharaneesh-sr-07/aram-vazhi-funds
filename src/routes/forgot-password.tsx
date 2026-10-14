import { createFileRoute, Link } from "@tanstack/react-router";
import { KeyRound, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "கடவுச்சொல் மறந்துவிட்டதா? — அறம் வழிக் குழு" },
      { name: "description", content: "கடவுச்சொல்லை மீட்டமைக்க நிர்வாகியை தொடர்பு கொள்ளவும்." },
      { property: "og:title", content: "Forgot password — அறம் வழிக் குழு" },
      { property: "og:description", content: "How to recover your Aram Vazhi Kuzhu account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Forgot,
});

function Forgot() {
  return (
    <main className="grid min-h-screen place-items-center bg-hero px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-7 shadow-lift">
        <KeyRound className="size-8 text-primary" />
        <h1 className="mt-3 text-xl font-bold">கடவுச்சொல் மறந்துவிட்டதா?</h1>
        <p className="text-xs text-muted-foreground">Forgot password</p>
        <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
          <li>குழு நிர்வாகியை (Dharaneesh அல்லது Sarath) நேரில் அல்லது தொலைபேசியில் தொடர்பு கொள்ளவும்.</li>
          <li>நிர்வாகி உங்களுக்கு ஒரு தற்காலிக கடவுச்சொல்லை வழங்குவார்.</li>
          <li>அதைக் கொண்டு உள்நுழைந்ததும், புதிய வலுவான கடவுச்சொல்லை அமைக்க வேண்டும்.</li>
        </ol>
        <p className="mt-4 text-xs text-muted-foreground">
          Ask an Admin for a temporary password. You will be asked to set a new one right after logging in.
        </p>
        <Link to="/member-login" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="size-4" /> உள்நுழைவுக்கு திரும்பு (Back to login)
        </Link>
      </div>
    </main>
  );
}
