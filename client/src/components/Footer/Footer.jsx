import React from "react";
import { Link } from "react-router-dom";
import { FiGithub, FiHeart } from "react-icons/fi";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-lg">
                🍽️
              </span>
              <span className="font-display text-xl font-extrabold tracking-tight text-stone-900 dark:text-white">
                Food<span className="text-brand-600 dark:text-brand-400">Link</span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
              Connecting restaurants with surplus food to nearby NGOs — reducing waste and feeding
              communities, one pickup at a time.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:gap-16">
            <div>
              <h4 className="text-sm font-semibold text-stone-900 dark:text-white">Explore</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link to="/" className="text-stone-500 dark:text-stone-400 hover:text-brand-600 dark:hover:text-brand-400">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-stone-500 dark:text-stone-400 hover:text-brand-600 dark:hover:text-brand-400">
                    About
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-stone-900 dark:text-white">Connect</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <a
                    href="https://github.com/owaish7/food-link-app"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-stone-500 dark:text-stone-400 hover:text-brand-600 dark:hover:text-brand-400"
                  >
                    <FiGithub size={15} /> GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-stone-200 dark:border-stone-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-stone-400 dark:text-stone-500">© {year} FoodLink. All rights reserved.</p>
          <p className="flex items-center gap-1.5 text-sm text-stone-400 dark:text-stone-500">
            Built with <FiHeart size={13} className="text-red-500" /> to fight food waste
          </p>
        </div>
      </div>
    </footer>
  );
}
