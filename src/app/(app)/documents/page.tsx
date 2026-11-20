import { Suspense } from "react";
import { getUser, can } from "@/lib/auth";
import { DocumentList } from "@/components/document-list";

export default async function DocumentsPage() {
  const me = (await getUser())!;
  return <Suspense><DocumentList canEdit={can.edit(me)} /></Suspense>;
}
