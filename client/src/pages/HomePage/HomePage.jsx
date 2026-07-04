import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiSearch,
  FiCheckCircle,
  FiMessageCircle,
  FiMapPin,
  FiClock,
  FiHeart,
  FiShoppingBag,
  FiUsers,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import Button from "../../components/ui/Button";
import { foodImage } from "../../lib/foodImages";

// Seeded read-only demo accounts so anyone with the link (recruiters, etc.)
// can explore the full app in one click — no sign-up required.
const DEMO = {
  restaurant: { email: "demo.restaurant@foodlink.com", password: "Demo@1234" },
  ngo: { email: "demo.ngo@foodlink.com", password: "Demo@1234" },
};

const steps = [
  {
    icon: <FiSearch />,
    title: "Discover nearby surplus",
    text: "NGOs browse fresh listings from restaurants close to them, sorted by proximity and expiry.",
  },
  {
    icon: <FiCheckCircle />,
    title: "Request & accept",
    text: "Place an order in one tap. The restaurant accepts and a secure pickup code is generated.",
  },
  {
    icon: <FiMessageCircle />,
    title: "Coordinate & hand off",
    text: "Chat in real time to arrange pickup, then confirm the handoff with the verification code.",
  },
];

const stats = [
  { value: "Real-time", label: "order & chat updates" },
  { value: "Proximity", label: "based discovery" },
  { value: "Zero", label: "food wasted, ideally" },
];

export default function HomePage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [demoLoading, setDemoLoading] = useState(null); // 'restaurant' | 'ngo' | null

  const type = user?.userType === "Restaurant" ? "restaurant" : "ngo";
  const firstName = (user?.username || "there").split(/\s+/)[0];

  const enterDemo = async (role) => {
    if (demoLoading) return;
    setDemoLoading(role);
    try {
      const u = await login(DEMO[role]);
      toast.success(`Exploring as ${role === "restaurant" ? "a Restaurant" : "an NGO"}`);
      const dest = u?.userType === "Restaurant" ? "restaurant" : "ngo";
      navigate(`/${dest}/listings`);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Couldn't start the demo — the server may be waking up, try again."
      );
      setDemoLoading(null);
    }
  };

  return (
    <main className="bg-stone-50 dark:bg-stone-950">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand-200/40 dark:bg-brand-900/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-accent-200/40 dark:bg-accent-900/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 dark:bg-brand-900/30 border border-brand-200/60 dark:border-brand-800 px-3 py-1 text-xs font-semibold text-brand-700 dark:text-brand-300">
                <FiHeart size={12} /> {user ? `Welcome back, ${firstName}` : "Fighting food waste, in real time"}
              </span>
              <h1 className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight text-stone-900 dark:text-white">
                Share surplus.
                <br />
                <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
                  Feed people.
                </span>
              </h1>
              <p className="mt-5 max-w-lg text-lg text-stone-600 dark:text-stone-300">
                FoodLink connects restaurants with extra food to nearby NGOs — turning what would be
                waste into meals for the community.
              </p>

              {user ? (
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to={`/${type}/listings`}>
                    <Button size="lg">
                      Browse listings <FiArrowRight />
                    </Button>
                  </Link>
                  <Link to={`/${type}/transactions`}>
                    <Button size="lg" variant="secondary">
                      My transactions
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="mt-8">
                  <p className="mb-3 text-sm font-semibold text-stone-500 dark:text-stone-400">
                    Try the live demo — no sign-up needed:
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      size="lg"
                      loading={demoLoading === "restaurant"}
                      disabled={!!demoLoading}
                      onClick={() => enterDemo("restaurant")}
                    >
                      <FiShoppingBag /> Explore as Restaurant
                    </Button>
                    <Button
                      size="lg"
                      variant="secondary"
                      loading={demoLoading === "ngo"}
                      disabled={!!demoLoading}
                      onClick={() => enterDemo("ngo")}
                    >
                      <FiUsers /> Explore as NGO
                    </Button>
                  </div>
                  <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">
                    Have an account?{" "}
                    <Link to="/sign-in" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                      Sign in
                    </Link>{" "}
                    or{" "}
                    <Link to="/sign-up" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                      create one
                    </Link>
                    .
                  </p>
                </div>
              )}
            </div>

            {/* Image collage */}
            <div className="relative hidden sm:block animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <img
                  src={foodImage("Vegetarian", "hero-1")}
                  alt="Fresh food"
                  className="w-full h-48 object-cover rounded-2xl shadow-card mt-8"
                  loading="lazy"
                />
                <img
                  src={foodImage("Non-Vegetarian", "hero-2")}
                  alt="Prepared meal"
                  className="w-full h-48 object-cover rounded-2xl shadow-card"
                  loading="lazy"
                />
                <img
                  src={foodImage("Vegan", "hero-3")}
                  alt="Healthy bowl"
                  className="w-full h-48 object-cover rounded-2xl shadow-card"
                  loading="lazy"
                />
                <img
                  src={foodImage("Vegetarian", "hero-4")}
                  alt="Surplus food"
                  className="w-full h-48 object-cover rounded-2xl shadow-card -mt-8"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-stone-900 dark:text-white">
            How FoodLink works
          </h2>
          <p className="mt-3 text-stone-600 dark:text-stone-400">
            Three simple steps from surplus to served.
          </p>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="relative rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-card"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-2xl">
                {s.icon}
              </div>
              <span className="absolute top-6 right-6 font-display text-4xl font-extrabold text-stone-100 dark:text-stone-800">
                0{i + 1}
              </span>
              <h3 className="mt-5 text-lg font-semibold text-stone-900 dark:text-white">{s.title}</h3>
              <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Impact band */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
        <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 px-8 py-12 shadow-glow">
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="font-display text-3xl sm:text-4xl font-extrabold text-white">
                  {s.value}
                </div>
                <div className="mt-1 text-sm font-medium text-brand-100">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-brand-100 text-sm">
            <span className="inline-flex items-center gap-2">
              <FiMapPin size={16} /> Nearby matching
            </span>
            <span className="inline-flex items-center gap-2">
              <FiClock size={16} /> Expiry-aware listings
            </span>
            <span className="inline-flex items-center gap-2">
              <FiMessageCircle size={16} /> Live coordination
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
