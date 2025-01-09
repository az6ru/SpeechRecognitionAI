import { Switch, Route } from "wouter";
import { lazy, Suspense } from "react";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useUser } from "@/hooks/use-user";

const Home = lazy(() => import("./pages/Home.tsx"));
const AuthPage = lazy(() => import("./pages/AuthPage.tsx"));

function App() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <AuthPage />
      </Suspense>
    );
  }

  return (
    <Switch>
      <Route path="/" component={() => (
        <Suspense fallback={<LoadingSpinner />}>
          <Home />
        </Suspense>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Страница не найдена</h1>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            Запрашиваемая страница не существует.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;