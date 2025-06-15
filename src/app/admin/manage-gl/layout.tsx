export const metadata = {
    title: 'Admin - Manage GL',
    description: 'Daily Operational Tugu System Website.',
    icons: {
        icon: `${process.env.NEXT_PUBLIC_BASE_URL}/images/Logo.png`,
        apple: `${process.env.NEXT_PUBLIC_BASE_URL}/images/Logo.png`, 
    },
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}