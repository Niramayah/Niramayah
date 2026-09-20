import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export default async function ModeratorBlogsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const permissions = await prisma.userPermission.findMany({
    where: { userId: session.userId, enabled: true }
  });

  const keys = permissions.map(p => p.permissionKey);

  // Preference for Writer page if both permissions exist, 
  // or redirect to whichever one they have.
  if (keys.includes('blogWrite')) redirect('/moderator/blogs/write');
  if (keys.includes('blogPublish')) redirect('/moderator/blogs/publish');

  redirect('/moderator');
}
