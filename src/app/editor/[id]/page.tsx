"use client";
import { useParams } from "next/navigation";
import { Editor } from "@/components/editor/Editor";

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  return <Editor key={id} projectId={id} />;
}
