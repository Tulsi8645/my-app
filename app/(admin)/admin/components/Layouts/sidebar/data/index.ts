import * as Icons from "../icons";

export interface SubMenuItem {
  title: string;
  url: string;
}

export interface MenuItem {
  title: string;
  url?: string;
  icon: typeof Icons.HomeIcon;
  items: SubMenuItem[];
}

export interface NavSection {
  label: string;
  items: MenuItem[];
}

export const NAV_DATA: NavSection[] = [
  {
    label: "MAIN MENU",
    items: [
      {
        title: "Dashboard",
        url: "/admin",
        icon: Icons.HomeIcon,
        items: [],
      },

      {
        title: "Attendance Logs",
        url: "/admin/attendance-logs",
        icon: Icons.Table,
        items: [],
      },
    ],
  },
];
