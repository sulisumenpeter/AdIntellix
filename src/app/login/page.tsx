import { login } from './actions'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-background font-sans">
      {/* Left side - Brand/Info */}
      <div className="hidden lg:flex w-1/2 bg-[var(--color-sidebar-bg)] flex-col justify-between p-12 text-[var(--color-sidebar-fg)] relative overflow-hidden">
        <div className="z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
              A
            </div>
            <h1 className="text-2xl font-bold tracking-tight">AdIntelix</h1>
          </div>
          <h2 className="text-4xl font-bold mb-6 max-w-md leading-tight">Master your market with competitive intelligence.</h2>
          <p className="text-[var(--color-sidebar-muted)] text-lg max-w-md">Join top B2B SaaS teams using AI to uncover competitor strategies and optimize their campaigns.</p>
        </div>
        
        {/* Decorative background element */}
        <div className="absolute top-1/4 right-0 transform translate-x-1/3 opacity-10">
          <svg width="404" height="784" fill="none" viewBox="0 0 404 784"><defs><pattern id="b1e6e422-73f8-40a5-b5f9-2fac7f0e1114" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="4" height="4" fill="currentColor"></rect></pattern></defs><rect width="404" height="784" fill="url(#b1e6e422-73f8-40a5-b5f9-2fac7f0e1114)"></rect></svg>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
              A
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">AdIntelix</h1>
          </div>
          
          <h2 className="text-2xl font-bold mb-2 text-foreground">Welcome back</h2>
          <p className="text-muted-fg mb-8">Enter your credentials to access your account.</p>
          
          <form className="space-y-5" action={login}>
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
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-foreground" htmlFor="password">Password</label>
                <a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">Forgot password?</a>
              </div>
              <input 
                id="password" 
                name="password" 
                type="password" 
                required 
                className="block w-full px-4 py-2.5 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-foreground shadow-sm" 
                placeholder="••••••••"
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm flex justify-center items-center mt-6"
            >
              Sign In
            </button>
          </form>
          
          <p className="mt-8 text-center text-sm text-muted-fg">
            Don&apos;t have an account? <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">Contact sales</a>
          </p>
        </div>
      </div>
    </div>
  )
}
