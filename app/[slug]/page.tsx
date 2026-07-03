import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnnouncementBar from "@/components/AnnouncementBar";

export default async function CustomPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: page } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!page) notFound();

  return (
    <>
      <AnnouncementBar />
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-navy mb-4">{page.title}</h1>
        <div className="rich-content" dangerouslySetInnerHTML={{ __html: page.content_html || "" }} />
      </div>
      <Footer />
    </>
  );
}
