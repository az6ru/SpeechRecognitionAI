import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUser } from "@/hooks/use-user";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  username: z.string().min(3, "Минимум 3 символа").max(50),
  password: z.string().min(6, "Минимум 6 символов"),
});

type FormData = z.infer<typeof formSchema>;

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { login, register: registerUser } = useUser();
  const [location] = useLocation();
  const mode = new URLSearchParams(location.split("?")[1]).get("mode") || "login";

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    try {
      const action = mode === "login" ? login : registerUser;
      const result = await action(data);

      if (!result.ok) {
        form.setError("root", { message: result.message });
      }
    } catch (error) {
      form.setError("root", {
        message: "Что-то пошло не так. Попробуйте позже.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>
            {mode === "login" ? "Вход в систему" : "Регистрация"}
          </CardTitle>
          <CardDescription>
            Voice Converter - Быстрый сервис распознавания речи
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Имя пользователя</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Пароль</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.formState.errors.root && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.root.message}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "login" ? "Войти" : "Зарегистрироваться"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}