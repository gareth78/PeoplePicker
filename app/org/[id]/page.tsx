import OrgChartView from '@/components/org/OrgChartView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function OrgPage({ params }: { params: { id: string } }) {
  return <OrgChartView focusId={params.id} />;
}
