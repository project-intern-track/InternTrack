declare module 'lucide-react' {
    import type { FC, SVGProps } from 'react';

    interface IconProps extends SVGProps<SVGSVGElement> {
        size?: number | string;
        color?: string;
        strokeWidth?: number | string;
        absoluteStrokeWidth?: boolean;
    }

    type Icon = FC<IconProps>;

    // Layout icons
    export const LayoutDashboard: Icon;
    export const Menu: Icon;
    export const X: Icon;
    export const ChevronDown: Icon;
    export const ChevronUp: Icon;
    export const ChevronLeft: Icon;
    export const ChevronRight: Icon;

    // User icons
    export const User: Icon;
    export const Users: Icon;
    export const UserPlus: Icon;
    export const UserCheck: Icon;
    export const ShieldCheck: Icon;

    // Misc icons
    export const Briefcase: Icon;

    // Action icons
    export const LogOut: Icon;
    export const LogIn: Icon;
    export const Settings: Icon;
    export const Bell: Icon;
    export const Search: Icon;
    export const Plus: Icon;
    export const Edit: Icon;
    export const Trash: Icon;
    export const Eye: Icon;
    export const EyeOff: Icon;

    // Task/Content icons
    export const ClipboardList: Icon;
    export const CheckCircle: Icon;
    export const Clock: Icon;
    export const Calendar: Icon;
    export const FileText: Icon;
    export const Megaphone: Icon;
    export const Star: Icon;
    export const BarChart: Icon;
    export const Home: Icon;
    export const Mail: Icon;
    export const Lock: Icon;
    export const AlertCircle: Icon;
    export const Info: Icon;
    export const Loader2: Icon;

    // Allow any other icon export
    const icons: Record<string, Icon>;
    export default icons;
}
