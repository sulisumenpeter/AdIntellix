import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How It Works | AdIntelix',
  description: 'Learn how AdIntelix turns competitor ads into your next winning strategy with AI-powered marketing intelligence.',
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="h-20 bg-surface border-b border-border flex items-center justify-between px-8 z-10 sticky top-0">
        <Link href="/" aria-label="AdIntelix home" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
            A
          </div>
          <span className="text-xl font-bold tracking-tight">AdIntelix</span>
        </Link>
        <nav className="hidden md:flex gap-8 items-center text-sm font-medium">
          <Link href="/#features" className="text-muted-fg hover:text-foreground transition-colors">Features</Link>
          <Link href="/how-it-works" className="text-foreground transition-colors">How it Works</Link>
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
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
            Turn Competitor Ads Into Your Next <span className="text-indigo-600">Winning Strategy</span>
          </h1>
          <p className="text-lg text-muted-fg mb-10 max-w-3xl mx-auto">
            AdIntelix helps marketers and businesses analyze competitor advertising, discover patterns, evaluate creatives, identify ad fatigue, and make better marketing decisions driven by real-time intelligence.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/signup" className="px-6 py-3 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition-colors shadow-sm text-lg">
              Get Started
            </Link>
            <Link href="#features" className="px-6 py-3 bg-surface border border-border rounded-md font-medium hover:bg-surface-hover transition-colors shadow-sm text-lg">
              Explore Features
            </Link>
          </div>
        </section>

        {/* Step-by-step workflow */}
        <section className="py-20 bg-surface border-t border-border px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">How AdIntelix Works</h2>
              <p className="text-muted-fg max-w-2xl mx-auto">A seamless workflow from intelligence gathering to actionable insights.</p>
            </div>
            
            <div className="relative">
              {/* Vertical line connecting steps */}
              <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2 hidden md:block"></div>
              
              <div className="space-y-12 relative">
                {/* Step 1 */}
                <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
                  <div className="md:w-1/2 md:text-right">
                    <h3 className="text-xl font-bold mb-2">1. Add competitors and sources</h3>
                    <p className="text-muted-fg">Start by entering target competitor profiles or searching across supported networks. Easily track their active advertising campaigns.</p>
                  </div>
                  <div className="absolute left-4 md:left-1/2 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold shadow-md transform -translate-x-1/2 mt-1 md:mt-0 z-10">1</div>
                  <div className="md:w-1/2 pl-12 md:pl-0">
                    <div className="p-4 bg-background border border-border rounded-lg shadow-sm">
                      <div className="flex items-center gap-3 text-indigo-600 font-medium">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        Supported Integration: Facebook Ads Library
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col md:flex-row-reverse items-center gap-8 md:gap-16">
                  <div className="md:w-1/2 text-left">
                    <h3 className="text-xl font-bold mb-2">2. Collect intelligence</h3>
                    <p className="text-muted-fg">AdIntelix automatically organizes available advertising intelligence, storing ad copy, creative elements, and status updates directly in your project dashboard.</p>
                  </div>
                  <div className="absolute left-4 md:left-1/2 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold shadow-md transform -translate-x-1/2 mt-1 md:mt-0 z-10">2</div>
                  <div className="md:w-1/2 pl-12 md:pl-0 md:text-right">
                    <div className="p-4 bg-background border border-border rounded-lg shadow-sm inline-block w-full">
                      <div className="flex items-center gap-3 text-indigo-600 font-medium md:justify-end">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                        Continuous data collection pipeline
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
                  <div className="md:w-1/2 md:text-right">
                    <h3 className="text-xl font-bold mb-2">3. Analyze and align</h3>
                    <p className="text-muted-fg">Our AI models analyze creative patterns, messaging strategies, and evaluate the alignment between ad copy and destination landing pages to highlight what converts.</p>
                  </div>
                  <div className="absolute left-4 md:left-1/2 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold shadow-md transform -translate-x-1/2 mt-1 md:mt-0 z-10">3</div>
                  <div className="md:w-1/2 pl-12 md:pl-0">
                    <div className="p-4 bg-background border border-border rounded-lg shadow-sm">
                      <div className="flex items-center gap-3 text-indigo-600 font-medium">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        Automated AI alignment scoring
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex flex-col md:flex-row-reverse items-center gap-8 md:gap-16">
                  <div className="md:w-1/2 text-left">
                    <h3 className="text-xl font-bold mb-2">4. Identify insights</h3>
                    <p className="text-muted-fg">Pinpoint active ad fatigue in your campaigns, score your own creative briefs against competitor benchmarks, and uncover new Ideal Customer Profiles (ICPs) using search term data.</p>
                  </div>
                  <div className="absolute left-4 md:left-1/2 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold shadow-md transform -translate-x-1/2 mt-1 md:mt-0 z-10">4</div>
                  <div className="md:w-1/2 pl-12 md:pl-0 md:text-right">
                    <div className="p-4 bg-background border border-border rounded-lg shadow-sm inline-block w-full">
                      <div className="flex items-center gap-3 text-indigo-600 font-medium md:justify-end">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        Fatigue & opportunity alerts
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
                  <div className="md:w-1/2 md:text-right">
                    <h3 className="text-xl font-bold mb-2">5. Export and integrate</h3>
                    <p className="text-muted-fg">Generate comprehensive intelligence reports and export your data. Sync with n8n workflows (configuration required) to automate CRM updates and reporting.</p>
                  </div>
                  <div className="absolute left-4 md:left-1/2 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold shadow-md transform -translate-x-1/2 mt-1 md:mt-0 z-10">5</div>
                  <div className="md:w-1/2 pl-12 md:pl-0">
                    <div className="p-4 bg-background border border-border rounded-lg shadow-sm">
                      <div className="flex items-center gap-3 text-indigo-600 font-medium">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                        CSV Exports & Webhooks
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Explanations */}
        <section id="features" className="py-24 px-8 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Powerful Features for Marketing Teams</h2>
            <p className="text-muted-fg max-w-2xl mx-auto">Everything you need to outsmart the competition, fully integrated into one platform.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Link href="/dashboard/competitor-ads" className="group block p-6 bg-surface border border-border rounded-xl shadow-sm hover:shadow-md transition-all hover:border-indigo-300">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-indigo-600 transition-colors">Competitor Ad Intelligence</h3>
              <p className="text-muted-fg text-sm mb-4">Import and track competitor ads directly from Facebook Ads Library to reverse-engineer their success.</p>
              <div className="text-sm font-medium text-indigo-600 flex items-center gap-1">View Dashboard <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></div>
            </Link>

            <Link href="/dashboard/ad-patterns" className="group block p-6 bg-surface border border-border rounded-xl shadow-sm hover:shadow-md transition-all hover:border-indigo-300">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-indigo-600 transition-colors">Ad Pattern Intelligence</h3>
              <p className="text-muted-fg text-sm mb-4">Automatically extract hooks, offers, and messaging themes from collected advertisements.</p>
              <div className="text-sm font-medium text-indigo-600 flex items-center gap-1">View Dashboard <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></div>
            </Link>

            <Link href="/dashboard/creative-briefs" className="group block p-6 bg-surface border border-border rounded-xl shadow-sm hover:shadow-md transition-all hover:border-indigo-300">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-indigo-600 transition-colors">Creative Brief Scoring</h3>
              <p className="text-muted-fg text-sm mb-4">Evaluate your own creative concepts against competitor benchmarks before spending ad budget.</p>
              <div className="text-sm font-medium text-indigo-600 flex items-center gap-1">View Dashboard <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></div>
            </Link>

            <Link href="/dashboard/ad-fatigue" className="group block p-6 bg-surface border border-border rounded-xl shadow-sm hover:shadow-md transition-all hover:border-indigo-300">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-indigo-600 transition-colors">Ad Fatigue Detection</h3>
              <p className="text-muted-fg text-sm mb-4">Identify when your active ads are suffering from audience fatigue based on performance metrics.</p>
              <div className="text-sm font-medium text-indigo-600 flex items-center gap-1">View Dashboard <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></div>
            </Link>

            <Link href="/dashboard/landing-page-match" className="group block p-6 bg-surface border border-border rounded-xl shadow-sm hover:shadow-md transition-all hover:border-indigo-300">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-indigo-600 transition-colors">Ad-to-Landing-Page Match</h3>
              <p className="text-muted-fg text-sm mb-4">Ensure continuity between your ad copy and destination URL to maximize conversion rates.</p>
              <div className="text-sm font-medium text-indigo-600 flex items-center gap-1">View Dashboard <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></div>
            </Link>

            <Link href="/dashboard/google-search-terms" className="group block p-6 bg-surface border border-border rounded-xl shadow-sm hover:shadow-md transition-all hover:border-indigo-300">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-indigo-600 transition-colors">Google Ads Intelligence</h3>
              <p className="text-muted-fg text-sm mb-4">Sync and classify search terms from connected Google Ads accounts automatically (Pro required).</p>
              <div className="text-sm font-medium text-indigo-600 flex items-center gap-1">View Dashboard <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></div>
            </Link>

            <Link href="/dashboard/icp" className="group block p-6 bg-surface border border-border rounded-xl shadow-sm hover:shadow-md transition-all hover:border-indigo-300">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-indigo-600 transition-colors">ICP Lead Scoring</h3>
              <p className="text-muted-fg text-sm mb-4">Define your Ideal Customer Profile and score incoming leads and domains against your criteria.</p>
              <div className="text-sm font-medium text-indigo-600 flex items-center gap-1">View Dashboard <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></div>
            </Link>
            
            <Link href="/dashboard/reports" className="group block p-6 bg-surface border border-border rounded-xl shadow-sm hover:shadow-md transition-all hover:border-indigo-300">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-indigo-600 transition-colors">Reports and Exports</h3>
              <p className="text-muted-fg text-sm mb-4">Generate consolidated intelligence reports to share with stakeholders or export raw data.</p>
              <div className="text-sm font-medium text-indigo-600 flex items-center gap-1">View Dashboard <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></div>
            </Link>
          </div>
        </section>

        {/* Who it is for */}
        <section className="py-24 bg-indigo-50 px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4 text-indigo-950">Built for Growth Leaders</h2>
              <p className="text-indigo-800 max-w-2xl mx-auto">AdIntelix is the secret weapon for businesses managing paid advertising at scale.</p>
            </div>
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div className="p-6 bg-white rounded-xl shadow-sm border border-indigo-100">
                <h4 className="font-bold text-indigo-900 mb-2">Performance Marketers</h4>
                <p className="text-sm text-indigo-700">Stop guessing what works. Use competitor benchmarks to lower CPA and scale winning angles.</p>
              </div>
              <div className="p-6 bg-white rounded-xl shadow-sm border border-indigo-100">
                <h4 className="font-bold text-indigo-900 mb-2">Growth Teams</h4>
                <p className="text-sm text-indigo-700">Align ad copy with landing pages to optimize your entire funnel and maximize conversion rates.</p>
              </div>
              <div className="p-6 bg-white rounded-xl shadow-sm border border-indigo-100">
                <h4 className="font-bold text-indigo-900 mb-2">Marketing Agencies</h4>
                <p className="text-sm text-indigo-700">Deliver better results for clients by analyzing their competitive landscape before launching campaigns.</p>
              </div>
              <div className="p-6 bg-white rounded-xl shadow-sm border border-indigo-100">
                <h4 className="font-bold text-indigo-900 mb-2">Founders</h4>
                <p className="text-sm text-indigo-700">Gain a strategic overview of your market and confidently allocate budget to the best opportunities.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-8 max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold tracking-tight mb-6 leading-tight">
            Make Your Next Marketing Decision With Better Intelligence
          </h2>
          <Link href="/signup" className="inline-block px-8 py-4 bg-indigo-600 text-white rounded-md font-bold hover:bg-indigo-700 transition-colors shadow-lg text-lg">
            Get Started
          </Link>
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
