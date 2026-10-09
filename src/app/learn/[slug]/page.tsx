import { LESSONS } from "@/data/lessons";
import { LessonView } from "./LessonView";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return LESSONS.map((l) => ({ slug: l.slug }));
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lesson = LESSONS.find((l) => l.slug === slug);
  if (!lesson) notFound();
  return <LessonView slug={slug} />;
}
