"use client";

import { ChevronUpIcon } from "@admin/assets/icons";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LogOutIcon, UserIcon } from "./icons";
import Image from "next/image";

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

  if (!user) {
    return (
      <div className="flex animate-pulse items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-gray-2 dark:bg-gray-dark border border-stroke dark:border-strokedark" />
        <div className="flex flex-col gap-1.5 max-[1024px]:sr-only">
          <div className="h-4 w-24 rounded bg-gray-2 dark:bg-gray-dark" />
          <div className="h-3 w-16 rounded bg-gray-2 dark:bg-gray-dark opacity-50" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 w-12 items-center justify-center rounded-full outline-none ring-primary ring-offset-2 focus-visible:ring-2"
      >
        <span className="sr-only">My Account</span>

        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white shadow-xl ring-1 ring-gray-100 dark:border-strokedark dark:ring-white/10">
          {user.img ? (
            <Image
              src={user.img}
              alt={user.name}
              width={48}
              height={48}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-blue-400 to-indigo-700 flex items-center justify-center text-white text-base font-bold">
              {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
          )}
          <div className="absolute bottom-0 right-1 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-strokedark rounded-full"></div>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 min-w-[17.5rem] rounded-2xl border border-stroke bg-white dark:bg-gray-dark dark:border-strokedark shadow-2xl p-1 z-[100]">
          <h2 className="sr-only">User information</h2>

          <div className="flex items-center gap-3 px-4 py-4 mb-1">
            <div className="relative h-12 w-12 shrink-0">
              {user.img ? (
                <Image
                  src={user.img}
                  alt={user.name}
                  width={48}
                  height={48}
                  className="rounded-full object-cover border-2 border-white ring-1 ring-gray-100 dark:border-strokedark"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-blue-400 to-indigo-700 rounded-full flex items-center justify-center text-white text-sm font-bold border-2 border-white ring-1 ring-gray-100 dark:border-strokedark">
                  {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border border-white dark:border-gray-800 rounded-full"></div>
            </div>

            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-dark dark:text-white leading-tight truncate">
                {user.name}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight truncate">
                {user.email}
              </span>
            </div>
          </div>

          <div className="h-px bg-gray-100 dark:bg-strokedark mx-1" />

          <div className="p-1">
            <button
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-red-50 dark:hover:bg-red-400/10 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
              onClick={handleLogout}
            >
              <LogOutIcon className="h-4.5 w-4.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
