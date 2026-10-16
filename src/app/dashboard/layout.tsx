import Link from 'next/link';
import { ReactNode } from 'react';
import { logout } from '../login/actions';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-background text-foreground antialiased font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--color-sidebar-bg)] border-r border-[var(--color-sidebar-border)] flex flex-col shadow-xl z-10 relative transition-all duration-300">
        <div className="h-16 flex items-center px-6 border-b border-[var(--color-sidebar-border)]">
          <Link href="/" aria-label="AdIntelix home" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
              A
            </div>
            <h1 className="text-xl font-bold text-[var(--color-sidebar-fg)] tracking-tight">AdIntelix</h1>
          </Link>
        </div>
        
        <div className="px-4 py-4">
          <p className="px-2 text-xs font-semibold text-[var(--color-sidebar-muted)] uppercase tracking-wider mb-2">Analytics</p>
          <nav className="space-y-1">
            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md text-[var(--color-sidebar-fg)] hover:bg-[var(--color-sidebar-hover)] hover:text-white text-sm font-medium transition-colors">
              <svg className="w-5 h-5 opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              Overview
            </Link>
            <Link href="/how-it-works" className="flex items-center gap-3 px-3 py-2 rounded-md text-[var(--color-sidebar-muted)] hover:bg-[var(--color-sidebar-hover)] hover:text-white text-sm font-medium transition-colors">
              <svg className="w-5 h-5 opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              How it Works
            </Link>
            <Link href="/dashboard/competitor-ads" className="flex items-center gap-3 px-3 py-2 rounded-md text-[var(--color-sidebar-muted)] hover:bg-[var(--color-sidebar-hover)] hover:text-white text-sm font-medium transition-colors">
              <svg className="w-5 h-5 opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              Competitor Ads
            </Link>
            <Link href="/dashboard/patterns" className="flex items-center gap-3 px-3 py-2 rounded-md text-[var(--color-sidebar-muted)] hover:bg-[var(--color-sidebar-hover)] hover:text-white text-sm font-medium transition-colors">
              <svg className="w-5 h-5 opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
              Ad Patterns
            </Link>
            <Link href="/dashboard/creative-briefs" className="flex items-center gap-3 px-3 py-2 rounded-md text-[var(--color-sidebar-muted)] hover:bg-[var(--color-sidebar-hover)] hover:text-white text-sm font-medium transition-colors">
              <svg className="w-5 h-5 opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Creative Briefs
            </Link>
            <Link href="/dashboard/ad-fatigue" className="flex items-center gap-3 px-3 py-2 rounded-md text-[var(--color-sidebar-muted)] hover:bg-[var(--color-sidebar-hover)] hover:text-white text-sm font-medium transition-colors">
              <svg className="w-5 h-5 opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Ad Fatigue
            </Link>
          </nav>
        </div>

        <div className="px-4 py-4 mt-auto">
          <p className="px-2 text-xs font-semibold text-[var(--color-sidebar-muted)] uppercase tracking-wider mb-2">Settings</p>
          <nav className="space-y-1 mb-4">
            <Link href="/dashboard/projects" className="flex items-center gap-3 px-3 py-2 rounded-md text-[var(--color-sidebar-muted)] hover:bg-[var(--color-sidebar-hover)] hover:text-white text-sm font-medium transition-colors">
              <svg className="w-5 h-5 opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
              Projects
            </Link>
            <Link href="/dashboard/organizations" className="flex items-center gap-3 px-3 py-2 rounded-md text-[var(--color-sidebar-muted)] hover:bg-[var(--color-sidebar-hover)] hover:text-white text-sm font-medium transition-colors">
              <svg className="w-5 h-5 opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              Organizations
            </Link>
            <Link href="/dashboard/billing" className="flex items-center gap-3 px-3 py-2 rounded-md text-[var(--color-sidebar-muted)] hover:bg-[var(--color-sidebar-hover)] hover:text-white text-sm font-medium transition-colors">
              <svg className="w-5 h-5 opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              Billing
            </Link>
            <Link href="/dashboard/integrations/n8n" className="flex items-center gap-3 px-3 py-2 rounded-md text-[var(--color-sidebar-muted)] hover:bg-[var(--color-sidebar-hover)] hover:text-white text-sm font-medium transition-colors">
              <svg className="w-5 h-5 opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              n8n Automation
            </Link>
            <Link href="/dashboard/integrations/google-ads" className="flex items-center gap-3 px-3 py-2 rounded-md text-[var(--color-sidebar-muted)] hover:bg-[var(--color-sidebar-hover)] hover:text-white text-sm font-medium transition-colors">
              <svg className="w-5 h-5 opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
              Google Ads
            </Link>
          </nav>
          
          <div className="pt-4 border-t border-[var(--color-sidebar-border)]">
            <form action={logout}>
              <button type="submit" className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-[var(--color-sidebar-muted)] hover:bg-[var(--color-sidebar-hover)] hover:text-red-400 text-sm font-medium transition-colors">
                <svg className="w-5 h-5 opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Log out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
        <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-8 shrink-0 z-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-foreground tracking-tight">Dashboard Overview</h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-muted-fg hover:text-foreground rounded-full hover:bg-surface-hover transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </button>
            <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-semibold cursor-pointer shadow-sm">
              U
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
