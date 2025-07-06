export function HomePage() {
  return (
    <div className="px-4 py-12 sm:px-0">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-5xl font-bold text-off-black mb-6">Welcome to {"{{projectName}}"}</h1>
        <p className="text-xl text-gray-soft mb-4">Built with Bun, React, and Drizzle ORM</p>
        <p className="text-base text-gray-soft">
          A modern, type-safe fullstack application with PostgreSQL and SQLite support
        </p>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-off-white-dark p-6 rounded-lg border border-border-light hover:border-accent-purple transition-colors">
            <h3 className="font-semibold text-off-black mb-2">Fast</h3>
            <p className="text-sm text-gray-soft">Powered by Bun's lightning-fast runtime</p>
          </div>
          <div className="bg-off-white-dark p-6 rounded-lg border border-border-light hover:border-accent-purple transition-colors">
            <h3 className="font-semibold text-off-black mb-2">Type-safe</h3>
            <p className="text-sm text-gray-soft">End-to-end TypeScript with Drizzle ORM</p>
          </div>
          <div className="bg-off-white-dark p-6 rounded-lg border border-border-light hover:border-accent-purple transition-colors">
            <h3 className="font-semibold text-off-black mb-2">Secure</h3>
            <p className="text-sm text-gray-soft">Built-in auth, CSRF protection, and more</p>
          </div>
        </div>
      </div>
    </div>
  );
}
