import { Switch, Route } from "wouter";
import { lazy, Suspense } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { Header } from "@/components/Header";

const Home = lazy(() => import("./pages/Home.tsx"));
const AuthPage = lazy(() => import("./pages/AuthPage.tsx"));

function App() {
  const { isLoading } = useUser();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={() => (
            <Suspense fallback={<LoadingSpinner />}>
              <Home />
            </Suspense>
          )} />
          <Route path="/auth" component={() => (
            <Suspense fallback={<LoadingSpinner />}>
              <AuthPage />
            </Suspense>
          )} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
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