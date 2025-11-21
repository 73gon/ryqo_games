import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'

export function ModeToggle() {
  const { setTheme, resolvedTheme } = useTheme()

  const toggleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark'

    if (!document.startViewTransition) {
      setTheme(newTheme)
      return
    }

    // Get click position relative to viewport
    const x = event.clientX
    const y = event.clientY

    // Calculate the radius needed to cover the entire viewport
    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    )

    // Create a clip-path animation
    document.documentElement.style.setProperty('--x', `${x}px`)
    document.documentElement.style.setProperty('--y', `${y}px`)
    document.documentElement.style.setProperty('--r', `${maxRadius}px`)

    document.startViewTransition(() => {
      setTheme(newTheme)
    })
  }

  useEffect(() => {
    // Add CSS for the animation
    const style = document.createElement('style')
    style.textContent = `
      ::view-transition-old(root),
      ::view-transition-new(root) {
        animation: none;
        mix-blend-mode: normal;
      }

      ::view-transition-old(root) {
        z-index: 1;
      }

      ::view-transition-new(root) {
        z-index: 999;
        clip-path: circle(0px at var(--x) var(--y));
        animation: scale-up 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }

      @keyframes scale-up {
        to {
          clip-path: circle(var(--r) at var(--x) var(--y));
        }
      }

      .dark ::view-transition-old(root) {
        z-index: 999;
        clip-path: circle(var(--r) at var(--x) var(--y));
        animation: scale-down 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }

      .dark ::view-transition-new(root) {
        z-index: 1;
        clip-path: circle(var(--r) at var(--x) var(--y));
        animation: none;
      }

      @keyframes scale-down {
        to {
          clip-path: circle(0px at var(--x) var(--y));
        }
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme}>
      <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all duration-600 dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all duration-600 dark:scale-100 dark:rotate-0" />
      <span className="sr-only">toggle theme</span>
    </Button>
  )
}
