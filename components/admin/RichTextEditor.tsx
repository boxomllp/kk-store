"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { createClient } from "@/lib/supabase/client";
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Quote,
  LinkIcon,
  ImageIcon,
  Eraser,
} from "lucide-react";

export default function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: "rich-content min-h-[160px] px-3 py-2 focus:outline-none" },
    },
    immediatelyRender: false,
  });

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    const supabase = createClient();
    const path = `content/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) return;
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    editor.chain().focus().setImage({ src: data.publicUrl }).run();
    e.target.value = "";
  }

  if (!editor) return null;

  const btn = (active: boolean) =>
    `p-1.5 rounded hover:bg-gray-200 ${active ? "bg-gray-200 text-cta" : "text-gray-600"}`;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex flex-wrap gap-1 border-b bg-gray-50 px-2 py-1.5">
        <button type="button" className={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()}>
          <BoldIcon size={16} />
        </button>
        <button type="button" className={btn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <ItalicIcon size={16} />
        </button>
        <button type="button" className={btn(editor.isActive("underline"))} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={16} />
        </button>
        <span className="w-px bg-gray-300 mx-1" />
        <button type="button" className={btn(editor.isActive("heading", { level: 1 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          H1
        </button>
        <button type="button" className={btn(editor.isActive("heading", { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </button>
        <button type="button" className={btn(editor.isActive("heading", { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </button>
        <span className="w-px bg-gray-300 mx-1" />
        <button type="button" className={btn(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={16} />
        </button>
        <button type="button" className={btn(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={16} />
        </button>
        <button type="button" className={btn(editor.isActive("blockquote"))} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote size={16} />
        </button>
        <span className="w-px bg-gray-300 mx-1" />
        <button
          type="button"
          className={btn(editor.isActive("link"))}
          onClick={() => {
            const url = window.prompt("URL");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
        >
          <LinkIcon size={16} />
        </button>
        <label className="p-1.5 rounded hover:bg-gray-200 text-gray-600 cursor-pointer">
          <ImageIcon size={16} />
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </label>
        <button type="button" className="p-1.5 rounded hover:bg-gray-200 text-gray-600" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
          <Eraser size={16} />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
