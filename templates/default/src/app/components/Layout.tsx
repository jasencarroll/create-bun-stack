import { Link } from "react-router-dom";
import { HomeIcon, UserGroupIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/app/hooks/useAuth";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link
                to="/"
                className="flex items-center px-2 py-2 text-gray-900 font-semibold"
              >
                {{projectName}}
              </Link>
              <div className="ml-6 flex space-x-8">
                <Link
                  to="/"
                  className="inline-flex items-center px-1 pt-1 text-gray-500
                    hover:text-gray-900"
                >
                  <HomeIcon className="w-5 h-5 mr-1" />
                  Home
                </Link>
                <Link
                  to="/users"
                  className="inline-flex items-center px-1 pt-1 text-gray-500
                    hover:text-gray-900"
                >
                  <UserGroupIcon className="w-5 h-5 mr-1" />
                  Users
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  <span className="text-sm text-gray-700">
                    {user.name || user.email}
                  </span>
                  <button
                    type="button"
                    onClick={logout}
                    className="inline-flex items-center px-3 py-2 border border-transparent
                      text-sm font-medium rounded-md text-gray-700 bg-gray-100
                      hover:bg-gray-200 focus:outline-none focus:ring-2
                      focus:ring-offset-2 focus:ring-gray-500"
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
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}