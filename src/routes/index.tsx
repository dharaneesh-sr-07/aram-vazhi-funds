import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Users, HandCoins, BookOpenCheck } from "lucide-react";
import logo from "@/assets/avk-logo.png";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "அறம் வழிக் குழு — நம்பிக்கை • ஒற்றுமை • வெளிப்படைத்தன்மை" },
      { name: "description", content: "அறம் வழிக் குழுவின் சந்தா மற்றும் பணப் பதிவுகளுக்கான பாதுகாப்பான இணையதளம்." },
      { property: "og:title", content: "அறம் வழிக் குழு (Aram Vazhi Kuzhu)" },
      { property: "og:description", content: "நம்பிக்கை • ஒற்றுமை • வெளிப்படைத்தன்மை — group records, kept safely." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

const features = [
  { icon: BookOpenCheck, ta: "டிஜிட்டல் பதிவேடு", en: "Notebook, now digital" },
  { icon: HandCoins, ta: "மாத & புடவை சந்தா", en: "Every payment recorded" },
  { icon: Users, ta: "10 உறுப்பினர்கள்", en: "One trusted circle" },
  { icon: ShieldCheck, ta: "பாதுகாப்பான அணுகல்", en: "Each sees only their own" },
];

function Home() {
  return (
    <main className="min-h-screen bg-hero">
      <div className="mx-auto flex max-w-5xl flex-col items-center px-5 pb-16 pt-14 text-center md:pt-20">
        <img src={logo} alt="அறம் வழிக் குழு சின்னம்" width={816} height={816} className="animate-rise size-32 md:size-40" />
        <h1 className="animate-rise mt-6 text-4xl font-bold text-primary md:text-6xl" style={{ animationDelay: "80ms" }}>
          அறம் வழிக் குழு
        </h1>
        <p className="mt-2 text-sm uppercase tracking-[0.3em] text-muted-foreground">Aram Vazhi Kuzhu</p>
        <p className="animate-rise mt-5 text-lg font-semibold text-gold md:text-xl" style={{ animationDelay: "160ms" }}>
          நம்பிக்கை • ஒற்றுமை • வெளிப்படைத்தன்மை
        </p>
        <p className="animate-rise mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground" style={{ animationDelay: "220ms" }}>
          எங்கள் குழுவின் சந்தா, பணம் பெற்ற மற்றும் திரும்பச் செலுத்திய விவரங்கள் அனைத்தும் இனி காகிதப் புத்தகத்திற்கு பதிலாக
          பாதுகாப்பாக இங்கே பதிவு செய்யப்படுகின்றன.
        </p>

        <div className="animate-rise mt-10 grid w-full max-w-xl gap-4 sm:grid-cols-2" style={{ animationDelay: "300ms" }}>
          <LoginCard to="/member-login" ta="உறுப்பினர் உள்நுழைவு" en="Member Login" icon={Users} primary />
          <LoginCard to="/admin-login" ta="நிர்வாகி உள்நுழைவு" en="Admin Login" icon={ShieldCheck} />
        </div>

        <div className="mt-16 grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <div key={f.ta} className="animate-rise rounded-xl border bg-card/80 p-5 text-left shadow-soft" style={{ animationDelay: `${380 + i * 60}ms` }}>
              <f.icon className="size-6 text-primary" />
              <p className="mt-3 font-semibold">{f.ta}</p>
              <p className="text-xs text-muted-foreground">{f.en}</p>
            </div>
          ))}
        </div>
      </div>
      <footer className="pb-8 text-center text-xs text-muted-foreground">© அறம் வழிக் குழு</footer>
    </main>
  );
}

function LoginCard({ to, ta, en, icon: Icon, primary }: { to: "/member-login" | "/admin-login"; ta: string; en: string; icon: typeof Users; primary?: boolean }) {
  return (
    <Button asChild size="lg" variant={primary ? "default" : "outline"} className="h-auto flex-col gap-1 py-5 shadow-soft transition-transform hover:-translate-y-0.5">
      <Link to={to}>
        <Icon className="size-6" />
        <span className="text-base font-semibold">{ta}</span>
        <span className="text-xs opacity-80">{en}</span>
      </Link>
    </Button>
  );
}
