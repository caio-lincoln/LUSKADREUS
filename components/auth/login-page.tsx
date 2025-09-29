"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, LogIn } from "lucide-react"
import { authService } from "./auth-service"

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    try {
      await authService.login(email, password)
      console.log("Login realizado com sucesso")
      
      // Verificar se o usuário é admin
      const isAdmin = await authService.isAdmin()
      
      if (isAdmin) {
        // Redirecionar para dashboard de admin
        window.location.href = "/admin"
      } else {
        // Redirecionar para dashboard normal
        window.location.href = "/dashboard"
      }
    } catch (error: any) {
      console.error("Erro no login:", error)
      const errorMessage = error?.message || "Email ou senha incorretos"
      setError(errorMessage)
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
        <CardContent>
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 text-center">
                {error}
              </div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                "Entrando..."
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Entrar
                </>
              )}
            </Button>
          </form>

          {/* Links de navegação */}
          <div className="pt-4 border-t space-y-2 text-center">
            <div>
              <span className="text-sm text-muted-foreground">Não tem uma conta? </span>
              <a href="/register" className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
                Criar conta
              </a>
            </div>
            <div>
              <a href="/admin" className="text-xs text-muted-foreground hover:text-blue-600 transition-colors">
                Acesso Administrativo
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
