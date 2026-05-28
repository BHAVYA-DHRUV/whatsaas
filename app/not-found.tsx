import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-dvh">
      <div className="max-w-md p-4 space-y-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Page Not Found
        </h1>
        <p className="text-base text-muted-foreground">
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>
        <Link
          href="/"
          className="flex justify-center px-4 py-2 mx-auto text-sm font-medium border rounded-full shadow-sm max-w-48 border-border text-foreground bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
