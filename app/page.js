import { redirect } from 'next/navigation';

// The portal has no public landing page — the shell decides where an
// authenticated vendor belongs, and Welcome is the entry point for everyone
// else.
export default function Home() {
  redirect('/welcome');
}
