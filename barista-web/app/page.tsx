import { redirect } from 'next/navigation';

// Root → redirect to a demo bill page (or show a landing page)
export default function Home() {
  redirect('/bill/BRST10001');
}
