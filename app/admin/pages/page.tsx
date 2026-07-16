"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import RichTextEditor from "@/components/admin/RichTextEditor";
import type { PageRow } from "@/lib/types";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function AdminPagesPage() {
  const [pages, setPages] = useState<PageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PageRow | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("pages").select("*").order("created_at", { ascending: true });
    setPages((data ?? []) as PageRow[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startNew() {
    setEditing({
      id: "",
      title: "",
      slug: "",
      content_html: "",
      show_in_header: false,
      show_in_footer: false,
      created_at: "",
    });
    setCreating(true);
  }

  async function handleSave() {
    if (!editing) return;
    const supabase = createClient();
    if (creating) {
      await supabase.from("pages").insert({
        title: editing.title,
        slug: editing.slug || slugify(editing.title),
        content_html: editing.content_html,
        show_in_header: editing.show_in_header,
        show_in_footer: editing.show_in_footer,
      });
    } else {
      await supabase
        .from("pages")
        .update({
          title: editing.title,
          slug: editing.slug,
          content_html: editing.content_html,
          show_in_header: editing.show_in_header,
          show_in_footer: editing.show_in_footer,
        })
        .eq("id", editing.id);
    }
    setEditing(null);
    setCreating(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this page?")) return;
    const supabase = createClient();
    await supabase.from("pages").delete().eq("id", id);
    load();
  }

  async function toggleFlag(page: PageRow, field: "show_in_header" | "show_in_footer") {
    const supabase = createClient();
    const value = !page[field];
    await supabase.from("pages").update({ [field]: value }).eq("id", page.id);
    setPages((prev) => prev.map((p) => (p.id === page.id ? { ...p, [field]: value } : p)));
  }

  if (editing) {
    return (
      <div>
        <h1 className="text-xl font-bold text-navy mb-6">{creating ? "New Page" : "Edit Page"}</h1>
        <div className="bg-white border rounded-xl p-5 space-y-4 max-w-2xl">
          <div>
            <label className="text-sm font-medium">Title</label>
            <input
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: creating ? slugify(e.target.value) : editing.slug })}
              className="w-full border rounded-lg px-3 py-2 mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Slug</label>
            <input
              value={editing.slug}
              onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Content</label>
            <RichTextEditor
              value={editing.content_html || ""}
              onChange={(html) => setEditing({ ...editing, content_html: html })}
            />
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editing.show_in_header}
                onChange={(e) => setEditing({ ...editing, show_in_header: e.target.checked })}
              />
              Show in Header
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editing.show_in_footer}
                onChange={(e) => setEditing({ ...editing, show_in_footer: e.target.checked })}
              />
              Show in Footer
            </label>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} className="bg-cta text-white font-semibold px-5 py-2 rounded-lg">
              Save
            </button>
            <button onClick={() => { setEditing(null); setCreating(false); }} className="text-gray-500 px-5 py-2">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-navy">Pages</h1>
        <button onClick={startNew} className="bg-cta text-white text-sm font-semibold px-4 py-2 rounded-lg">
          + Add Page
        </button>
      </div>
      <div className="bg-white border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2">Header</th>
              <th className="px-4 py-2">Footer</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              pages.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="px-4 py-2 font-medium">{p.title}</td>
                  <td className="px-4 py-2 text-gray-500">/{p.slug}</td>
                  <td className="px-4 py-2">
                    <input type="checkbox" checked={p.show_in_header} onChange={() => toggleFlag(p, "show_in_header")} />
                  </td>
                  <td className="px-4 py-2">
                    <input type="checkbox" checked={p.show_in_footer} onChange={() => toggleFlag(p, "show_in_footer")} />
                  </td>
                  <td className="px-4 py-2 space-x-3">
                    <button onClick={() => { setEditing(p); setCreating(false); }} className="text-ctatext font-medium">Edit</button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-500 font-medium">Delete</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
