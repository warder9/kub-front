"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Building2,
  Mail,
  Lock,
  Phone,
  AlertCircle,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    company_name: "",
    bin_iin: "",
    email: "",
    password: "",
    phone: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (formData.bin_iin.length !== 12) {
      setError("БИН/ИИН должен содержать 12 цифр");
      setIsLoading(false);
      return;
    }

    try {
      const { register } = await import("@/src/api/auth.api");
      const response = await register(formData);

      if (response.user && response.user.id) {
        router.push(`/auth/register/confirm?user_id=${response.user.id}`);
      } else {
        setError("Не удалось получить ID пользователя после регистрации.");
      }
    } catch (err: any) {
      setError(err?.message || "Произошла ошибка при регистрации");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl p-1 backdrop-blur-sm hover:-translate-y-1">
        <CardHeader className="space-y-1 text-center animate-fadeIn">
          <div className="flex items-center justify-center mb-4 group">
            <Building2 className="h-10 w-10 text-primary mr-2 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-indigo-600 bg-clip-text group-hover:opacity-90 transition-opacity">
              CRM Platform
            </h1>
          </div>
          <CardTitle className="text-2xl font-semibold text-gray-900">
            Регистрация
          </CardTitle>
          <CardDescription className="text-gray-500">
            Создайте аккаунт для вашей компании
          </CardDescription>
        </CardHeader>

        <CardContent className="animate-fadeIn delay-150">
          {error && (
            <Alert
              variant="destructive"
              className="mb-6 border-l-4 border-red-500 animate-shake"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_name" className="text-sm font-medium text-gray-700">
                Название компании
              </Label>
              <div className="relative group">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" />
                <Input
                  id="company_name"
                  placeholder="Введите название компании..."
                  value={formData.company_name}
                  onChange={(e) => handleInputChange("company_name", e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bin_iin" className="text-sm font-medium text-gray-700">
                БИН/ИИН
              </Label>
              <Input
                id="bin_iin"
                placeholder="Введите БИН/ИИН..."
                value={formData.bin_iin}
                onChange={(e) => handleInputChange("bin_iin", e.target.value.replace(/\D/g, "").slice(0, 12))}
                maxLength={12}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Введите Email..."
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Телефон
              </Label>
              <div className="relative group">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" />
                <Input
                  id="phone"
                  placeholder="Введите телефон..."
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Пароль
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Введите пароль..."
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Регистрация..." : "Зарегистрироваться"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-black hover:text-gray-500 hover:underline transition-colors"
            >
              Уже есть аккаунт? Войти →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
