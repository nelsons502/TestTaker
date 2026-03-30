"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/tests", label: "Tests" },
  { href: "/admin/grading", label: "Essay Grading" },
];

export function AdminSidebar({ fullName }: { fullName: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-6">
        <Link href="/admin/tests" className="text-xl font-bold text-gray-900">
          TestTaker
        </Link>
        <p className="mt-1 text-sm text-gray-500">Admin Panel</p>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                isActive
                  ? "bg-teal-50 text-teal-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <p className="truncate text-sm font-medium text-gray-700">
          {fullName || "Admin"}
        </p>
        <Link
          href="/auth/sign-out"
          className="mt-2 block text-sm text-gray-500 hover:text-gray-700"
        >
          Sign out
        </Link>
      </div>
    </aside>
  );
}
