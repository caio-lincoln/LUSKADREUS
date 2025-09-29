"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Shield, LogOut, Mail, Lock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase-client"

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Verificar autenticação existente
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        // Verificar se é admin
        const { data: userData } = await supabase
          .from('users')
          .select('is_admin, email')
          .eq('id', session.user.id)
          .single()

        if (userData?.is_admin) {
          setIsAuthenticated(true)
          setUser(userData)
          console.log("Admin autenticado:", userData.email)
        }
      }
    }

    checkAuth()

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false)
        setUser(null)
      } else if (event === 'SIGNED_IN' && session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('is_admin, email')
          .eq('id', session.user.id)
          .single()

        if (userData?.is_admin) {
          setIsAuthenticated(true)
          setUser(userData)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Por favor, preencha email e senha!")
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        alert(`Erro no login: ${error.message}`)
        return
      }

      if (data.user) {
        // Verificar se é admin
        const { data: userData } = await supabase
          .from('users')
          .select('is_admin, email')
          .eq('id', data.user.id)
          .single()

        if (userData?.is_admin) {
          setIsAuthenticated(true)
          setUser(userData)
          console.log("Admin autenticado:", userData.email)
        } else {
          await supabase.auth.signOut()
          alert("Acesso negado - apenas administradores!")
        }
      }
    } catch (error) {
      console.error('Erro no login:', error)
      alert("Erro no login!")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsAuthenticated(false)
    setUser(null)
    setEmail("")
    setPassword("")
    console.log("Logout admin realizado")
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto text-red-600 mb-4" />
            <CardTitle>Acesso Administrativo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Login com Email/Senha */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="Email do administrador"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleLogin} 
                className="w-full" 
                disabled={!email || !password || isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </div>

            {/* Instruções */}
            <div className="text-xs text-gray-600 space-y-1">
              <p>
                <strong>Instruções:</strong>
              </p>
              <p>• Use suas credenciais de administrador</p>
              <p>• Apenas usuários com permissão de admin podem acessar</p>
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
              {user && (
                <Badge variant="outline" className="text-xs">
                  {user.email}
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
