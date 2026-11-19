import { Suspense } from "react";
import { DocumentList } from "@/components/document-list";

export default function DocumentsPage() {
  return <Suspense><DocumentList /></Suspense>;
}
