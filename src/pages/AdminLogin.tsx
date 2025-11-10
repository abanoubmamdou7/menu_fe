// export default AdminLogin;
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../lib/auth.ts';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
      navigate('/admin');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login({ email, password });
      navigate('/admin'); // Redirect after successful login
    } catch (error: any) {
      alert(error.message); // Optionally show error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative font-sans">
      {/* Background with gradient */}
      <div className="fixed top-0 left-0 w-full h-full bg-gradient-to-br from-orange-100 to-orange-50 -z-20">
        <div className="absolute top-0 left-0 w-full h-full bg-black/5 backdrop-blur-sm"></div>
      </div>
  
      {/* Animated background elements */}
      <div className="fixed top-0 left-0 w-full h-full -z-10">
        <div className="absolute inset-0 bg-gradient-radial from-white/10 via-transparent to-transparent animate-pulse"></div>
      </div>
  
      {/* Login Card */}
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-10 w-full max-w-md shadow-2xl border border-orange-200/50 animate-in slide-in-from-bottom-8 duration-700 shadow-inner">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-100 to-orange-50 text-muted-foreground rounded-2xl mb-6 shadow-inner border border-orange-200/30">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2 tracking-tight">Admin Portal</h2>
          <p className="text-muted-foreground text-base">Welcome back! Please sign in to your account.</p>
        </div>
  
        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          {/* Email */}
          <div className="flex flex-col">
            <label htmlFor="email" className="text-sm font-semibold text-foreground mb-2 tracking-wide">
              Email Address
            </label>
            <input
              type="string"
              id="email"
              className="p-4 border-2 border-orange-200/50 rounded-2xl text-base bg-white/80 transition-all duration-200 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100/50 shadow-inner"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
  
          {/* Password */}
          <div className="flex flex-col">
            <label htmlFor="password" className="text-sm font-semibold text-foreground mb-2 tracking-wide">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="p-4 border-2 border-orange-200/50 rounded-2xl text-base bg-white/80 transition-all duration-200 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100/50 shadow-inner"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
  
  
          {/* Submit Button */}
          <button 
            type="submit"
            disabled={isLoading}
            className={`
              bg-gradient-to-r from-orange-100 to-orange-50 text-muted-foreground border-2 border-orange-200/50 p-4 rounded-2xl text-base font-semibold 
              cursor-pointer transition-all duration-300 relative overflow-hidden flex items-center justify-center gap-2 mt-2 shadow-inner
              hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-200/50 hover:border-orange-300
              disabled:opacity-80 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-inner
              ${isLoading ? 'opacity-80 cursor-not-allowed' : ''}
            `}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin"></div>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
  
      {/* Custom Animations */}
      <style>
        {`
          @keyframes slide-in-from-bottom-8 {
            from {
              opacity: 0;
              transform: translateY(32px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .animate-in {
            animation-fill-mode: both;
          }
          
          .slide-in-from-bottom-8 {
            animation: slide-in-from-bottom-8 0.7s ease-out;
          }
          
          @media (max-width: 480px) {
            .max-w-md {
              margin: 16px;
              padding: 32px 24px !important;
              border-radius: 16px !important;
            }
          }
        `}
      </style>
    </div>
  );
  
};

export default AdminLogin;
