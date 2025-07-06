import { useAuth } from "@/app/hooks/useAuth";
import { apiClient } from "@/app/lib/api";
import type { User } from "@/lib/types";
import { ChevronDownIcon, ChevronUpIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const {
    data: users,
    isLoading,
    error,
  } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: () => apiClient.get<User[]>("/api/users"),
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: "user" | "admin" }) => {
      await apiClient.put(`/api/users/${id}`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDeleteConfirm(null);
    },
  });

  const handleRoleToggle = (user: User) => {
    if (user.id === currentUser?.id) {
      alert("You cannot change your own role");
      return;
    }
    const newRole = user.role === "admin" ? "user" : "admin";
    updateUserMutation.mutate({ id: user.id, role: newRole });
  };

  const handleDelete = (user: User) => {
    if (user.id === currentUser?.id) {
      alert("You cannot delete your own account");
      return;
    }
    deleteUserMutation.mutate(user.id);
  };

  if (isLoading) return <div className="p-4 text-gray-soft">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error.message}</div>;

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-off-black">Users</h1>
        <p className="text-gray-soft mt-1">Manage all registered users</p>
      </div>

      <div className="bg-off-white-dark border border-border-light rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border-light">
            <thead className="bg-off-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-soft uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-soft uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-soft uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-soft uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-off-white-dark divide-y divide-border-light">
              {users?.map((user) => (
                <tr key={user.id} className="hover:bg-off-white transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-off-black">{user.name}</p>
                      <p className="text-sm text-gray-soft">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleRoleToggle(user)}
                      disabled={user.id === currentUser?.id || updateUserMutation.isPending}
                      className={`inline-flex items-center text-xs px-3 py-1 rounded-full transition-colors ${
                        user.role === "admin"
                          ? "bg-accent-purple text-off-white hover:bg-purple-500"
                          : "bg-off-white border border-border-light text-gray-soft hover:bg-gray-100"
                      } ${
                        user.id === currentUser?.id
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      {user.role === "admin" ? (
                        <>
                          Admin
                          {user.id !== currentUser?.id && (
                            <ChevronDownIcon className="ml-1 h-3 w-3" />
                          )}
                        </>
                      ) : (
                        <>
                          User
                          {user.id !== currentUser?.id && (
                            <ChevronUpIcon className="ml-1 h-3 w-3" />
                          )}
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-soft">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {deleteConfirm === user.id ? (
                      <div className="flex items-center justify-end space-x-2">
                        <span className="text-xs text-gray-soft">Delete?</span>
                        <button
                          type="button"
                          onClick={() => handleDelete(user)}
                          className="text-red-600 hover:text-red-700 text-xs font-semibold"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(null)}
                          className="text-gray-soft hover:text-off-black text-xs"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(user.id)}
                        disabled={user.id === currentUser?.id}
                        className={`text-red-600 hover:text-red-700 ${
                          user.id === currentUser?.id ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users?.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-soft">No users found</div>
        )}
      </div>
    </div>
  );
}
