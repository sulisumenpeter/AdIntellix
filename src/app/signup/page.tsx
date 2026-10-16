'use client';

import { useState, Suspense } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { signup } from './actions';
import { useSearchParams } from 'next/navigation';

function SignupContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex min-h-screen bg-background font-sans">
      {/* Left side - Brand/Info */}
      <div className="hidden lg:flex w-1/2 bg-[var(--color-sidebar-bg)] flex-col justify-between p-12 text-[var(--color-sidebar-fg)] relative overflow-hidden">
        <div className="z-10">
          <Link href="/" aria-label="AdIntelix home" className="flex items-center gap-3 mb-12 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
              A
            </div>
            <h1 className="text-2xl font-bold tracking-tight">AdIntelix</h1>
          </Link>
          <h2 className="text-4xl font-bold mb-6 max-w-md leading-tight">Master your market with competitive intelligence.</h2>
          <p className="text-[var(--color-sidebar-muted)] text-lg max-w-md">Join top B2B SaaS teams using AI to uncover competitor strategies and optimize their campaigns.</p>
        </div>
        
        {/* Decorative background element */}
        <div className="absolute top-1/4 right-0 transform translate-x-1/3 opacity-10">
          <svg width="404" height="784" fill="none" viewBox="0 0 404 784"><defs><pattern id="b1e6e422-73f8-40a5-b5f9-2fac7f0e1114" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="4" height="4" fill="currentColor"></rect></pattern></defs><rect width="404" height="784" fill="url(#b1e6e422-73f8-40a5-b5f9-2fac7f0e1114)"></rect></svg>
        </div>
      </div>

      {/* Right side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md">
          <Link href="/" aria-label="AdIntelix home" className="lg:hidden flex items-center gap-3 mb-8 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
              A
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">AdIntelix</h1>
          </Link>
          
          <h2 className="text-2xl font-bold mb-2 text-foreground">Create an account</h2>
          <p className="text-muted-fg mb-8">Start your free journey with AdIntelix today.</p>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form 
            className="space-y-5" 
            action={(formData) => {
              setLoading(true);
              signup(formData).finally(() => setLoading(false));
            }}
          >
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="fullName">Full Name</label>
              <input 
                id="fullName" 
                name="fullName" 
                type="text" 
                required 
                className="block w-full px-4 py-2.5 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-foreground shadow-sm"
                placeholder="John Doe"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="email">Email address</label>
              <input 
                id="email" 
                name="email" 
                type="email" 
                required 
                className="block w-full px-4 py-2.5 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-foreground shadow-sm"
                placeholder="you@company.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="password">Password</label>
              <div className="relative">
                <input 
                  id="password" 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  required 
                  minLength={6}
                  className="block w-full pl-4 pr-12 py-2.5 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-foreground shadow-sm" 
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-fg hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="confirmPassword">Confirm Password</label>
              <div className="relative">
                <input 
                  id="confirmPassword" 
                  name="confirmPassword" 
                  type={showConfirmPassword ? "text" : "password"} 
                  required 
                  minLength={6}
                  className="block w-full pl-4 pr-12 py-2.5 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-foreground shadow-sm" 
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-fg hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm flex justify-center items-center mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Creating account...</>
              ) : 'Create account'}
            </button>
          </form>
          
          <p className="mt-8 text-center text-sm text-muted-fg">
            Already have an account? <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <SignupContent />
    </Suspense>
  )
}
