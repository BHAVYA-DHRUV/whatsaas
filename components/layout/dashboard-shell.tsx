// 'use client';

// import Link from 'next/link';
// import { useState, Suspense } from 'react';
// import { Button } from '@/components/ui/button';
// import { LogOut, Settings, MessageCircle, Menu, X } from 'lucide-react';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { signOut } from '@/app/[locale]/(login)/actions';
// import { User } from '@/lib/db/schema';
// import useSWR, { mutate } from 'swr';
// import { Sidebar } from '@/components/interface/Sidebar';
// import { EnterpriseTopbar } from '@/components/layout/enterprise-topbar';
// import Logo from '@/components/interface/Logo';
// import { ThemeSwitcher } from '@/components/theme-switcher';
// import { useRouter } from '@/i18n/routing';

// const fetcher = (url: string) => fetch(url).then((res) => res.json());

// function UserMenu() {
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const { data: user } = useSWR<User>('/api/user', fetcher);
//   const router = useRouter();

//   async function handleSignOut() {
//     await signOut();
//     mutate('/api/user');
//     router.push('/');
//   }

//   if (!user) {
//     return (
//       <>
//         <Link
//           href="/#pricing"
//           className="text-sm font-medium text-muted-foreground hover:text-foreground"
//         >
//           Pricing
//         </Link>
//         <Button asChild className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground">
//           <Link href="/sign-up">Sign Up</Link>
//         </Button>
//       </>
//     );
//   }

//   return (
//     <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
//       <DropdownMenuTrigger>
//         <Avatar className="cursor-pointer size-9 border border-border">
//           <AvatarImage alt={user.name || ''} />
//           <AvatarFallback className="bg-primary/10 text-primary">
//             {user.email
//               .split(' ')
//               .map((n) => n[0])
//               .join('')}
//           </AvatarFallback>
//         </Avatar>
//       </DropdownMenuTrigger>
//       <DropdownMenuContent align="end" className="flex flex-col gap-1 w-48">
//         <DropdownMenuItem className="cursor-pointer">
//           <Link href="/dashboard" className="flex w-full items-center">
//             <MessageCircle className="mr-2 h-4 w-4" />
//             <span>Dashboard</span>
//           </Link>
//         </DropdownMenuItem>
//         <DropdownMenuItem className="cursor-pointer">
//           <Link href="/settings" className="flex w-full items-center">
//             <Settings className="mr-2 h-4 w-4" />
//             <span>Settings</span>
//           </Link>
//         </DropdownMenuItem>
//         <form action={handleSignOut} className="w-full">
//           <button type="submit" className="flex w-full">
//             <DropdownMenuItem className="w-full flex-1 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
//               <LogOut className="mr-2 h-4 w-4" />
//               <span>Sign out</span>
//             </DropdownMenuItem>
//           </button>
//         </form>
//       </DropdownMenuContent>
//     </DropdownMenu>
//   );
// }

// function Header() {
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

//   return (
//     <header className="border-b border-border bg-background sticky top-0 z-50">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
//         <Link href="/" className="flex items-center">
//           <Logo />
//         </Link>

//         <div className="hidden md:flex items-center space-x-4">
//           <ThemeSwitcher />
//           <Suspense fallback={<div className="h-9 w-9 bg-muted rounded-full animate-pulse" />}>
//             <UserMenu />
//           </Suspense>
//         </div>

//         <div className="md:hidden flex items-center gap-4">
//           <ThemeSwitcher />
//           <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
//             {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
//           </Button>
//         </div>
//       </div>

//       {isMobileMenuOpen && (
//         <div className="md:hidden border-t border-border bg-background p-4 flex flex-col gap-4">
//           <Suspense>
//             <UserMenu />
//           </Suspense>
//         </div>
//       )}
//     </header>
//   );
// }

// type DashboardShellProps = {
//   children: React.ReactNode;
//   path: string;
// };

// export function DashboardShell({ children, path }: DashboardShellProps) {
//   const isHomePage = path === '/' || path === '';
//   const isOnboardingRoute = path === '/onboarding' || path.startsWith('/onboarding/');

//   if (isHomePage) {
//     return (
//       <div className="flex flex-col min-h-screen bg-background">
//         <Header />
//         <main className="flex-1">{children}</main>
//       </div>
//     );
//   }

//   if (isOnboardingRoute) {
//     return <>{children}</>;
//   }

//   const showTopbar = !path.includes('/inbox') && !path.includes('/dashboard/chat');

//   return (
//     <div className="flex h-screen bg-muted overflow-hidden">
//       <Sidebar />
//       <div className="flex flex-1 flex-col h-full overflow-hidden relative">
//         {showTopbar && <EnterpriseTopbar />}
//         <main className="flex-1 flex flex-col min-h-0 overflow-hidden">{children}</main>
//       </div>
//     </div>
//   );
// }




'use client';

import { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, LayoutDashboard, Menu, X, User2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from '@/app/[locale]/(login)/actions';
import { User } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';
import { Sidebar } from '@/components/interface/Sidebar';
import { EnterpriseTopbar } from '@/components/layout/enterprise-topbar';
import Logo from '@/components/interface/Logo';
import { ThemeSwitcher } from '@/components/theme-switcher';
// Use i18n-aware Link and router from @/i18n/routing
import { Link, useRouter } from '@/i18n/routing';

// const fetcher = (url: string) => fetch(url).then((res) => res.json());

const fetcher = async (url: string) => {
  const res = await fetch(url, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch');
  }

  return res.json();
};

function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    mutate('/api/user');
    router.push('/');
  }

  // function handleDashboard() {
  //   setIsMenuOpen(false);
  //   router.push('/dashboard');
  // }

  // function handleSettings() {
  //   setIsMenuOpen(false);
  //   router.push('/settings');
  // }

  async function handleDashboard() {
    setIsMenuOpen(false);
  
    await mutate('/api/user');
  
    router.replace('/dashboard');
    router.refresh();
  }
  
  async function handleSettings() {
    setIsMenuOpen(false);
  
    await mutate('/api/user');
  
    router.replace('/settings/general');
    router.refresh();
  }

  if (!user) {
    return (
      <>
        <Link
          href="/#pricing"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Pricing
        </Link>
        <Button asChild className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href="/sign-up">Sign Up</Link>
        </Button>
      </>
    );
  }

  const initials = user.email
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer size-9 border border-border hover:ring-2 hover:ring-primary/30 transition-all">
          <AvatarImage alt={user.name || user.email} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52" sideOffset={8}>
        {/* User info header */}
        <div className="px-2 py-2 border-b border-border mb-1">
          <p className="text-xs font-medium text-foreground truncate">{user.name || user.email}</p>
          {user.name && (
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          )}
        </div>

        <DropdownMenuItem
          className="cursor-pointer gap-2"
          onSelect={handleDashboard}
        >
          <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
          <span>Dashboard</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="cursor-pointer gap-2"
          onSelect={handleSettings}
        >
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
          onSelect={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-border bg-background sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <Logo />
        </Link>

        <div className="hidden md:flex items-center space-x-4">
          <ThemeSwitcher />
          <Suspense fallback={<div className="h-9 w-9 bg-muted rounded-full animate-pulse" />}>
            <UserMenu />
          </Suspense>
        </div>

        <div className="md:hidden flex items-center gap-4">
          <ThemeSwitcher />
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background p-4 flex flex-col gap-4">
          <Suspense>
            <UserMenu />
          </Suspense>
        </div>
      )}
    </header>
  );
}

type DashboardShellProps = {
  children: React.ReactNode;
  path: string;
};

export function DashboardShell({ children, path }: DashboardShellProps) {
  const isHomePage = path === '/' || path === '';
  const isOnboardingRoute = path === '/onboarding' || path.startsWith('/onboarding/');

  if (isHomePage) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  if (isOnboardingRoute) {
    return <>{children}</>;
  }

  const showTopbar = !path.includes('/inbox') && !path.includes('/dashboard/chat');

  return (
    <div className="flex h-screen bg-muted overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col h-full overflow-hidden relative">
        {showTopbar && <EnterpriseTopbar />}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}