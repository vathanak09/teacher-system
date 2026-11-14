"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MethodologiesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    sessionStorage.setItem('lessons_filterType', 'methodologies');
    router.replace('/dashboard/lessons');
  }, [router]);

  return null;
}
