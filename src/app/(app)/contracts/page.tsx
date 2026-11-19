import { Suspense } from "react";
import { getUser, can } from "@/lib/auth";
import { ContractList } from "@/components/contract-list";

export default async function ContractsPage() {
  const me = (await getUser())!;
  return <Suspense><ContractList canEdit={can.edit(me)} canDelete={can.del(me)} /></Suspense>;
}
