"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Menu, Home, Palette, LogOut, User, Shield } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { authService, type AuthUser } from "@/components/auth/auth-service"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Meus Desenhos", href: "/gallery", icon: Palette },
  { name: "Perfil", href: "/profile", icon: User },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    setUser(currentUser)
    setIsAdmin(authService.isAdmin())
  }, [])

  const handleLogout = async () => {
    await authService.logout()
    window.location.href = "/"
  }

  // Adicionar link admin se for admin
  const adminNavigation = isAdmin ? [...navigation, { name: "Admin", href: "/admin", icon: Shield }] : navigation

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64">
          <SidebarContent navigation={adminNavigation} pathname={pathname} onLogout={handleLogout} user={user} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r">
          <SidebarContent navigation={adminNavigation} pathname={pathname} onLogout={handleLogout} user={user} />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <h1 className="text-lg font-semibold">Luska Dreus</h1>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6 ml-auto">
              {user && (
                <div className="flex items-center gap-2">
                  <img src={user.avatar || "/placeholder.svg"} alt={user.name} className="h-8 w-8 rounded-full" />
                  <span className="text-sm font-medium">{user.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <main className="py-8 px-4 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}

function SidebarContent({
  navigation,
  pathname,
  onLogout,
  user,
}: {
  navigation: any[]
  pathname: string
  onLogout: () => void
  user: AuthUser | null
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-16 shrink-0 items-center px-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold text-white">LD</span>
          </div>
          <span className="text-lg font-bold">Luska Dreus</span>
        </div>
      </div>
      <nav className="flex flex-1 flex-col px-6 pb-4">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      pathname === item.href
                        ? "bg-gray-50 text-blue-600"
                        : "text-gray-700 hover:text-blue-600 hover:bg-gray-50",
                      "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold",
                    )}
                  >
                    <item.icon className="h-6 w-6 shrink-0" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          <li className="mt-auto">
            {user && (
              <div className="mb-4 p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <img src={user.avatar || "/placeholder.svg"} alt={user.name} className="h-8 w-8 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.provider === "google" ? "Google" : "Discord"}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <Button
              onClick={onLogout}
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </li>
        </ul>
      </nav>
    </div>
  )
}
