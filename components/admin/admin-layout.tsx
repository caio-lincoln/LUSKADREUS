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
  const [isLoading, setIsLoading] = useState(true) // Iniciar como loading
  const [user, setUser] = useState<any>(null)

  // Verificar autenticação existente
  useEffect(() => {
    let isMounted = true
    
    const checkAuth = async () => {
      try {
        console.log("🔍 Verificando autenticação admin...")
        
        // Primeiro, tentar obter a sessão atual
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (!isMounted) return
        
        if (sessionError) {
          console.error("❌ Erro ao obter sessão:", sessionError)
          setIsLoading(false)
          return
        }

        if (session?.user) {
          console.log("✅ Sessão encontrada para usuário:", session.user.email)
          
          // Verificar se é admin
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('is_admin, email')
            .eq('id', session.user.id)
            .single()

          if (!isMounted) return

          if (userError) {
            console.error("❌ Erro ao verificar dados do usuário:", userError)
            setIsLoading(false)
            return
          }

          console.log("👤 Dados do usuário:", userData)

          if (userData?.is_admin) {
            setIsAuthenticated(true)
            setUser(userData)
            console.log("🔐 Admin autenticado com sucesso:", userData.email)
          } else {
            console.log("⚠️ Usuário não é admin:", userData)
            setIsAuthenticated(false)
            setUser(null)
          }
        } else {
          console.log("❌ Nenhuma sessão ativa encontrada")
          setIsAuthenticated(false)
          setUser(null)
        }
      } catch (error) {
        console.error("❌ Erro na verificação de autenticação:", error)
        if (isMounted) {
          setIsAuthenticated(false)
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    checkAuth()

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return
      
      console.log("🔄 Mudança de estado de auth:", event)
      
      if (event === 'SIGNED_OUT') {
        console.log("👋 Usuário deslogado")
        setIsAuthenticated(false)
        setUser(null)
        setIsLoading(false)
      } else if (event === 'SIGNED_IN' && session?.user) {
        console.log("👋 Usuário logado:", session.user.email)
        setIsLoading(true)
        
        try {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('is_admin, email')
            .eq('id', session.user.id)
            .single()

          if (!isMounted) return

          if (userError) {
            console.error("❌ Erro ao verificar dados do usuário no auth change:", userError)
            setIsAuthenticated(false)
            setUser(null)
            return
          }

          console.log("👤 Dados do usuário no auth change:", userData)

          if (userData?.is_admin) {
            setIsAuthenticated(true)
            setUser(userData)
            console.log("🔐 Admin autenticado via auth change:", userData.email)
          } else {
            console.log("⚠️ Usuário não é admin via auth change:", userData)
            setIsAuthenticated(false)
            setUser(null)
          }
        } catch (error) {
          console.error("❌ Erro no auth state change:", error)
          if (isMounted) {
            setIsAuthenticated(false)
            setUser(null)
          }
        } finally {
          if (isMounted) {
            setIsLoading(false)
          }
        }
      } else if (event === 'TOKEN_REFRESHED') {
        // Não fazer nada no refresh do token para evitar loops
        console.log("🔄 Token refreshed - mantendo estado atual")
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Por favor, preencha email e senha!")
      return
    }

    setIsLoading(true)
    try {
      console.log("🔐 Tentando fazer login com:", email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error("❌ Erro no login:", error)
        alert(`Erro no login: ${error.message}`)
        return
      }

      console.log("✅ Login realizado com sucesso para:", data.user?.email)
      // O onAuthStateChange vai lidar com a verificação de admin
      // Não precisamos fazer verificação manual aqui para evitar duplicação
      
    } catch (error) {
      console.error('❌ Erro geral no login:', error)
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

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Shield className="h-12 w-12 mx-auto text-red-600 mb-4 animate-pulse" />
              <p className="text-gray-600">Verificando autenticação...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
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
              <p className="text-blue-600">• Email: caiolncoln@gmail.com</p>
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
