import { useAuth } from "@/app/hooks/useAuth";
import { ArrowRightOnRectangleIcon, HomeIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-off-white">
      <nav className="bg-off-white-dark border-b border-border-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex items-center px-2 py-2 text-off-black font-semibold">
                {"{{projectName}}"}
              </Link>
              <div className="ml-6 flex space-x-8">
                <Link
                  to="/"
                  className="inline-flex items-center px-1 pt-1 text-gray-soft
                    hover:text-off-black transition-colors"
                >
                  <HomeIcon className="w-5 h-5 mr-1" />
                  Home
                </Link>
                {user?.role === "admin" && (
                  <Link
                    to="/users"
                    className="inline-flex items-center px-1 pt-1 text-gray-soft
                      hover:text-off-black transition-colors"
                  >
                    <UserGroupIcon className="w-5 h-5 mr-1" />
                    Users
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  <span className="text-sm text-gray-soft">{user.name || user.email}</span>
                  {user.role === "admin" && (
                    <span className="text-xs px-2 py-1 bg-accent-purple text-off-white rounded-full">
                      Admin
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={logout}
                    className="inline-flex items-center px-3 py-2 border border-border-light
                      text-sm font-medium rounded-md text-gray-soft bg-off-white
                      hover:bg-off-white-dark hover:text-off-black transition-colors
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-purple"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4 mr-1" />
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
