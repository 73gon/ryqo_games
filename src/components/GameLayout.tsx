import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GameLayoutProps {
  title: string
  children: React.ReactNode
  controls?: React.ReactNode
}

export function GameLayout({ title, children, controls }: GameLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/">
                <ArrowLeft className="h-6 w-6" />
              </Link>
            </Button>
            <div className="text-3xl font-sans font-semibold">{title}</div>
          </div>
          {controls && (
            <div className="flex items-center gap-2">{controls}</div>
          )}
        </div>

        <div className="overflow-hidden p-6 flex flex-col items-center justify-center min-h-[600px]">
          {children}
        </div>
      </div>
    </div>
  )
}
