"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentsPage() {
  const router = useRouter();
  const [role, setRole] = useState('');

  useEffect(() => {
    const currentRole = localStorage.getItem('userRole') || '';
    setRole(currentRole);
    if (currentRole !== 'admin') {
      router.push('/dashboard');
    }
  }, [router]);

  if (role !== 'admin') return null;

  return <div style={{ padding: '1rem' }} />;
}
