import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "@/components/LoginForm";

export const Route = createFileRoute("/admin-login")({
  head: () => ({
    meta: [
      { title: "நிர்வாகி உள்நுழைவு — அறம் வழிக் குழு" },
      { name: "description", content: "அறம் வழிக் குழு நிர்வாகிகளுக்கான உள்நுழைவு (Admin login)." },
      { property: "og:title", content: "நிர்வாகி உள்நுழைவு — அறம் வழிக் குழு" },
      { property: "og:description", content: "Admin login for Aram Vazhi Kuzhu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <LoginForm portal="admin" />,
});
