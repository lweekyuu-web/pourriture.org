export default function CatalogueRedirect() {
  return null;
}

export async function getServerSideProps() {
  return { redirect: { destination: '/catalog', permanent: true } };
}
