import React from 'react';
import { Link } from 'react-router-dom';
import { FiTrendingDown, FiUsers, FiClock, FiArrowRight, FiHeart } from 'react-icons/fi';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { foodImage } from '../../lib/foodImages';

const values = [
  {
    icon: <FiTrendingDown />,
    title: 'Waste less',
    text: 'Roughly a third of all food produced is wasted. FoodLink redirects edible surplus before it hits the bin.',
  },
  {
    icon: <FiUsers />,
    title: 'Feed more',
    text: 'Local NGOs get a reliable, real-time stream of donations from restaurants right in their neighbourhood.',
  },
  {
    icon: <FiClock />,
    title: 'Act fast',
    text: 'Listings are expiry-aware and proximity-ranked, so food moves while it’s still fresh.',
  },
];

export default function AboutPage() {
  return (
    <main className="bg-stone-50 dark:bg-stone-950">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 dark:bg-brand-900/30 border border-brand-200/60 dark:border-brand-800 px-3 py-1 text-xs font-semibold text-brand-700 dark:text-brand-300">
              <FiHeart size={12} /> Our mission
            </span>
            <h1 className="mt-5 font-display text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight text-stone-900 dark:text-white">
              A world where no good food goes to waste.
            </h1>
            <p className="mt-5 text-lg text-stone-600 dark:text-stone-300">
              FoodLink is a platform that connects restaurants with surplus food to the NGOs that can
              distribute it — turning waste into meals, quickly and reliably.
            </p>
            <div className="mt-8">
              <Link to="/">
                <Button size="lg">
                  Get started <FiArrowRight />
                </Button>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img src={foodImage('Vegetarian', 'about-1')} alt="Food" className="h-56 w-full object-cover rounded-2xl shadow-card" loading="lazy" />
            <img src={foodImage('Non-Vegetarian', 'about-2')} alt="Food" className="h-56 w-full object-cover rounded-2xl shadow-card mt-8" loading="lazy" />
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          {values.map((v) => (
            <Card key={v.title} className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-2xl">
                {v.icon}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-stone-900 dark:text-white">{v.title}</h3>
              <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{v.text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Closing band */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-20">
        <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 px-8 py-12 text-center shadow-glow">
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
            Every meal shared is a meal saved.
          </h2>
          <p className="mt-3 text-brand-100 max-w-xl mx-auto">
            Whether you run a restaurant or an NGO, you can be part of the solution.
          </p>
          <div className="mt-6 flex justify-center">
            <Link to="/sign-up">
              <Button size="lg" variant="accent">
                Join FoodLink <FiArrowRight />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
