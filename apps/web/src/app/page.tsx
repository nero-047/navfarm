const services = [
  ['API', 'NestJS backend', 'http://localhost:3000/api'],
  ['Web', 'Next.js App Router', 'http://localhost:3001'],
  ['Mobile', 'Flutter application', 'Run with Nx or Flutter'],
];

export default function Index() {
  return (
    <main className="min-h-screen bg-emerald-950 px-6 py-16 text-emerald-50">
      <section className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
          Agriculture operations platform
        </p>
        <h1 className="mt-4 max-w-3xl text-5xl font-bold tracking-tight sm:text-7xl">
          Welcome to NAVFarm
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-emerald-100/80">
          The Nx workspace is ready for independent API, web, and mobile
          development.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {services.map(([name, description, endpoint]) => (
            <article
              key={name}
              className="rounded-2xl border border-emerald-700/60 bg-emerald-900/60 p-6 shadow-xl shadow-black/10"
            >
              <h2 className="text-xl font-semibold text-white">{name}</h2>
              <p className="mt-2 text-emerald-100/75">{description}</p>
              <p className="mt-6 break-words font-mono text-sm text-emerald-300">
                {endpoint}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
