import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export default async function ModeratorNewsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const permissions = await prisma.moderatorPermission.findMany({
    where: { userId: session.userId, enabled: true }
  });

  const keys = permissions.map(p => p.permissionKey);

  if (keys.includes('newsPublish')) redirect('/moderator/news/publish');
  if (keys.includes('newsWrite')) redirect('/moderator/news/write');

  redirect('/moderator');
}
