import { useEffect } from 'react';
import { useRouter } from 'next/router';
import prisma from '../../lib/prisma';

export async function getServerSideProps({ params }) {
  const postNumber = decodeURIComponent(params.postNumber || '');
  const post = await prisma.post.findUnique({ where: { postNumber }, select: { id: true, threadId: true, status: true, hidden: true } });
  if (!post) return { notFound: true };
  return { props: { threadId: post.threadId, postId: post.id } };
}

export default function PostLink({ threadId, postId }) {
  const router = useRouter();
  useEffect(() => {
    if (!router.isReady) return;
    window.location.replace(`/thread/${threadId}#post-${postId}`);
  }, [router.isReady, threadId, postId]);
  return <main className="container"><div className="page-nav">[<a href={`/thread/${threadId}#post-${postId}`}>Open post</a>]</div><p>Opening post…</p></main>;
}
