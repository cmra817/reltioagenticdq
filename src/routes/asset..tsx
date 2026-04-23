import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/asset/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/asset/"!</div>
}
