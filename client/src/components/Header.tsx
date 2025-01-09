import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, User } from "lucide-react";

export function Header() {
  const { user, logout, isLoading } = useUser();

  if (isLoading) {
    return (
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Voice Converter</h1>
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </header>
    );
  }

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Voice Converter</h1>
        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Link href="/profile">
                  <DropdownMenuItem>
                    Профиль
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem onClick={() => logout()}>
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Link href="/auth?mode=login">
                <Button variant="ghost">Войти</Button>
              </Link>
              <Link href="/auth?mode=register">
                <Button>Регистрация</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
