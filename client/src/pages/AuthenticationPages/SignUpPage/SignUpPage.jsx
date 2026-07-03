import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff, FiMapPin, FiCheck } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import Button from '../../../components/ui/Button';
import { Input, Select, Label } from '../../../components/ui/Input';
import AuthBrandPanel from '../AuthBrandPanel';

const SignUpPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: '',
    verificationCode: '',
    latitude: '',
    longitude: '',
    locationName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);

  const locationCaptured = formData.latitude !== '' && formData.longitude !== '';

  const handleChange = (e) => {
    const { name, value } = e.target;
    const next = { ...formData, [name]: value };
    setFormData(next);
    if (name === 'confirmPassword' || name === 'password') {
      setPasswordMatch(next.confirmPassword === '' || next.password === next.confirmPassword);
    }
  };

  const handleLocationClick = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((f) => ({
          ...f,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setLocating(false);
        toast.success('Location captured');
      },
      (error) => {
        setLocating(false);
        toast.error(error.message || 'Could not get your location.');
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setPasswordMatch(false);
      return;
    }
    if (!locationCaptured) {
      toast.error('Please add your location so NGOs/restaurants can find you.');
      return;
    }
    setSubmitting(true);
    try {
      await register(formData);
      toast.success('Account created! Welcome to FoodLink.');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 px-4 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-card lg:grid-cols-2">
        <AuthBrandPanel
          title="Join the movement"
          subtitle="Whether you run a restaurant with extra food or an NGO that distributes it, FoodLink helps you make an impact — one meal at a time."
        />

        <div className="p-8 sm:p-10">
          <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-white">Create account</h2>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            It&apos;s free and only takes a minute.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                placeholder="Your organisation name"
                value={formData.username}
                onChange={handleChange}
                minLength={7}
                required
              />
            </div>
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
                  placeholder="8+ chars, one upper & one lower"
                  value={formData.password}
                  onChange={handleChange}
                  pattern="^(?=.*[a-z])(?=.*[A-Z]).{8,}$"
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
            <div>
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              {!passwordMatch && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">Passwords do not match</p>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="userType">I am a</Label>
                <Select id="userType" name="userType" value={formData.userType} onChange={handleChange} required>
                  <option value="">Select type</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Charity/NGO">Charity / NGO</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="verificationCode">Verification code</Label>
                <Input
                  id="verificationCode"
                  name="verificationCode"
                  placeholder="Code"
                  value={formData.verificationCode}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="locationName">Location name</Label>
              <Input
                id="locationName"
                name="locationName"
                placeholder="City / area"
                value={formData.locationName}
                onChange={handleChange}
                required
              />
            </div>

            <Button
              type="button"
              variant={locationCaptured ? 'subtle' : 'secondary'}
              loading={locating}
              onClick={handleLocationClick}
              className="w-full"
            >
              {locationCaptured ? <FiCheck /> : <FiMapPin />}
              {locationCaptured ? 'Location added' : 'Add my location'}
            </Button>

            <Button type="submit" size="lg" loading={submitting} className="w-full">
              Sign up
            </Button>
          </form>

          <p className="mt-6 text-sm text-stone-500 dark:text-stone-400">
            Already have an account?{' '}
            <Link to="/sign-in" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
