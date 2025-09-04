import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserGallery } from "@/components/gallery/user-gallery"

export default function GalleryPage() {
  return (
    <DashboardLayout>
      <UserGallery />
    </DashboardLayout>
  )
}
