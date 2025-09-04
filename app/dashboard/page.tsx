import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ModeCard } from "@/components/dashboard/mode-card"
import { Palette, ImageIcon, Eye, Users } from "lucide-react"

export default function DashboardPage() {
  const modes = [
    {
      id: "sketch-by-image",
      title: "Esboço por Imagem",
      description: "Desenhe baseado em imagens com diferentes filtros",
      icon: ImageIcon,
      href: "/modes/sketch-by-image",
      color: "bg-blue-500",
    },
    {
      id: "sketch-by-description",
      title: "Esboço por Descrição",
      description: "Crie desenhos baseados em descrições textuais",
      icon: Palette,
      href: "/modes/sketch-by-description",
      color: "bg-green-500",
    },
    {
      id: "blind-study",
      title: "Estudo Cego",
      description: "Desenhe de memória após visualizar a imagem",
      icon: Eye,
      href: "/modes/blind-study",
      color: "bg-purple-500",
    },
    {
      id: "multiplayer-portrait",
      title: "Retrato Falado",
      description: "Modo multiplayer com descrições parciais",
      icon: Users,
      href: "/modes/multiplayer-portrait",
      color: "bg-orange-500",
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Bem-vindo ao ArtSketch</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Escolha um modo de prática para aprimorar suas habilidades de desenho
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {modes.map((mode) => (
            <ModeCard key={mode.id} {...mode} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
