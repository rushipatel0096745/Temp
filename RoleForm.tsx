"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RoleFormData = {
  name: string;
  description: string;
  permissions: Record<string, string[]>; // e.g. { user: ["list", "create"] }
};

type Props = {
  defaultValues?: RoleFormData;
  onSubmit: (data: RoleFormData) => Promise<void>;
  isLoading?: boolean;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const PERMISSION_GROUPS = [
  { label: "Manage User",    key: "user",    actions: ["list", "create", "update", "delete"] },
  { label: "Manage Role",    key: "role",    actions: ["list", "create", "update", "delete"] },
  { label: "Manage Company", key: "company", actions: ["list", "create", "update", "delete", "login-to-company"] },
];

const EMPTY_PERMISSIONS: Record<string, string[]> = Object.fromEntries(
  PERMISSION_GROUPS.map((g) => [g.key, []])
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function RoleForm({ defaultValues, onSubmit, isLoading }: Props) {
  const router = useRouter();

  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<Record<string, string[]>>(EMPTY_PERMISSIONS);
  const [expanded, setExpanded]       = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting]   = useState(false);

  // Pre-fill when editing
  useEffect(() => {
    if (!defaultValues) return;
    setName(defaultValues.name);
    setDescription(defaultValues.description ?? "");
    setPermissions({ ...EMPTY_PERMISSIONS, ...defaultValues.permissions });
  }, [defaultValues]);

  // ── Permission helpers ──────────────────────────────────────────────────────

  const toggleAction = (groupKey: string, action: string) => {
    setPermissions((prev) => {
      const current = prev[groupKey] ?? [];
      const updated  = current.includes(action)
        ? current.filter((a) => a !== action)
        : [...current, action];
      return { ...prev, [groupKey]: updated };
    });
  };

  const toggleGroup = (groupKey: string, actions: string[], checked: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [groupKey]: checked ? [...actions] : [],
    }));
  };

  const groupState = (groupKey: string, actions: string[]) => {
    const selected = permissions[groupKey] ?? [];
    if (selected.length === 0)              return "none";
    if (selected.length === actions.length) return "all";
    return "some";
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Strip groups with no actions selected
      const cleanedPermissions = Object.fromEntries(
        Object.entries(permissions).filter(([, actions]) => actions.length > 0)
      );
      await onSubmit({ name, description, permissions: cleanedPermissions });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Name */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Admin"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Description</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Permissions */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Permissions</p>

        {PERMISSION_GROUPS.map((group) => {
          const state = groupState(group.key, group.actions);
          const isOpen = expanded[group.key];

          return (
            <div key={group.key} className="border border-gray-200 rounded-lg overflow-hidden">

              {/* Group row */}
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50">
                <input
                  type="checkbox"
                  checked={state === "all"}
                  ref={(el) => { if (el) el.indeterminate = state === "some"; }}
                  onChange={(e) => toggleGroup(group.key, group.actions, e.target.checked)}
                  className="w-4 h-4 accent-green-600"
                />
                <span className="flex-1 text-sm font-medium text-gray-800">{group.label}</span>
                <button
                  type="button"
                  onClick={() => setExpanded((prev) => ({ ...prev, [group.key]: !prev[group.key] }))}
                  className="text-xs text-gray-500 hover:text-gray-800"
                >
                  {isOpen ? "▲ Hide" : "▼ Show"}
                </button>
              </div>

              {/* Actions */}
              {isOpen && (
                <div className="flex flex-wrap gap-x-6 gap-y-2 px-4 py-3">
                  {group.actions.map((action) => (
                    <label key={action} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(permissions[group.key] ?? []).includes(action)}
                        onChange={() => toggleAction(group.key, action)}
                        className="w-4 h-4 accent-green-600"
                      />
                      {action.charAt(0).toUpperCase() + action.slice(1)}
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={submitting || isLoading}
          className="px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {submitting || isLoading ? "Saving..." : "Save"}
        </button>
      </div>

    </form>
  );
}
