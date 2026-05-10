export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-4">{children}</div>;
}
