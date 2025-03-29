'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProjectPage({ params }) {
  const router = useRouter();
  const { projectId } = params;

  // 默认重定向到文本分割页面
  useEffect(() => {
    router.push(`/projects/${projectId}/text-split`);
  }, [projectId, router]);

  return null;
}
