import type { DeliveryLanguage } from '@/stores/deliveryPreferencesStore';

type Keys =
  | 'profileTitle'
  | 'account'
  | 'settings'
  | 'personalInfo'
  | 'vehicleInfo'
  | 'documents'
  | 'driversLicense'
  | 'updateAccount'
  | 'save'
  | 'cancel'
  | 'deleteAccount'
  | 'deleteConfirmTitle'
  | 'deleteConfirmMessage'
  | 'password'
  | 'closeAccount'
  | 'darkMode'
  | 'darkModeHint'
  | 'notifications'
  | 'notificationsHint'
  | 'language'
  | 'appearance'
  | 'general'
  | 'memberSince'
  | 'reliability'
  | 'totalOrders'
  | 'email'
  | 'phone'
  | 'name'
  | 'profilePhotoUrl'
  | 'plate'
  | 'vehicleModel'
  | 'vehicleColor'
  | 'vehicleType'
  | 'licenseNumber'
  | 'licenseExpiry'
  | 'emergencyContact'
  | 'ecName'
  | 'ecPhone'
  | 'ecRelation'
  | 'changePassword'
  | 'currentPassword'
  | 'newPassword'
  | 'confirmPassword'
  | 'logOut'
  | 'appVersion'
  | 'verifiedOnFile'
  | 'expires';

const STR: Record<DeliveryLanguage, Record<Keys, string>> = {
  en: {
    profileTitle: 'Profile',
    account: 'Account',
    settings: 'Settings',
    personalInfo: 'Personal Info',
    vehicleInfo: 'Vehicle',
    documents: 'Documents',
    driversLicense: "Driver's License",
    updateAccount: 'Edit account',
    save: 'Save',
    cancel: 'Cancel',
    deleteAccount: 'Delete account',
    deleteConfirmTitle: 'Delete account?',
    deleteConfirmMessage:
      'This permanently removes your delivery partner profile. This cannot be undone.',
    password: 'Password',
    closeAccount: 'Delete my account',
    darkMode: 'Dark mode',
    darkModeHint: 'Adjust app appearance for low light',
    notifications: 'Push notifications',
    notificationsHint: 'Order alerts and dispatch updates',
    language: 'Language',
    appearance: 'Appearance',
    general: 'General',
    memberSince: 'Member Since',
    reliability: 'Reliability',
    totalOrders: 'Total Orders',
    email: 'Email',
    phone: 'Phone',
    name: 'Full name',
    profilePhotoUrl: 'Profile photo URL',
    plate: 'Plate number',
    vehicleModel: 'Vehicle model',
    vehicleColor: 'Vehicle color',
    vehicleType: 'Vehicle type',
    licenseNumber: 'License number',
    licenseExpiry: 'License expiry (YYYY-MM-DD)',
    emergencyContact: 'Emergency contact',
    ecName: 'Contact name',
    ecPhone: 'Contact phone',
    ecRelation: 'Relation',
    changePassword: 'Change password',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm new password',
    logOut: 'Log Out',
    appVersion: 'APP VERSION',
    verifiedOnFile: 'Verified • On file',
    expires: 'Expires',
  },
  es: {
    profileTitle: 'Perfil',
    account: 'Cuenta',
    settings: 'Ajustes',
    personalInfo: 'Información personal',
    vehicleInfo: 'Vehículo',
    documents: 'Documentos',
    driversLicense: 'Licencia de conducir',
    updateAccount: 'Editar cuenta',
    save: 'Guardar',
    cancel: 'Cancelar',
    deleteAccount: 'Eliminar cuenta',
    deleteConfirmTitle: '¿Eliminar cuenta?',
    deleteConfirmMessage:
      'Esto elimina tu perfil de repartidor de forma permanente. No se puede deshacer.',
    password: 'Contraseña',
    closeAccount: 'Eliminar mi cuenta',
    darkMode: 'Modo oscuro',
    darkModeHint: 'Aspecto para poca luz',
    notifications: 'Notificaciones',
    notificationsHint: 'Alertas de pedidos y despacho',
    language: 'Idioma',
    appearance: 'Apariencia',
    general: 'General',
    memberSince: 'Miembro desde',
    reliability: 'Fiabilidad',
    totalOrders: 'Pedidos totales',
    email: 'Correo',
    phone: 'Teléfono',
    name: 'Nombre completo',
    profilePhotoUrl: 'URL de foto de perfil',
    plate: 'Matrícula',
    vehicleModel: 'Modelo',
    vehicleColor: 'Color',
    vehicleType: 'Tipo de vehículo',
    licenseNumber: 'Nº de licencia',
    licenseExpiry: 'Vencimiento (AAAA-MM-DD)',
    emergencyContact: 'Contacto de emergencia',
    ecName: 'Nombre',
    ecPhone: 'Teléfono',
    ecRelation: 'Parentesco',
    changePassword: 'Cambiar contraseña',
    currentPassword: 'Contraseña actual',
    newPassword: 'Nueva contraseña',
    confirmPassword: 'Confirmar nueva',
    logOut: 'Cerrar sesión',
    appVersion: 'VERSIÓN',
    verifiedOnFile: 'Verificado • Archivo',
    expires: 'Vence',
  },
  fr: {
    profileTitle: 'Profil',
    account: 'Compte',
    settings: 'Réglages',
    personalInfo: 'Informations perso.',
    vehicleInfo: 'Véhicule',
    documents: 'Documents',
    driversLicense: 'Permis de conduire',
    updateAccount: 'Modifier le compte',
    save: 'Enregistrer',
    cancel: 'Annuler',
    deleteAccount: 'Supprimer le compte',
    deleteConfirmTitle: 'Supprimer le compte ?',
    deleteConfirmMessage:
      'Cela supprime définitivement votre profil livreur. Action irréversible.',
    password: 'Mot de passe',
    closeAccount: 'Supprimer mon compte',
    darkMode: 'Mode sombre',
    darkModeHint: 'Affichage pour faible luminosité',
    notifications: 'Notifications',
    notificationsHint: 'Alertes commandes et dispatch',
    language: 'Langue',
    appearance: 'Apparence',
    general: 'Général',
    memberSince: 'Membre depuis',
    reliability: 'Fiabilité',
    totalOrders: 'Commandes totales',
    email: 'E-mail',
    phone: 'Téléphone',
    name: 'Nom complet',
    profilePhotoUrl: 'URL photo de profil',
    plate: "Plaque d'immatriculation",
    vehicleModel: 'Modèle',
    vehicleColor: 'Couleur',
    vehicleType: 'Type de véhicule',
    licenseNumber: 'Nº de permis',
    licenseExpiry: 'Expiration (AAAA-MM-JJ)',
    emergencyContact: "Contact d'urgence",
    ecName: 'Nom',
    ecPhone: 'Téléphone',
    ecRelation: 'Lien',
    changePassword: 'Changer le mot de passe',
    currentPassword: 'Mot de passe actuel',
    newPassword: 'Nouveau mot de passe',
    confirmPassword: 'Confirmer',
    logOut: 'Déconnexion',
    appVersion: 'VERSION',
    verifiedOnFile: 'Vérifié • Dossier',
    expires: 'Expire',
  },
  ur: {
    profileTitle: 'پروفائل',
    account: 'اکاؤنٹ',
    settings: 'ترتیبات',
    personalInfo: 'ذاتی معلومات',
    vehicleInfo: 'گاڑی',
    documents: 'دستاویزات',
    driversLicense: 'ڈرائیونگ لائسنس',
    updateAccount: 'اکاؤنٹ میں تبدیلی',
    save: 'محفوظ',
    cancel: 'منسوخ',
    deleteAccount: 'اکاؤنٹ حذف',
    deleteConfirmTitle: 'اکاؤنٹ حذف کریں؟',
    deleteConfirmMessage: 'یہ آپ کی ڈیلیوری پروفائل مستقل طور پر مٹا دے گا۔',
    password: 'پاس ورڈ',
    closeAccount: 'میرا اکاؤنٹ حذف کریں',
    darkMode: 'ڈارک موڈ',
    darkModeHint: 'کم روشنی کے لیے ظاہری شکل',
    notifications: 'اطلاعات',
    notificationsHint: 'آرڈر اور ڈسپیچ کی اطلاعات',
    language: 'زبان',
    appearance: 'ظاہری شکل',
    general: 'عام',
    memberSince: 'رکن سے',
    reliability: 'قابل اعتماد',
    totalOrders: 'کل آرڈر',
    email: 'ای میل',
    phone: 'فون',
    name: 'مکمل نام',
    profilePhotoUrl: 'پروفائل تصویر URL',
    plate: 'نمبر پلیٹ',
    vehicleModel: 'ماڈل',
    vehicleColor: 'رنگ',
    vehicleType: 'گاڑی کی قسم',
    licenseNumber: 'لائسنس نمبر',
    licenseExpiry: 'اختتام (YYYY-MM-DD)',
    emergencyContact: 'ہنگامی رابطہ',
    ecName: 'نام',
    ecPhone: 'فون',
    ecRelation: 'رشتہ',
    changePassword: 'پاس ورڈ تبدیل',
    currentPassword: 'موجودہ پاس ورڈ',
    newPassword: 'نیا پاس ورڈ',
    confirmPassword: 'تصدیق',
    logOut: 'لاگ آؤٹ',
    appVersion: 'ورژن',
    verifiedOnFile: 'تصدیق شدہ • فائل',
    expires: 'ختم',
  },
};

export function deliveryProfileT(lang: DeliveryLanguage, key: Keys): string {
  return STR[lang][key] ?? STR.en[key];
}

export const DELIVERY_LANGUAGE_LABELS: Record<DeliveryLanguage, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  ur: 'اردو',
};
