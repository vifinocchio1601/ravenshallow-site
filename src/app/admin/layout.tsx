import type { Metadata } from "next";

export const metadata: Metadata = {
  // La zone d'administration ne doit pas se retrouver dans un index.
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
