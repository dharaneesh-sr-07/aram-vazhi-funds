import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "@/components/LoginForm";

export const Route = createFileRoute("/member-login")({
  head: () => ({
    meta: [
      { title: "உறுப்பினர் உள்நுழைவு — அறம் வழிக் குழு" },
      { name: "description", content: "அறம் வழிக் குழு உறுப்பினர்களுக்கான உள்நுழைவு (Member login)." },
      { property: "og:title", content: "உறுப்பினர் உள்நுழைவு — அறம் வழிக் குழு" },
      { property: "og:description", content: "Member login for Aram Vazhi Kuzhu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <LoginForm portal="member" />,
});
