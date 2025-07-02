export function HomePage() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg h-96
        flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to {{projectName}}
          </h1>
          <p className="text-xl text-gray-600">
            Built with Bun, React, and Drizzle ORM
          </p>
          <p className="text-sm text-gray-500 mt-2">
            PostgreSQL with SQLite fallback
          </p>
        </div>
      </div>
    </div>
  );
}