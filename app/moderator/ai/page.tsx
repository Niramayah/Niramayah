import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export default async function ModeratorAiPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  // Fetch permissions for the current user
  const permissions = await prisma.userPermission.findMany({
    where: { 
      userId: session.userId, 
      enabled: true 
    }
  });

  const keys = permissions.map(p => p.permissionKey);

  // Priority redirect for AI modules
  if (keys.includes('aiTestAccess')) redirect('/moderator/ai-test');
  if (keys.includes('aiTrainingAccess')) redirect('/moderator/ai-training');
  if (keys.includes('aiQuestionManage')) redirect('/moderator/ai-questions');

  // If no AI permissions, go back to main moderator dashboard
  redirect('/moderator');
}
