// app/roles/create/page.tsx
import { redirect } from "next/navigation";
import RoleForm, { RoleFormData } from "@/components/RoleForm";

async function createRole(data: RoleFormData) {
  "use server";

  await fetch(`${process.env.API_URL}/roles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role_name:   data.name,
      description: data.description || null,
      permission:  data.permissions,
    }),
  });

  redirect("/roles");
}

export default function CreateRolePage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow p-6">
        <h1 className="text-xl font-semibold mb-6">Add Role</h1>
        <RoleForm onSubmit={createRole} />
      </div>
    </div>
  );
}
