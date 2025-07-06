import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div
      className="min-h-full px-4 py-16 sm:px-6 sm:py-24 md:grid
      md:place-items-center lg:px-8"
    >
      <div className="max-w-max mx-auto">
        <main className="sm:flex">
          <p
            className="text-4xl font-extrabold text-off-black
            sm:text-5xl"
          >
            404
          </p>
          <div className="sm:ml-6">
            <div className="sm:border-l sm:border-border-light sm:pl-6">
              <h1
                className="text-4xl font-extrabold text-off-black tracking-tight
                sm:text-5xl"
              >
                Page not found
              </h1>
              <p className="mt-1 text-base text-gray-soft">
                Please check the URL in the address bar and try again.
              </p>
            </div>
            <div className="mt-10 flex space-x-3 sm:border-l sm:border-transparent sm:pl-6">
              <Link
                to="/"
                className="inline-flex items-center px-4 py-2 border
                  border-transparent text-sm font-medium rounded-md shadow-sm
                  text-off-white bg-off-black hover:bg-gray-800 transition-colors
                  focus:outline-none focus:ring-2 focus:ring-offset-2
                  focus:ring-off-black"
              >
                Go back home
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
