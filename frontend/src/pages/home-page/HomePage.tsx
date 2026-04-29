import './HomePage.css';

export function HomePage() {
  const userRaw = localStorage.getItem('modden_user');
  const user = userRaw ? JSON.parse(userRaw) : null;

  return (
    <main className="home-page">
      <section className="home-card">
        <h1>Welcome to MODDEN{user?.username ? `, ${user.username}` : ''}</h1>
        <p>
          This is the first version of the home page. Later we will add projects,
          templates and the graphic editor workspace here.
        </p>
      </section>
    </main>
  );
}
