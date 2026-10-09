'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { openAuthModal } = useAuth();

  React.useEffect(() => {
    openAuthModal('SIGN_IN');
    router.replace('/');
  }, [openAuthModal, router]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-8 h-8 border-3 border-casa-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
