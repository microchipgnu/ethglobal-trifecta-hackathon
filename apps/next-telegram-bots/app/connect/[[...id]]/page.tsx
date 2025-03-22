import { ConnectLanding } from '@/app/components/connect-landing';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ConnectLanding id={id} />;
}
