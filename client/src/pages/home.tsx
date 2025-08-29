import { Header } from "@/components/header";
import { ImageUpload } from "@/components/image-upload";
import { ImageGallery } from "@/components/image-gallery";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 py-8">
        <ImageUpload />
        <ImageGallery />
      </main>
      
      {/* Footer */}
      <footer className="bg-muted/50 border-t mt-16">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} ImageVault. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
