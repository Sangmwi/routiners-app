import {
  Bell,
  Calendar,
  Camera,
  CaretRight,
  ChartBar,
  Crown,
  Envelope,
  FileText,
  Gift,
  House,
  Image,
  Megaphone,
  Palette,
  ShieldCheck,
  SignOut,
  Ticket,
  User,
  UserMinus,
  UsersThree,
} from 'phosphor-react-native';

export const AppIcons = {
  home: House,
  routine: Calendar,
  stats: ChartBar,
  community: UsersThree,
  profile: User,

  palette: Palette,
  bell: Bell,
  signOut: SignOut,
  userMinus: UserMinus,
  envelope: Envelope,
  megaphone: Megaphone,
  fileText: FileText,
  shieldCheck: ShieldCheck,
  crown: Crown,
  gift: Gift,
  ticket: Ticket,
  usersThree: UsersThree,
  caretRight: CaretRight,

  camera: Camera,
  image: Image,
} as const;

export type AppIconName = keyof typeof AppIcons;
