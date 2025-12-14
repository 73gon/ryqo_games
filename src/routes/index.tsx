import { createFileRoute } from '@tanstack/react-router'

import { Home } from '@/pages/home'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return <Home />
}
