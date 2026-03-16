"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Проверяем наличие токена авторизации
    const token = localStorage.getItem("auth_token")

    if (token) {
      // Если пользователь авторизован, перенаправляем на дашборд
      router.push("/dashboard")
    } else {
      // Если не авторизован, перенаправляем на страницу входа
      router.push("/auth/login")
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p>Загрузка...</p>
      </div>
    </div>
  )
}
