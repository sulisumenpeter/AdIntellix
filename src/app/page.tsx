import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="h-20 bg-surface border-b border-border flex items-center justify-between px-8 z-10 sticky top-0">
        <Link href="/" aria-label="AdIntelix home" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
            A
          </div>
          <h1 className="text-xl font-bold tracking-tight">AdIntelix</h1>
        </Link>
        <nav className="hidden md:flex gap-8 items-center text-sm font-medium">
          <Link href="#features" className="text-muted-fg hover:text-foreground transition-colors">Features</Link>
          <Link href="/how-it-works" className="text-muted-fg hover:text-foreground transition-colors">How it Works</Link>
          <Link href="/pricing" className="text-muted-fg hover:text-foreground transition-colors">Pricing</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-foreground hover:text-indigo-600 transition-colors">
            Sign In
          </Link>
          <Link href="/signup" className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
            Get Started
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-24 px-8 max-w-7xl mx-auto text-center">
          <h2 className="text-5xl font-bold tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
            Competitive <span className="text-indigo-600">Advertising Intelligence</span> for B2B SaaS
          </h2>
          <p className="text-lg text-muted-fg mb-10 max-w-2xl mx-auto">
            Uncover competitor ad strategies, score creative briefs, detect ad fatigue, and optimize your campaigns with AI-powered insights.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/signup" className="px-6 py-3 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition-colors shadow-sm text-lg">
              Start Free Trial
            </Link>
            <Link href="#features" className="px-6 py-3 bg-surface border border-border rounded-md font-medium hover:bg-surface-hover transition-colors shadow-sm text-lg">
              Explore Features
            </Link>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-20 bg-surface border-t border-border px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-3xl font-bold mb-4">Everything you need to win</h3>
              <p className="text-muted-fg max-w-2xl mx-auto">Powerful tools designed specifically for marketing teams to gain an edge.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 bg-background rounded-xl border border-border shadow-sm">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </div>
                <h4 className="text-lg font-semibold mb-2">Competitor Intelligence</h4>
                <p className="text-muted-fg text-sm">Track competitor ad spend, creatives, and strategies across all major networks.</p>
              </div>
              <div className="p-6 bg-background rounded-xl border border-border shadow-sm">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h4 className="text-lg font-semibold mb-2">Creative Scoring</h4>
                <p className="text-muted-fg text-sm">AI-driven analysis of your creative briefs to predict performance before launch.</p>
              </div>
              <div className="p-6 bg-background rounded-xl border border-border shadow-sm">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h4 className="text-lg font-semibold mb-2">Fatigue Detection</h4>
                <p className="text-muted-fg text-sm">Automatically detect when ads are losing effectiveness and swap them out.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-surface border-t border-border py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-fg">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="AdIntelix home" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-6 h-6 rounded bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                A
              </div>
              <span className="font-semibold text-foreground">AdIntelix</span>
            </Link>
            <span suppressHydrationWarning>&copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
