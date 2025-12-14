import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/games/typeracer')({
  component: () => <Outlet />,
});
