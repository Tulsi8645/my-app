"use client";

import { ChevronUpIcon } from "@admin/assets/icons";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LogOutIcon, UserIcon } from "./icons";

import { getCurrentUser, logout } from "@/app/actions/auth";

export function UserInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; role: string; img: string } | null>(null);

  useEffect(() => {
    async function loadUser() {
      const data = await getCurrentUser();
      if (data) {
        setUser(data);
      }
    }
    loadUser();
  }, []);

  const handleLogout = async () => {
    // Clear client-side session data to ensure LoginScreen is shown
    localStorage.removeItem('user');
    await logout();
  };

  if (!user) return null; // Or a loading skeleton

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 align-middle outline-none ring-primary ring-offset-2 focus-visible:ring-1"
      >
        <span className="sr-only">My Account</span>

        <div className="relative h-12 w-12">
          <div className="h-full w-full bg-gradient-to-br from-blue-300 to-indigo-600 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-xl border-2 border-white ring-1 ring-gray-100">
            {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
        </div>

        <span className="flex items-center gap-1 font-medium text-dark max-[1024px]:sr-only">
          <span>{user.name}</span>

          <ChevronUpIcon
            aria-hidden
            className={cn(
              "rotate-180 transition-transform",
              isOpen && "rotate-0",
            )}
            strokeWidth={1.5}
          />
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 min-w-[17.5rem] rounded-lg border border-stroke bg-white shadow-md">
          <h2 className="sr-only">User information</h2>

          <figure className="flex items-center gap-2.5 px-5 py-3.5">
            <div className="relative h-12 w-12 shrink-0">
              <div className="h-full w-full bg-gradient-to-br from-blue-300 to-indigo-600 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-xl border-2 border-white ring-1 ring-gray-100">
                {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>

            <figcaption className="space-y-1 text-base font-medium">
              <div className="mb-2 leading-none text-dark">
                {user.name}
              </div>

              <div className="leading-none text-gray-6">{user.email}</div>
            </figcaption>
          </figure>

          <hr className="border-[#E8E8E8]" />

          <div className="p-2 text-base text-[#4B5563]">
            <button
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark"
              onClick={handleLogout}
            >
              <LogOutIcon />

              <span className="text-base font-medium">Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
