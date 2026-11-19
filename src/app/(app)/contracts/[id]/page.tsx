import { getUser, can } from "@/lib/auth";
import { ContractDetailView } from "@/components/contract-detail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const me = (await getUser())!;
  return <ContractDetailView id={(await params).id} canEdit={can.edit(me)} canDelete={can.del(me)} />;
}
