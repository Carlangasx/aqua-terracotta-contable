import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MessageCircle } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      {/* Main content */}
      <div className="md:pl-64">
        <main className="flex-1">
          {children}
        </main>
      </div>
      
      {/* Botón flotante de WhatsApp */}
      <a
        href="https://wa.me/+584128315499"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-105 z-50"
        aria-label="Contactar por WhatsApp"
      >
        <MessageCircle className="h-6 w-6" />
      </a>
    </div>
  );
}