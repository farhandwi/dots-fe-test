import UpdateTransaction from '@/components/update-transaction/UpdateTransaction';

export const metadata = {
  title: 'DOTS - Update Dots',
  description: 'Daily Operational Tugu System Website.',
  icons: {
    icon: `${process.env.NEXT_PUBLIC_BASE_URL}/images/Logo.png`,
    apple: `${process.env.NEXT_PUBLIC_BASE_URL}/images/Logo.png`, 
  },
};

export default function UpdateTransactionPage({
  params
}: {
    params: { dots_no_hash: string }
}) {
    return <UpdateTransaction dots_no_hash={params.dots_no_hash} />;
}