import { useEffect } from 'react';
import { useRouter } from 'next/router';
import prisma from '../../lib/prisma';

export async function getServerSideProps({ params }) {
  const postNumber = decodeURIComponent(params.postNumber || '');
  const post = await prisma.post.findUnique({ where: { postNumber }, select: { id: true, threadId: true, thread: { select: { boardId: true } } } });
  if (!post) return { notFound: true };
  return { props: { boardId: post.thread.boardId, threadId: post.threadId, postId: post.id } };
}

export default function PostLink({ boardId, threadId, postId }) {
  const router = useRouter();
  const target = `/${boardId}/thread/${threadId}#post-${postId}`;
  useEffect(() => {
    if (router.isReady) window.location.replace(target);
  }, [router.isReady, target]);
  return <main className="container"><div className="page-nav">[<a href={target}>Open post</a>]</div><p>Opening post…</p></main>;
}
