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
//         <Avatar className="border cursor-pointer size-9 border-border">
//           <AvatarImage alt={user.name || ''} />
//           <AvatarFallback className="bg-primary/10 text-primary">
//             {user.email
//               .split(' ')
//               .map((n) => n[0])
//               .join('')}
//           </AvatarFallback>
//         </Avatar>
//       </DropdownMenuTrigger>
//       <DropdownMenuContent align="end" className="flex flex-col w-48 gap-1">
//         <DropdownMenuItem className="cursor-pointer">
//           <Link href="/dashboard" className="flex items-center w-full">
//             <MessageCircle className="w-4 h-4 mr-2" />
//             <span>Dashboard</span>
//           </Link>
//         </DropdownMenuItem>
//         <DropdownMenuItem className="cursor-pointer">
//           <Link href="/settings" className="flex items-center w-full">
//             <Settings className="w-4 h-4 mr-2" />
//             <span>Settings</span>
//           </Link>
//         </DropdownMenuItem>
//         <form action={handleSignOut} className="w-full">
//           <button type="submit" className="flex w-full">
//             <DropdownMenuItem className="flex-1 w-full cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
//               <LogOut className="w-4 h-4 mr-2" />
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
//     <header className="sticky top-0 z-50 border-b border-border bg-background">
//       <div className="flex items-center justify-between px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
//         <Link href="/" className="flex items-center">
//           <Logo />
//         </Link>

//         <div className="items-center hidden space-x-4 md:flex">
//           <ThemeSwitcher />
//           <Suspense fallback={<div className="rounded-full h-9 w-9 bg-muted animate-pulse" />}>
//             <UserMenu />
//           </Suspense>
//         </div>

//         <div className="flex items-center gap-4 md:hidden">
//           <ThemeSwitcher />
//           <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
//             {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
//           </Button>
//         </div>
//       </div>

//       {isMobileMenuOpen && (
//         <div className="flex flex-col gap-4 p-4 border-t md:hidden border-border bg-background">
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
//     <div className="flex h-screen overflow-hidden bg-muted">
//       <Sidebar />
//       <div className="relative flex flex-col flex-1 h-full overflow-hidden">
//         {showTopbar && <EnterpriseTopbar />}
//         <main className="flex flex-col flex-1 min-h-0 overflow-hidden">{children}</main>
//       </div>
//     </div>
//   );
// }




'use client';

import { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, LayoutDashboard, Menu, X } from 'lucide-react';
import { ConnectionStatus } from '@/components/connection-status';
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
import { CommandMenu } from '@/components/layout/command-menu';
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
        <Avatar className="transition-all border cursor-pointer size-9 border-border hover:ring-2 hover:ring-primary/30">
          <AvatarImage alt={user.name || user.email} />
          <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52" sideOffset={8}>
        {/* User info header */}
        <div className="px-2 py-2 mb-1 border-b border-border">
          <p className="text-xs font-medium truncate text-foreground">{user.name || user.email}</p>
          {user.name && (
            <p className="text-xs truncate text-muted-foreground">{user.email}</p>
          )}
        </div>

        <DropdownMenuItem
          className="gap-2 cursor-pointer"
          onSelect={handleDashboard}
        >
          <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
          <span>Dashboard</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="gap-2 cursor-pointer"
          onSelect={handleSettings}
        >
          <Settings className="w-4 h-4 text-muted-foreground" />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
          onSelect={handleSignOut}
        >
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="flex items-center justify-between px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center">
          <Logo />
        </Link>

        <div className="items-center hidden space-x-4 md:flex">
          <ThemeSwitcher />
          <Suspense fallback={<div className="rounded-full h-9 w-9 bg-muted animate-pulse" />}>
            <UserMenu />
          </Suspense>
        </div>

        <div className="flex items-center gap-4 md:hidden">
          <ThemeSwitcher />
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="flex flex-col gap-4 p-4 border-t md:hidden border-border bg-background">
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

  return (
    <div className="flex h-screen overflow-hidden bg-muted">
      <Sidebar />
      <div className="relative flex flex-col flex-1 h-full overflow-hidden">
        <ConnectionStatus />
        <EnterpriseTopbar />
        <main className="flex flex-col flex-1 min-h-0 overflow-hidden">{children}</main>
      </div>
      <CommandMenu />
    </div>
  );
}