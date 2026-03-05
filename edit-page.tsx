// app/roles/[id]/edit/page.tsx
import { notFound, redirect } from "next/navigation";
import RoleForm, { RoleFormData } from "@/components/RoleForm";

// Fetch role data on the server (Next.js best practice — no useEffect needed)
async function getRole(id: string) {
  const res = await fetch(`${process.env.API_URL}/roles/${id}`, {
    cache: "no-store", // always fresh for edit pages
  });

  if (!res.ok) return null;

  const { role } = await res.json();
  return role;
}

async function updateRole(id: string, data: RoleFormData) {
  "use server";

  await fetch(`${process.env.API_URL}/roles/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role_name:   data.name,
      description: data.description || null,
      permission:  data.permissions,
    }),
  });

  redirect("/roles");
}

export default async function EditRolePage({ params }: { params: { id: string } }) {
  const role = await getRole(params.id);

  if (!role) notFound();

  // Map API shape → RoleFormData shape
  const defaultValues: RoleFormData = {
    name:        role.role_name,
    description: role.description ?? "",
    permissions: role.permission,   // already { user: [...], company: [...] }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow p-6">
        <h1 className="text-xl font-semibold mb-6">Edit Role</h1>
        <RoleForm
          defaultValues={defaultValues}
          onSubmit={updateRole.bind(null, params.id)}
        />
      </div>
    </div>
  );
}
