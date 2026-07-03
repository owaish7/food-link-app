import React, { Suspense, lazy } from 'react'
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate
} from "react-router-dom";

// Components
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Spinner from './components/ui/Spinner';

// Context
import { DarkModeProvider } from './context/DarkModeContext';

// Pages (lazy-loaded so each route ships its own chunk instead of one big bundle)
const HomePage = lazy(() => import('./pages/HomePage/HomePage'));
const SignUpPage = lazy(() => import('./pages/AuthenticationPages/SignUpPage/SignUpPage'));
const SignInPage = lazy(() => import('./pages/AuthenticationPages/SignInPage/SignInPage'));
const RestaurantListingsPage = lazy(() => import('./pages/RestaurantPages/RestaurantListingsPage'));
const RestaurantTransactionsPage = lazy(() => import('./pages/RestaurantPages/RestaurantTransactionsPage'));
const RestaurantProfilePage = lazy(() => import('./pages/RestaurantPages/RestaurantProfilePage'));
const NGOListingsPage = lazy(() => import('./pages/NGOPages/NGOListingsPage'));
const NGOTransactionsPage = lazy(() => import('./pages/NGOPages/NGOTransactionsPage'));
const NGOProfilePage = lazy(() => import('./pages/NGOPages/NGOProfilePage'));
const ChatRoomPage = lazy(() => import('./pages/ChatInterfacePages/ChatRoomPage/ChatRoomPage'));
const AboutPage = lazy(() => import('./pages/AboutPage/AboutPage'));
const NotFoundPage = lazy(() => import('./pages/ErrorPages/NotFoundPage/NotFoundPage'));

const PageLoader = () => (
  <div className="flex min-h-screen w-full items-center justify-center bg-stone-50 dark:bg-stone-950 text-brand-600">
    <Spinner size={40} />
  </div>
);

// Wrap a lazy element in Suspense; optionally behind the private-route guard.
const withSuspense = (el) => <Suspense fallback={<PageLoader />}>{el}</Suspense>;

const PrivateRoute = ({ children }) => {
  if (!localStorage.getItem('user')) {
    return <Navigate to="/sign-in" />;
  }
  return children;
};

const priv = (el) => <PrivateRoute>{withSuspense(el)}</PrivateRoute>;

const Layout = () => (
  <>
    <Navbar transparent />
    <Outlet />
    <Footer />
  </>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "/", element: priv(<HomePage />) },
      { path: "/restaurant/listings", element: priv(<RestaurantListingsPage />) },
      { path: "/restaurant/transactions", element: priv(<RestaurantTransactionsPage />) },
      { path: "/restaurant/profile", element: priv(<RestaurantProfilePage />) },
      { path: "/ngo/listings", element: priv(<NGOListingsPage />) },
      { path: "/ngo/transactions", element: priv(<NGOTransactionsPage />) },
      { path: "/ngo/profile/", element: priv(<NGOProfilePage />) },
      { path: "/about", element: withSuspense(<AboutPage />) },
    ]
  },
  { path: "/sign-up", element: withSuspense(<SignUpPage />) },
  { path: "/sign-in", element: withSuspense(<SignInPage />) },
  { path: "/chat/:orderId", element: withSuspense(<ChatRoomPage />) },
  { path: "*", element: withSuspense(<NotFoundPage />) },
]);

const App = () => {
  return (
    <DarkModeProvider>
      <RouterProvider router={router} />
    </DarkModeProvider>
  )
}

export default App
