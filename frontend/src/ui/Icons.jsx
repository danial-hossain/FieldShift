// FieldShift Unified SVG & Lucide Icon Set
// Uniform stroke (1.75 / 1.85 / 2.0), viewBox="0 0 24 24", stroke="currentColor", fill="none"
// Provides complete vector icon coverage for UI chrome, alerts, modals, toasts, and sidebar navigation.

import React from 'react';
import {
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  Check,
  CheckCircle,
  CheckCircle2,
  X,
  RefreshCw,
  RotateCw,
  Info,
  Home,
  Map,
  MapPin,
  Sun,
  Moon,
  Bell,
  Bot,
  User,
  Globe,
  Search,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronLeft,
  Play,
  Pause,
  CheckSquare,
  ListChecks,
  ClipboardList,
  Printer,
  Copy,
  MessageSquare,
  Sparkles,
  Sprout,
  Leaf,
  Droplet,
  Droplets,
  CloudRain,
  Thermometer,
  Compass,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Clock,
  Calendar,
  FileText,
  TrendingUp,
  TrendingDown,
  Tractor,
  Wheat,
  Satellite,
  FlaskConical,
  Dna,
  Microscope,
  Brain,
  Calculator,
  BookOpen,
  BarChart3,
  BarChart,
  Plus,
  Minus,
  Trash2,
  Trash,
  Pencil,
  Edit,
  Filter,
  Sliders,
  Download,
  Upload,
  Share,
  ExternalLink,
  Maximize,
  Minimize,
  Eye,
  EyeOff,
  Menu,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

const baseProps = (size = 20, className = '', color = 'currentColor', strokeWidth = 1.85) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: color,
  strokeWidth: String(strokeWidth),
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  className: `ui-icon ${className}`.trim(),
  'aria-hidden': 'true',
});

const wrapLucide = (LucideComp) => {
  return function LucideIconWrapper({
    size = 20,
    color = 'currentColor',
    strokeWidth = 1.85,
    className = '',
    ...props
  }) {
    return (
      <LucideComp
        size={size}
        color={color}
        strokeWidth={strokeWidth}
        className={`ui-icon ${className}`.trim()}
        aria-hidden="true"
        {...props}
      />
    );
  };
};

// ---------------------------------------------------------
// 1. Core FieldShift Domain & Navigation Icons (Custom SVGs)
// ---------------------------------------------------------

export const HomeIcon = ({ size = 20, color = 'currentColor', strokeWidth = 1.85, className = '', ...props }) => (
  <svg {...baseProps(size, className, color, strokeWidth)} {...props}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

export const FieldIcon = ({ size = 20, color = 'currentColor', strokeWidth = 1.85, className = '', ...props }) => (
  <svg {...baseProps(size, className, color, strokeWidth)} {...props}>
    <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z" />
    <line x1="9" y1="3" x2="9" y2="18" />
    <line x1="15" y1="6" x2="15" y2="21" />
  </svg>
);

export const RotationIcon = ({ size = 20, color = 'currentColor', strokeWidth = 1.85, className = '', ...props }) => (
  <svg {...baseProps(size, className, color, strokeWidth)} {...props}>
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-1.19" />
  </svg>
);

export const WeatherIcon = ({ size = 20, color = 'currentColor', strokeWidth = 1.85, className = '', ...props }) => (
  <svg {...baseProps(size, className, color, strokeWidth)} {...props}>
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z" />
    <line x1="12" y1="19" x2="12" y2="22" />
    <line x1="8" y1="19" x2="7" y2="21" />
    <line x1="16" y1="19" x2="17" y2="21" />
  </svg>
);

export const WaterIcon = ({ size = 20, color = 'currentColor', strokeWidth = 1.85, className = '', ...props }) => (
  <svg {...baseProps(size, className, color, strokeWidth)} {...props}>
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);

export const MarketIcon = ({ size = 20, color = 'currentColor', strokeWidth = 1.85, className = '', ...props }) => (
  <svg {...baseProps(size, className, color, strokeWidth)} {...props}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

export const CubeIcon = ({ size = 20, color = 'currentColor', strokeWidth = 1.85, className = '', ...props }) => (
  <svg {...baseProps(size, className, color, strokeWidth)} {...props}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

export const EvidenceIcon = ({ size = 20, color = 'currentColor', strokeWidth = 1.85, className = '', ...props }) => (
  <svg {...baseProps(size, className, color, strokeWidth)} {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const SunIcon = ({ size = 20, color = 'currentColor', strokeWidth = 1.85, className = '', ...props }) => (
  <svg {...baseProps(size, className, color, strokeWidth)} {...props}>
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

export const MoonIcon = ({ size = 20, color = 'currentColor', strokeWidth = 1.85, className = '', ...props }) => (
  <svg {...baseProps(size, className, color, strokeWidth)} {...props}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export const PresentationIcon = ({ size = 20, color = 'currentColor', strokeWidth = 1.85, className = '', ...props }) => (
  <svg {...baseProps(size, className, color, strokeWidth)} {...props}>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

export const CompareIcon = ({ size = 20, color = 'currentColor', strokeWidth = 1.85, className = '', ...props }) => (
  <svg {...baseProps(size, className, color, strokeWidth)} {...props}>
    <rect x="3" y="4" width="7" height="16" rx="1" />
    <rect x="14" y="4" width="7" height="16" rx="1" />
  </svg>
);

export const ChecklistIcon = ({ size = 20, color = 'currentColor', strokeWidth = 1.85, className = '', ...props }) => (
  <svg {...baseProps(size, className, color, strokeWidth)} {...props}>
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

export const PrintIcon = ({ size = 20, color = 'currentColor', strokeWidth = 1.85, className = '', ...props }) => (
  <svg {...baseProps(size, className, color, strokeWidth)} {...props}>
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);

export const CopyIcon = ({ size = 20, color = 'currentColor', strokeWidth = 1.85, className = '', ...props }) => (
  <svg {...baseProps(size, className, color, strokeWidth)} {...props}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

export const SmsIcon = ({ size = 20, color = 'currentColor', strokeWidth = 1.85, className = '', ...props }) => (
  <svg {...baseProps(size, className, color, strokeWidth)} {...props}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

// ---------------------------------------------------------
// 2. Alert, Feedback, Modal, and Utility Icons
// ---------------------------------------------------------

export const AlertTriangleIcon = wrapLucide(AlertTriangle);
export const AlertCircleIcon = wrapLucide(AlertCircle);
export const AlertOctagonIcon = wrapLucide(AlertOctagon);
export const CheckIcon = wrapLucide(Check);
export const CheckCircleIcon = wrapLucide(CheckCircle);
export const CheckCircle2Icon = wrapLucide(CheckCircle2);
export const CloseIcon = wrapLucide(X);
export const XIcon = wrapLucide(X);
export const RefreshIcon = wrapLucide(RefreshCw);
export const RefreshCwIcon = wrapLucide(RefreshCw);
export const RotateCwIcon = wrapLucide(RotateCw);
export const InfoIcon = wrapLucide(Info);
export const SearchIcon = wrapLucide(Search);
export const HelpIcon = wrapLucide(HelpCircle);
export const ChevronDownIcon = wrapLucide(ChevronDown);
export const ChevronRightIcon = wrapLucide(ChevronRight);
export const ChevronUpIcon = wrapLucide(ChevronUp);
export const ChevronLeftIcon = wrapLucide(ChevronLeft);
export const GlobeIcon = wrapLucide(Globe);
export const BellIcon = wrapLucide(Bell);
export const BotIcon = wrapLucide(Bot);
export const UserIcon = wrapLucide(User);
export const PlayIcon = wrapLucide(Play);
export const PauseIcon = wrapLucide(Pause);
export const CheckSquareIcon = wrapLucide(CheckSquare);
export const ListChecksIcon = wrapLucide(ListChecks);
export const ClipboardListIcon = wrapLucide(ClipboardList);
export const SparklesIcon = wrapLucide(Sparkles);
export const SproutIcon = wrapLucide(Sprout);
export const LeafIcon = wrapLucide(Leaf);
export const DropletIcon = wrapLucide(Droplet);
export const DropletsIcon = wrapLucide(Droplets);
export const CloudRainIcon = wrapLucide(CloudRain);
export const ThermometerIcon = wrapLucide(Thermometer);
export const CompassIcon = wrapLucide(Compass);
export const SettingsIcon = wrapLucide(Settings);
export const ShieldIcon = wrapLucide(Shield);
export const ShieldAlertIcon = wrapLucide(ShieldAlert);
export const ShieldCheckIcon = wrapLucide(ShieldCheck);
export const LockIcon = wrapLucide(Lock);
export const ClockIcon = wrapLucide(Clock);
export const CalendarIcon = wrapLucide(Calendar);
export const FileTextIcon = wrapLucide(FileText);
export const TrendingUpIcon = wrapLucide(TrendingUp);
export const TrendingDownIcon = wrapLucide(TrendingDown);
export const TractorIcon = wrapLucide(Tractor);
export const WheatIcon = wrapLucide(Wheat);
export const SatelliteIcon = wrapLucide(Satellite);
export const FlaskConicalIcon = wrapLucide(FlaskConical);
export const DnaIcon = wrapLucide(Dna);
export const MicroscopeIcon = wrapLucide(Microscope);
export const BrainIcon = wrapLucide(Brain);
export const CalculatorIcon = wrapLucide(Calculator);
export const BookOpenIcon = wrapLucide(BookOpen);
export const BarChart3Icon = wrapLucide(BarChart3);
export const BarChartIcon = wrapLucide(BarChart);
export const PlusIcon = wrapLucide(Plus);
export const MinusIcon = wrapLucide(Minus);
export const Trash2Icon = wrapLucide(Trash2);
export const TrashIcon = wrapLucide(Trash);
export const PencilIcon = wrapLucide(Pencil);
export const EditIcon = wrapLucide(Edit);
export const FilterIcon = wrapLucide(Filter);
export const SlidersIcon = wrapLucide(Sliders);
export const DownloadIcon = wrapLucide(Download);
export const UploadIcon = wrapLucide(Upload);
export const ShareIcon = wrapLucide(Share);
export const ExternalLinkIcon = wrapLucide(ExternalLink);
export const MaximizeIcon = wrapLucide(Maximize);
export const MinimizeIcon = wrapLucide(Minimize);
export const EyeIcon = wrapLucide(Eye);
export const EyeOffIcon = wrapLucide(EyeOff);
export const MenuIcon = wrapLucide(Menu);
export const ArrowLeftIcon = wrapLucide(ArrowLeft);
export const ArrowRightIcon = wrapLucide(ArrowRight);
export const ArrowUpIcon = wrapLucide(ArrowUp);
export const ArrowDownIcon = wrapLucide(ArrowDown);

// ---------------------------------------------------------
// 3. Direct Lucide Component Re-exports
// ---------------------------------------------------------

export {
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  Check,
  CheckCircle,
  CheckCircle2,
  X,
  RefreshCw,
  RotateCw,
  Info,
  Home,
  Map,
  MapPin,
  Sun,
  Moon,
  Bell,
  Bot,
  User,
  Globe,
  Search,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronLeft,
  Play,
  Pause,
  CheckSquare,
  ListChecks,
  ClipboardList,
  Printer,
  Copy,
  MessageSquare,
  Sparkles,
  Sprout,
  Leaf,
  Droplet,
  Droplets,
  CloudRain,
  Thermometer,
  Compass,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Clock,
  Calendar,
  FileText,
  TrendingUp,
  TrendingDown,
  Tractor,
  Wheat,
  Satellite,
  FlaskConical,
  Dna,
  Microscope,
  Brain,
  Calculator,
  BookOpen,
  BarChart3,
  BarChart,
  Plus,
  Minus,
  Trash2,
  Trash,
  Pencil,
  Edit,
  Filter,
  Sliders,
  Download,
  Upload,
  Share,
  ExternalLink,
  Maximize,
  Minimize,
  Eye,
  EyeOff,
  Menu,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
};

export default {
  HomeIcon,
  FieldIcon,
  RotationIcon,
  WeatherIcon,
  WaterIcon,
  MarketIcon,
  CubeIcon,
  EvidenceIcon,
  SunIcon,
  MoonIcon,
  PresentationIcon,
  CompareIcon,
  PlayIcon,
  ChecklistIcon,
  PrintIcon,
  CopyIcon,
  SmsIcon,
  InfoIcon,
  CheckIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  CloseIcon,
  RefreshIcon,
  SearchIcon,
  HelpIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  GlobeIcon,
  BellIcon,
  BotIcon,
  UserIcon,
};
