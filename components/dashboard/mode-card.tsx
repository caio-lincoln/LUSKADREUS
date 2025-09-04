import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"

interface ModeCardProps {
  title: string
  description: string
  icon: LucideIcon
  href: string
  color: string
}

export function ModeCard({ title, description, icon: Icon, href, color }: ModeCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
      <CardHeader>
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center mb-4`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full">
          <Link href={href}>Começar</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
