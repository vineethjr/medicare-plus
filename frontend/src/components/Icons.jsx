import React from "react";

const baseProps = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.8",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function StethoscopeIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <path d="M4.5 3v5a3.5 3.5 0 0 0 7 0V3" />
      <path d="M8 8v10a4 4 0 0 0 8 0v-3" />
      <circle cx="18" cy="12" r="3" />
      <circle cx="4.5" cy="3" r="1.5" />
      <circle cx="11.5" cy="3" r="1.5" />
    </svg>
  );
}

export function HeartPulseIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      <path d="M3.22 12H9.5l1.5-3 2 6.5 1.5-3.5h5.28" />
    </svg>
  );
}

export function BrainIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M12 5v13" />
      <path d="M9.5 9h5" />
      <path d="M9.5 13h5" />
    </svg>
  );
}

export function ShieldCheckIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function CreditCardIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
      <path d="M6 15h2" />
      <path d="M10 15h4" />
    </svg>
  );
}

export function CalendarIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
      <path d="m9 16 2 2 4-4" />
    </svg>
  );
}

export function VideoIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <path d="m22 8-6 4 6 4V8Z" />
      <rect width="14" height="12" x="2" y="6" rx="2" />
    </svg>
  );
}

export function FileTextIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  );
}

export function ActivityIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

export function UserIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <circle cx="12" cy="7" r="4" />
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    </svg>
  );
}

export function DoctorIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <circle cx="12" cy="7" r="4" />
      <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path d="M12 11v4" />
      <path d="M10 13h4" />
    </svg>
  );
}

export function ClockIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function CheckCircleIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function SearchIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" x2="16.65" y1="21" y2="16.65" />
    </svg>
  );
}

export function LogOutIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}

export function SparklesIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z" />
      <path d="M19 4v4" />
      <path d="M21 6h-4" />
    </svg>
  );
}

export function HospitalIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <path d="M12 6v4" />
      <path d="M10 8h4" />
      <path d="M18 22V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v18" />
      <path d="M18 10h4v12h-4" />
      <path d="M6 10H2v12h4" />
      <path d="M10 22v-4h4v4" />
    </svg>
  );
}

export function PillIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
      <line x1="8.5" x2="15.5" y1="8.5" y2="15.5" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <line x1="5" x2="19" y1="12" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export function LockIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <rect width="18" height="11" x="3" y="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function QrCodeIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <rect width="5" height="5" x="3" y="3" rx="1" />
      <rect width="5" height="5" x="16" y="3" rx="1" />
      <rect width="5" height="5" x="3" y="16" rx="1" />
      <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
      <path d="M21 21v.01" />
      <path d="M12 7v3a2 2 0 0 1-2 2H7" />
      <path d="M3 12h.01" />
      <path d="M12 3h.01" />
      <path d="M12 16v.01" />
      <path d="M16 12h1" />
      <path d="M21 12v.01" />
      <path d="M12 21v-1" />
    </svg>
  );
}

export function StarIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor" />
    </svg>
  );
}

export function DropletIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7Z" />
    </svg>
  );
}

export function LungsIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <path d="M12 4v16" />
      <path d="M6 7c-2 0-3 1.5-3 4 0 5 2.5 9 6 9h1V11C9 11 7 9 6 7Z" />
      <path d="M18 7c2 0 3 1.5 3 4 0 5-2.5 9-6 9h-1V11c1 0 3-2 4-4Z" />
    </svg>
  );
}

export function EyeIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function BoneIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <path d="M17 10c.7-.7 1.6-1 2.5-1a3.5 3.5 0 1 0-3.5-3.5c0 .9-.3 1.8-1 2.5L7 16c-.7.7-1.6 1-2.5 1a3.5 3.5 0 1 0 3.5 3.5c0-.9.3-1.8 1-2.5Z" />
    </svg>
  );
}

export function ToothIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <path d="M7 3C4.5 3 3 5 3 8c0 3.5 1.5 8 3 13 1 0 2-3 3-5 1 2 2 5 3 5 1.5-5 3-9.5 3-13 0-3-1.5-5-4-5-1.5 0-2.5 1-3 1-.5 0-1.5-1-3-1Z" />
    </svg>
  );
}

export function BabyIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 10h.01" />
      <path d="M15 10h.01" />
      <path d="M10 14a2 2 0 0 0 4 0" />
      <path d="M12 3a3 3 0 0 0-3 3" />
    </svg>
  );
}

export function PrinterIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <path d="M6 9V2h12v7" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect width="12" height="8" x="6" y="14" rx="1" />
    </svg>
  );
}

export function AlertCircleIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}

export function SettingsIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function HomeIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

export function PhoneIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export function MailIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

export function MapPinIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function PlusIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function XIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <line x1="18" x2="6" y1="6" y2="18" />
      <line x1="6" x2="18" y1="6" y2="18" />
    </svg>
  );
}

export function CheckIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function TrendingUpIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

export function AwardIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}

export function UploadIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  );
}

export function DownloadIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}

export function TrashIcon({ size = 20, className = "" }) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}


