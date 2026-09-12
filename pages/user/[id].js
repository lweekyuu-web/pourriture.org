import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../../styles/profile.module.css';

export default function UserProfile({ user, posts, error }) {
  if (error) {
    return (
      <div className={styles.container}>
        <h1>User Not Found</h1>
        <p>{error}</p>
        <Link href="/">
          <a>Back to Home</a>
        </Link>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{user.displayName || `User ${user.anonId}`} - POURRITURE.ORG</title>
      </Head>
      <div className={styles.container}>
        <div className={styles.profileCard}>
          {/* Banner */}
          {user.bannerUrl && (
            <div className={styles.banner}>
              <img src={user.bannerUrl} alt="Profile Banner" />
            </div>
          )}

          {/* Header */}
          <div className={styles.header}>
            {/* Avatar */}
            <div className={styles.avatarSection}>
              {user.avatar && user.avatar.status === 'APPROVED' && (
                <img
                  src={user.avatar.url}
                  alt={user.displayName}
                  className={styles.avatar}
                />
              )}
              {!user.avatar && (
                <div className={styles.avatarPlaceholder}>
                  <span>{user.anonId.substring(0, 2).toUpperCase()}</span>
                </div>
              )}
            </div>

            <div className={styles.userInfo}>
              <h1>{user.displayName || `Anonymous #${user.anonId.substring(0, 6)}`}</h1>
              <div className={styles.badges}>
                <span className={styles.badge}>{user.badge}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.label}>Joined</span>
              <span className={styles.value}>
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.label}>Posts</span>
              <span className={styles.value}>{user.postCount}</span>
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <div className={styles.section}>
              <h3>About</h3>
              <p>{user.bio}</p>
            </div>
          )}

          {/* GIF */}
          {user.profileGif && (
            <div className={styles.section}>
              <h3>Profile GIF</h3>
              <img src={user.profileGif.gifUrl} alt={user.profileGif.gifTitle} />
            </div>
          )}

          {/* Signature */}
          {user.signature && (
            <div className={styles.section}>
              <div className={styles.signature}>
                <p>{user.signature}</p>
              </div>
            </div>
          )}
        </div>

        {/* Recent Posts */}
        {posts && posts.length > 0 && (
          <div className={styles.recentPosts}>
            <h2>Recent Posts</h2>
            <ul>
              {posts.map((post) => (
                <li key={post.id}>
                  <Link href={`/[board]/thread/[id]`} as={`/${post.thread.boardId}/thread/${post.threadId}`}>
                    <a>{post.thread.subject || `Thread #${post.threadId}`}</a>
                  </Link>
                  <span className={styles.postMeta}>{new Date(post.createdAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}

export async function getServerSideProps({ params }) {
  try {
    const { id } = params;

    // Fetch user profile
    const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/users/${id}`);
    if (!userRes.ok) {
      return {
        props: {
          error: 'User not found',
          user: null,
          posts: [],
        },
      };
    }

    const user = await userRes.json();

    // Fetch recent posts
    const postsRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/users/${id}/posts?limit=5`
    );
    const posts = postsRes.ok ? await postsRes.json() : [];

    return {
      props: {
        user,
        posts,
      },
      revalidate: 60, // ISR
    };
  } catch (error) {
    console.error('Error fetching profile:', error);
    return {
      props: {
        error: 'Error loading profile',
        user: null,
        posts: [],
      },
    };
  }
}
