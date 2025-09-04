"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Chrome, MessageCircle } from "lucide-react"
import { authService } from "./auth-service"

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      await authService.loginWithGoogle()
      console.log("Login com Google realizado")
      // Redirecionar para dashboard
      window.location.href = "/dashboard"
    } catch (error) {
      console.error("Erro no login com Google:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDiscordLogin = async () => {
    setIsLoading(true)
    try {
      await authService.loginWithDiscord()
      console.log("Login com Discord realizado")
      // Redirecionar para dashboard
      window.location.href = "/dashboard"
    } catch (error) {
      console.error("Erro no login com Discord:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <span className="text-2xl font-bold text-white">LD</span>
          </div>
          <CardTitle className="text-2xl font-bold">Luska Dreus</CardTitle>
          <CardDescription>Entre na plataforma para começar a praticar desenho</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleGoogleLogin} disabled={isLoading} className="w-full" variant="outline">
            <Chrome className="mr-2 h-4 w-4" />
            Entrar com Google
          </Button>
          <Button onClick={handleDiscordLogin} disabled={isLoading} className="w-full" variant="outline">
            <MessageCircle className="mr-2 h-4 w-4" />
            Entrar com Discord
          </Button>

          {/* Link direto para admin */}
          <div className="pt-4 border-t text-center">
            <a href="/admin" className="text-xs text-muted-foreground hover:text-blue-600 transition-colors">
              Acesso Administrativo
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
