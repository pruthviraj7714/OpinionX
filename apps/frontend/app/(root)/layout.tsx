import Appbar from "@/components/Appbar";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Appbar />
      {children}
    </>
  );
}
