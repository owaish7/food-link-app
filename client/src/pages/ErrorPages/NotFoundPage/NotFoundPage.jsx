import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import Button from '../../../components/ui/Button';

const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 dark:bg-stone-950 px-6 text-center">
      <div className="text-7xl">🍽️</div>
      <h1 className="mt-6 font-display text-6xl font-extrabold text-stone-900 dark:text-white">404</h1>
      <p className="mt-3 text-lg text-stone-600 dark:text-stone-300">
        This page has gone off the menu.
      </p>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        The page you’re looking for doesn’t exist or was moved.
      </p>
      <Link to="/" className="mt-8">
        <Button size="lg">
          <FiArrowLeft /> Back home
        </Button>
      </Link>
    </div>
  );
};

export default NotFoundPage;
