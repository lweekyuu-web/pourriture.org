import '../styles/globals.css';
import { SiteHeader, SiteFooter } from '../components/Layout';

export default function App({ Component, pageProps }) {
  return (
    <>
      <SiteHeader isAdmin={pageProps.isAdmin} />
      <Component {...pageProps} />
      <SiteFooter />
    </>
  );
}
