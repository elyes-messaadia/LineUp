// 🎭 Configuration des Icônes Harmonisées - LineUp
// Ce fichier centralise tous les icônes utilisés dans l'application

export const ICONS = {
  // 🏠 Navigation et Interface
  home: "🏡",
  back: "←",
  menu: "☰",
  close: "✕",
  search: "🔍",
  filter: "🎯",

  // 🎟️ Système de Tickets
  ticket: "🎟️",
  queue: "📋",
  position: "📍",
  waiting: "⏳",
  number: "#️⃣",

  // 👥 Utilisateurs et Rôles
  user: "👤",
  users: "👥",
  doctor: "🩺",
  patient: "🧑‍⚕️",
  secretary: "💼",
  admin: "👑",

  // 📊 États et Statuts
  pending: "⏳",
  inProgress: "🔄",
  completed: "✨",
  cancelled: "❌",
  success: "✅",
  warning: "⚠️",
  error: "🚨",
  info: "ℹ️",

  // 💬 Communication
  chat: "💭",
  message: "💬",
  notification: "📢",
  bell: "🔔",
  email: "📨",
  phone: "📞",

  // ⚙️ Actions et Fonctionnalités
  edit: "✏️",
  delete: "🗑️",
  save: "💾",
  checkmark: "✅",
  download: "📥",
  upload: "📤",
  print: "🖨️",
  share: "📤",
  copy: "📋",

  // 🛡️ Sécurité et Authentification
  security: "🛡️",
  lock: "🔒",
  unlock: "🔓",
  key: "🔑",
  login: "🚪",
  logout: "🚶‍♂️",

  // 📅 Temps et Planning
  calendar: "📅",
  clock: "🕐",
  time: "⏰",
  schedule: "📆",
  date: "📅",

  // 🎨 Design et Interface
  theme: "🎨",
  settings: "⚙️",
  options: "🔧",
  tools: "🛠️",
  refresh: "🔄",

  // 📱 Devices et Accessibilité
  mobile: "📱",
  desktop: "🖥️",
  tablet: "📱",
  accessibility: "♿",

  // 🎯 Spécifiques à LineUp
  medical: "🏥",
  emergency: "🚨",
  priority: "🔥",
  queue_first: "1️⃣",
  queue_next: "⏭️",
  waiting_room: "🪑",

  // ➕ États d'interface
  add: "➕",
  remove: "➖",
  expand: "📈",
  collapse: "📉",
  up: "⬆️",
  down: "⬇️",
  left: "⬅️",
  right: "➡️",

  // 🌟 Feedback et Émotions
  like: "👍",
  dislike: "👎",
  heart: "❤️",
  star: "⭐",
  celebrate: "🎉",
  congratulations: "🎊",
};

// 🎨 Composant Icône avec classes harmonisées
export const Icon = ({
  name,
  size = "base",
  className = "",
  ariaLabel,
  ...props
}) => {
  const sizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
    "3xl": "text-3xl",
  };

  const icon = ICONS[name] || "❓";

  return (
    <span
      className={`inline-block ${sizeClasses[size]} ${className}`}
      aria-label={ariaLabel || name}
      role="img"
      {...props}
    >
      {icon}
    </span>
  );
};

// 🎯 Icônes spécialisés avec contexte
export const StatusIcon = ({ status, className = "" }) => {
  const statusConfig = {
    en_attente: { icon: "pending", color: "text-info-500" },
    en_consultation: { icon: "inProgress", color: "text-success-500" },
    termine: { icon: "completed", color: "text-secondary-500" },
    desiste: { icon: "cancelled", color: "text-error-500" },
    urgent: { icon: "emergency", color: "text-warning-500 animate-pulse" },
  };

  const config = statusConfig[status] || statusConfig["en_attente"];

  return (
    <Icon
      name={config.icon}
      className={`${config.color} ${className}`}
      ariaLabel={`Statut: ${status}`}
    />
  );
};

export const UserRoleIcon = ({ role, className = "" }) => {
  const roleConfig = {
    docteur: { icon: "doctor", color: "text-primary-500" },
    secretaire: { icon: "secretary", color: "text-accent-500" },
    admin: { icon: "admin", color: "text-secondary-700" },
    patient: { icon: "patient", color: "text-info-500" },
  };

  const config = roleConfig[role] || roleConfig["patient"];

  return (
    <Icon
      name={config.icon}
      className={`${config.color} ${className}`}
      ariaLabel={`Rôle: ${role}`}
    />
  );
};

// 🎪 Icônes animés pour les interactions
export const AnimatedIcon = ({
  name,
  animation = "hover:scale-110",
  className = "",
  ...props
}) => {
  return (
    <Icon
      name={name}
      className={`transition-transform duration-300 ${animation} ${className}`}
      {...props}
    />
  );
};

// 🚀 Export par défaut pour utilisation simple
export default Icon;
