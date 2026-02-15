import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const user = await currentUser();
  const role = (user?.publicMetadata as { role?: string })?.role;

  if (role === 'teacher') {
    redirect('/generate');
  } else if (role === 'student') {
    redirect('/student');
  } else {
    redirect('/choose-role');
  }
}
