import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff, FiHeart, FiShoppingBag, FiUsers } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import Button from '../../../components/ui/Button';
import { Input, Label } from '../../../components/ui/Input';
import AuthBrandPanel from '../AuthBrandPanel';

const DEMO = {
  restaurant: { email: 'demo.restaurant@foodlink.com', password: 'Demo@1234' },
  ngo: { email: 'demo.ngo@foodlink.com', password: 'Demo@1234' },
};

const SignInPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null); // 'restaurant' | 'ngo' | null
  const [formData, setFormData] = useState({ email: '', password: '' });

  const enterDemo = async (role) => {
    if (demoLoading || submitting) return;
    setError('');
    setDemoLoading(role);
    try {
      const u = await login(DEMO[role]);
      toast.success(`Exploring as ${role === 'restaurant' ? 'a Restaurant' : 'an NGO'}`);
      const dest = u?.userType === 'Restaurant' ? 'restaurant' : 'ngo';
      navigate(`/${dest}/listings`);
    } catch (err) {
      const msg = err.response?.data?.message || "Couldn't start the demo — the server may be waking up, try again.";
      setError(msg);
      toast.error(msg);
      setDemoLoading(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(formData);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'An error occurred while logging in.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 px-4 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-card lg:grid-cols-2">
        <AuthBrandPanel
          title="Welcome back"
          subtitle="Connect, donate, and make a difference. Sign in to keep surplus food moving to the people who need it."
        />

        <div className="p-8 sm:p-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 dark:bg-brand-900/30 px-3 py-1 text-xs font-semibold text-brand-700 dark:text-brand-300">
            <FiHeart size={12} /> FoodLink
          </span>
          <h2 className="mt-4 font-display text-2xl font-bold text-stone-900 dark:text-white">Sign in</h2>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Enter your details to access your account.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <Button type="submit" size="lg" loading={submitting} disabled={!!demoLoading} className="w-full">
              Sign in
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">or try a demo</span>
            <div className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              loading={demoLoading === 'restaurant'}
              disabled={submitting || !!demoLoading}
              onClick={() => enterDemo('restaurant')}
            >
              <FiShoppingBag /> Restaurant
            </Button>
            <Button
              variant="secondary"
              loading={demoLoading === 'ngo'}
              disabled={submitting || !!demoLoading}
              onClick={() => enterDemo('ngo')}
            >
              <FiUsers /> NGO
            </Button>
          </div>

          <p className="mt-6 text-sm text-stone-500 dark:text-stone-400">
            Don&apos;t have an account?{' '}
            <Link to="/sign-up" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
