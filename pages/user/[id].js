import Head from 'next/head';
import Link from 'next/link';
import styles from '../../styles/profile.module.css';

export default function UserProfile({ user, posts, error, isOwner }) {
  if (error) {
    return <div className={styles.container}><h1>User Not Found</h1><p>{error}</p><Link href="/"><a>Back to Home</a></Link></div>;
  }

  const showPosts = user.customizations?.showPostCount !== false;
  const showJoinDate = user.customizations?.showJoinDate !== false;
  const theme = user.customizations?.theme || user.profileTheme || 'default';

  return (
    <>
      <Head><title>{user.displayName || `User ${user.anonId}`} - POURRITURE.ORG</title></Head>
      <div className={`${styles.container} ${styles[`theme_${theme}`] || ''}`}>
        <div className={styles.profileCard}>
          {user.bannerUrl && <div className={styles.banner}><img src={user.bannerUrl} alt="Profile banner" /></div>}

          <div className={styles.header}>
            <div className={styles.avatarSection}>
              {user.avatar ? <img src={user.avatar.url} alt={user.displayName || 'Avatar'} className={styles.avatar} /> : (
                <div className={styles.avatarPlaceholder}><span>{user.anonId.substring(0, 2).toUpperCase()}</span></div>
              )}
            </div>
            <div className={styles.userInfo}>
              <h1>{user.displayName || `Anonymous #${user.anonId.substring(0, 6)}`}</h1>
              <div className={styles.badges}><span className={styles.badge}>{user.badge}</span></div>
              <small className={styles.userId}>User ID: {user.anonId}</small>
            </div>
            {isOwner && <Link href={`/user/${encodeURIComponent(user.anonId)}/edit`}><a className={styles.editLink}>Edit Profile</a></Link>}
          </div>

          <div className={styles.stats}>
            {showJoinDate && <div className={styles.statItem}><span className={styles.label}>Joined</span><span className={styles.value}>{new Date(user.createdAt).toLocaleDateString()}</span></div>}
            {showPosts && <div className={styles.statItem}><span className={styles.label}>Posts</span><span className={styles.value}>{user.postCount}</span></div>}
          </div>

          {user.bio && <div className={styles.section}><h3>About</h3><p>{user.bio}</p></div>}

          {user.profileGif && <div className={styles.section}><h3>Profile GIF <small>/{user.profileGif.category}</small></h3><img src={user.profileGif.gifUrl} alt={user.profileGif.gifTitle} /></div>}

          {user.signature && <div className={styles.section}><h3>Signature</h3><div className={styles.signature}><p>{user.signature}</p></div></div>}
        </div>

        {posts && posts.length > 0 && <div className={styles.recentPosts}>
          <h2>Recent Posts</h2>
          <ul>{posts.map((post) => <li key={post.id}><Link href={`/[board]/thread/[id]`} as={`/${post.thread.boardId}/thread/${post.threadId}`}><a>{post.thread.subject || `Thread #${post.threadId}`}</a></Link><span className={styles.postMeta}>{new Date(post.createdAt).toLocaleDateString()}</span></li>)}</ul>
        </div>}
      </div>
    </>
  );
}

export async function getServerSideProps({ params, req }) {
  try {
    const baseUrl = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers['x-forwarded-host'] || req.headers.host}`;
    const userRes = await fetch(`${baseUrl}/api/users/${encodeURIComponent(params.id)}`);
    if (!userRes.ok) return { props: { error: 'User not found', user: null, posts: [], isOwner: false } };
    const user = await userRes.json();
    const postsRes = await fetch(`${baseUrl}/api/users/${encodeURIComponent(params.id)}/posts?limit=5`);
    const posts = postsRes.ok ? await postsRes.json() : [];
    return { props: { user, posts, isOwner: req.cookies?.pourriture_uid === user.id } };
  } catch (error) {
    console.error('Error fetching profile:', error);
    return { props: { error: 'Error loading profile', user: null, posts: [], isOwner: false } };
  }
}
