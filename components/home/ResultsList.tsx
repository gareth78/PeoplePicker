'use client';

import type { User } from '@/lib/types';
import UserCard from './UserCard';

interface ResultsListProps {
  users: User[];
}

export default function ResultsList({ users }: ResultsListProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {users.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </section>
  );
}
