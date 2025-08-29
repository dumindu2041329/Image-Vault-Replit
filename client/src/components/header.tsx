import { Images } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Link } from "wouter";

export function Header() {
  return (
    <header className="sticky top-0 z-50 glassmorphism border-b backdrop-blur-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3" data-testid="link-home">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <Images className="text-primary-foreground text-lg" />
            </div>
            <h1 className="text-2xl font-bold gradient-text">ImageVault</h1>
          </Link>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
