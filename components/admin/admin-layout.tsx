"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Shield, LogOut, Copy, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [token, setToken] = useState("")
  const [currentToken, setCurrentToken] = useState("")
  const [tokenExpiry, setTokenExpiry] = useState<Date | null>(null)

  // Gerar token temporário (válido por 1 hora)
  const generateToken = () => {
    const newToken = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const expiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    setCurrentToken(newToken)
    setTokenExpiry(expiry)
    localStorage.setItem("admin_token", newToken)
    localStorage.setItem("admin_token_expiry", expiry.toISOString())

    console.log("🔑 Token gerado:", newToken)
    console.log("⏰ Válido até:", expiry.toLocaleString())

    return newToken
  }

  // Verificar token existente
  useEffect(() => {
    const savedToken = localStorage.getItem("admin_token")
    const savedExpiry = localStorage.getItem("admin_token_expiry")

    if (savedToken && savedExpiry) {
      const expiryDate = new Date(savedExpiry)
      if (expiryDate > new Date()) {
        setCurrentToken(savedToken)
        setTokenExpiry(expiryDate)
        setIsAuthenticated(true)
        console.log("🔑 Token válido encontrado")
      } else {
        // Token expirado
        localStorage.removeItem("admin_token")
        localStorage.removeItem("admin_token_expiry")
        console.log("⏰ Token expirado")
      }
    }
  }, [])

  const handleLogin = () => {
    if (token === currentToken && tokenExpiry && tokenExpiry > new Date()) {
      setIsAuthenticated(true)
      console.log("✅ Login admin realizado")
    } else {
      alert("Token inválido ou expirado!")
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setToken("")
    localStorage.removeItem("admin_token")
    localStorage.removeItem("admin_token_expiry")
    console.log("🚪 Logout admin realizado")
  }

  const copyToken = () => {
    navigator.clipboard.writeText(currentToken)
    alert("Token copiado para a área de transferência!")
  }

  const isTokenExpired = tokenExpiry && tokenExpiry <= new Date()

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto text-red-600 mb-4" />
            <CardTitle>Acesso Administrativo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Gerador de Token */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">Token Temporário</h3>
              {currentToken && !isTokenExpired ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-600">
                      Ativo
                    </Badge>
                    <span className="text-xs text-green-700">Válido até: {tokenExpiry?.toLocaleTimeString()}</span>
                  </div>
                  <div className="flex gap-2">
                    <Input value={currentToken} readOnly className="text-xs font-mono" />
                    <Button onClick={copyToken} size="sm" variant="outline">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {isTokenExpired && (
                    <Badge variant="destructive" className="mb-2">
                      Token Expirado
                    </Badge>
                  )}
                  <Button onClick={generateToken} className="w-full" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Gerar Novo Token
                  </Button>
                  <p className="text-xs text-blue-700">Gere um token temporário válido por 1 hora</p>
                </div>
              )}
            </div>

            {/* Login */}
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Cole o token aqui"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="font-mono text-xs"
              />
              <Button onClick={handleLogin} className="w-full" disabled={!token}>
                Entrar
              </Button>
            </div>

            {/* Instruções */}
            <div className="text-xs text-gray-600 space-y-1">
              <p>
                <strong>Instruções:</strong>
              </p>
              <p>1. Clique em "Gerar Novo Token"</p>
              <p>2. Copie o token gerado</p>
              <p>3. Cole no campo acima e clique "Entrar"</p>
              <p className="text-orange-600">⚠️ Token válido por apenas 1 hora</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-red-600" />
              <h1 className="text-xl font-bold">Painel Administrativo</h1>
              {tokenExpiry && (
                <Badge variant="outline" className="text-xs">
                  Expira: {tokenExpiry.toLocaleTimeString()}
                </Badge>
              )}
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
