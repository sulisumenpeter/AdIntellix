import Link from 'next/link';
import { ReactNode } from 'react';
import { logout } from '../login/actions';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-600">AdIntelix</h1>
        </div>
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          <Link href="/dashboard" className="block px-6 py-2 hover:bg-gray-50 text-sm font-medium">
            Overview
          </Link>
          <Link href="/dashboard/projects" className="block px-6 py-2 hover:bg-gray-50 text-sm font-medium">
            Projects
          </Link>
          <Link href="/dashboard/competitor-ads" className="block px-6 py-2 hover:bg-gray-50 text-sm font-medium">
            Competitor Ads
          </Link>
          <Link href="/dashboard/patterns" className="block px-6 py-2 hover:bg-gray-50 text-sm font-medium">
            Ad Patterns
          </Link>
          <Link href="/dashboard/creative-briefs" className="block px-6 py-2 hover:bg-gray-50 text-sm font-medium">
            Creative Briefs
          </Link>
          <Link href="/dashboard/ad-fatigue" className="block px-6 py-2 hover:bg-gray-50 text-sm font-medium">
            Ad Fatigue
          </Link>
          <Link href="/dashboard/organizations" className="block px-6 py-2 hover:bg-gray-50 text-sm font-medium">
            Organizations
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <form action={logout}>
            <button type="submit" className="w-full text-left px-2 py-2 hover:bg-gray-50 text-sm font-medium text-red-600 rounded">
              Log out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8">
          <h2 className="text-lg font-medium">Dashboard</h2>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
