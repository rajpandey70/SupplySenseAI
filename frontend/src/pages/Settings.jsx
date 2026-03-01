import { useState, useEffect } from "react";
import api from "../utils/api";
import { notifyDateFormatChange } from "../utils/dateUtils";
import emailjs from "@emailjs/browser";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Theme and preferences state
  const [preferences, setPreferences] = useState({
    theme: localStorage.getItem("theme") || "light",
    language: localStorage.getItem("language") || "English",
    dateFormat: localStorage.getItem("dateFormat") || "MM/DD/YYYY",
    notifications: {
      email: JSON.parse(localStorage.getItem("emailNotifications") || "true"),
      sms: JSON.parse(localStorage.getItem("smsNotifications") || "false"),
      push: JSON.parse(localStorage.getItem("pushNotifications") || "true"),
      lowStock: JSON.parse(
        localStorage.getItem("lowStockNotifications") || "true",
      ),
    },
  });

  // Profile state
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    role: "",
    avatar: localStorage.getItem("userAvatar") || null,
  });

  // Password change modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // User Management state
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    username: "",
    email: "",
    fullName: "",
    password: "",
    role: "user",
  });
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUserId, setResetUserId] = useState(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");

  // Translations
  const translations = {
    English: {
      profile: "Profile",
      notifications: "Notifications",
      preferences: "Preferences",
      profileInfo: "Profile Information",
      fullName: "Full Name",
      email: "Email",
      role: "Role",
      changePicture: "Change Picture",
      saveProfile: "Save Profile",
      changePassword: "Change Password",
      notificationPreferences: "Notification Preferences",
      emailNotifications: "Email Notifications",
      smsAlerts: "SMS Alerts",
      pushNotifications: "Push Notifications",
      lowStockWarnings: "Low Stock Warnings",
      systemPreferences: "System Preferences",
      theme: "Theme",
      language: "Language",
      dateFormat: "Date Format",
      savePreferences: "Save Preferences",
      resetDefaults: "Reset to Defaults",
      light: "Light",
      dark: "Dark",
      system: "System",
      userManagement: "User Management",
      manageUsersTitle: "Manage Users",
      manageUsersDesc: "Create, view and delete user accounts.",
      addUser: "Add New User",
      deleteMsg: "Delete",
      nameHeader: "Name",
      usernameHeader: "Username",
      emailHeader: "Email",
      roleHeader: "Role",
      actionHeader: "Actions",
    },
    Hindi: {
      profile: "प्रोफ़ाइल",
      notifications: "सूचनाएं",
      preferences: "प्राथमिकताएं",
      profileInfo: "प्रोफ़ाइल जानकारी",
      fullName: "पूरा नाम",
      email: "ईमेल",
      role: "भूमिका",
      changePicture: "तस्वीर बदलें",
      saveProfile: "प्रोफ़ाइल सहेजें",
      changePassword: "पासवर्ड बदलें",
      notificationPreferences: "सूचना प्राथमिकताएं",
      emailNotifications: "ईमेल सूचनाएं",
      smsAlerts: "एसएमएस अलर्ट",
      pushNotifications: "पुश सूचनाएं",
      lowStockWarnings: "कम स्टॉक चेतावनी",
      systemPreferences: "सिस्टम प्राथमिकताएं",
      theme: "थीम",
      language: "भाषा",
      dateFormat: "दिनांक प्रारूप",
      savePreferences: "प्राथमिकताएं सहेजें",
      resetDefaults: "डिफ़ॉल्ट पर रीसेट करें",
      light: "लाइट",
      dark: "डार्क",
      system: "सिस्टम",
    },
    Spanish: {
      profile: "Perfil",
      notifications: "Notificaciones",
      preferences: "Preferencias",
      profileInfo: "Información del Perfil",
      fullName: "Nombre Completo",
      email: "Correo Electrónico",
      role: "Rol",
      changePicture: "Cambiar Foto",
      saveProfile: "Guardar Perfil",
      changePassword: "Cambiar Contraseña",
      notificationPreferences: "Preferencias de Notificación",
      emailNotifications: "Notificaciones por Email",
      smsAlerts: "Alertas SMS",
      pushNotifications: "Notificaciones Push",
      lowStockWarnings: "Advertencias de Stock Bajo",
      systemPreferences: "Preferencias del Sistema",
      theme: "Tema",
      language: "Idioma",
      dateFormat: "Formato de Fecha",
      savePreferences: "Guardar Preferencias",
      resetDefaults: "Restablecer Predeterminados",
      light: "Claro",
      dark: "Oscuro",
      system: "Sistema",
    },
    French: {
      profile: "Profil",
      notifications: "Notifications",
      preferences: "Préférences",
      profileInfo: "Informations du Profil",
      fullName: "Nom Complet",
      email: "Email",
      role: "Rôle",
      changePicture: "Changer la Photo",
      saveProfile: "Sauvegarder le Profil",
      changePassword: "Changer le Mot de Passe",
      notificationPreferences: "Préférences de Notification",
      emailNotifications: "Notifications Email",
      smsAlerts: "Alertes SMS",
      pushNotifications: "Notifications Push",
      lowStockWarnings: "Avertissements de Stock Faible",
      systemPreferences: "Préférences Système",
      theme: "Thème",
      language: "Langue",
      dateFormat: "Formato de Date",
      savePreferences: "Sauvegarder les Préférences",
      resetDefaults: "Réinitialiser par Défaut",
      light: "Clair",
      dark: "Sombre",
      system: "Système",
      userManagement: "Gestion des utilisateurs",
      manageUsersTitle: "Gérer les utilisateurs",
      manageUsersDesc: "Créer, voir et supprimer des comptes utilisateurs.",
      addUser: "Ajouter un utilisateur",
      deleteMsg: "Supprimer",
      nameHeader: "Nom",
      usernameHeader: "Nom d'utilisateur",
      emailHeader: "Email",
      roleHeader: "Rôle",
      actionHeader: "Actions",
    },
  };

  // Get current language translations
  const t = translations[preferences.language] || translations.English;

  // Format date according to user preference
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const format = preferences.dateFormat || "MM/DD/YYYY";

    switch (format) {
      case "DD/MM/YYYY":
        return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
      case "YYYY-MM-DD":
        return date.toISOString().split("T")[0];
      case "MM/DD/YYYY":
      default:
        return `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}/${date.getFullYear()}`;
    }
  };

  useEffect(() => {
    fetchUserData();
    applyTheme(preferences.theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === "users" && user?.role === "admin") {
      fetchUsersList();
    }
  }, [activeTab, user]);

  const fetchUsersList = async () => {
    try {
      setUsersLoading(true);
      const res = await api.get("/auth/users");
      if (res.data.success) {
        setUsersList(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      setUsersLoading(true);
      const res = await api.post("/auth/users", newUserData);
      if (res.data.success) {
        // Dispatch EmailJS
        try {
          const templateParams = {
            to_email: newUserData.email,
            to_name: newUserData.fullName || newUserData.username,
            username: newUserData.username,
            password: newUserData.password,
            role: newUserData.role,
          };

          await emailjs.send(
            "service_2x6oj2g",
            "template_lsk9kun",
            templateParams,
            "ZhTgafyPnUP28fcSt",
          );
          alert("User added successfully and login credentials emailed!");
        } catch (emailError) {
          console.error("EmailJS Error:", emailError);
          const errorMsg =
            emailError?.text || emailError?.message || "Unknown Error";
          alert(
            `User added successfully, but EmailJS failed with: ${errorMsg}\n\n(Tip: Check your EmailJS Dashboard. Ensure the Template's "To Email" field is set exactly to: {{to_email}})`,
          );
        }

        setShowAddUserModal(false);
        setNewUserData({
          username: "",
          email: "",
          fullName: "",
          password: "",
          role: "user",
        });
        fetchUsersList(); // Refresh list
      }
    } catch (err) {
      console.error("Error adding user:", err);
      alert(err.response?.data?.message || "Failed to add user.");
    } finally {
      setUsersLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this user? This cannot be undone.",
      )
    ) {
      try {
        setUsersLoading(true);
        const res = await api.delete(`/auth/users/${id}`);
        if (res.data.success) {
          fetchUsersList(); // Refresh list
        }
      } catch (err) {
        console.error("Error deleting user:", err);
        alert(err.response?.data?.message || "Failed to delete user.");
      } finally {
        setUsersLoading(false);
      }
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPasswordValue) return;

    try {
      setUsersLoading(true);
      const res = await api.put(`/auth/users/${resetUserId}/reset-password`, {
        newPassword: resetPasswordValue,
      });
      if (res.data.success) {
        alert(
          "Password reset successfully. Please share the new password securely.",
        );
        setShowResetModal(false);
        setResetPasswordValue("");
        setResetUserId(null);
      }
    } catch (err) {
      console.error("Error resetting password:", err);
      alert(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      // Try to get user data from API, fallback to localStorage
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      setUser(userData);
      setProfileData({
        fullName: userData.fullName || "User",
        email: userData.email || "",
        role: userData.role || "User",
        avatar: localStorage.getItem("userAvatar") || null,
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyTheme = (theme) => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const handleThemeChange = (newTheme) => {
    setPreferences((prev) => ({ ...prev, theme: newTheme }));
    applyTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    localStorage.setItem(
      key,
      typeof value === "string" ? value : JSON.stringify(value),
    );

    // Notify other components of date format change
    if (key === "dateFormat") {
      notifyDateFormatChange(value);
    }
  };

  const handleNotificationToggle = (type) => {
    const newValue = !preferences.notifications[type];
    setPreferences((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [type]: newValue },
    }));
    localStorage.setItem(`${type}Notifications`, JSON.stringify(newValue));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const avatarUrl = e.target.result;
        setProfileData((prev) => ({ ...prev, avatar: avatarUrl }));
        localStorage.setItem("userAvatar", avatarUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      // In a real app, this would update the user profile via API
      const updatedUser = {
        ...user,
        fullName: profileData.fullName,
        email: profileData.email,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      // Notify other components of user update
      window.dispatchEvent(new CustomEvent("userUpdated"));

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords do not match!");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert("Password must be at least 6 characters long!");
      return;
    }

    try {
      setSaving(true);

      // Call the API to change password
      const response = await api.put("/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.data.success) {
        alert(
          "Password changed successfully! You will need to log in again with your new password.",
        );
        setShowPasswordModal(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        // Logout user after password change for security
        setTimeout(() => {
          localStorage.removeItem("isAuthenticated");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }, 2000);
      }
    } catch (error) {
      console.error("Error changing password:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to change password. Please try again.";
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    if (
      window.confirm(
        "Are you sure you want to reset all preferences to default values? This cannot be undone.",
      )
    ) {
      const defaultPreferences = {
        theme: "light",
        language: "English",
        dateFormat: "MM/DD/YYYY",
        notifications: {
          email: true,
          sms: false,
          push: true,
          lowStock: true,
        },
      };

      setPreferences(defaultPreferences);

      // Clear localStorage and set defaults
      Object.keys(defaultPreferences).forEach((key) => {
        if (key === "notifications") {
          Object.keys(defaultPreferences.notifications).forEach((notifKey) => {
            localStorage.setItem(
              `${notifKey}Notifications`,
              JSON.stringify(defaultPreferences.notifications[notifKey]),
            );
          });
        } else {
          localStorage.setItem(key, defaultPreferences[key]);
        }
      });

      // Apply theme immediately
      applyTheme(defaultPreferences.theme);

      alert("Preferences reset to defaults successfully!");
    }
  };

  const handleSavePreferences = () => {
    try {
      setSaving(true);
      // Save all preferences
      Object.keys(preferences).forEach((key) => {
        if (key === "notifications") {
          Object.keys(preferences.notifications).forEach((notifKey) => {
            localStorage.setItem(
              `${notifKey}Notifications`,
              JSON.stringify(preferences.notifications[notifKey]),
            );
          });
        } else {
          localStorage.setItem(
            key,
            typeof preferences[key] === "string"
              ? preferences[key]
              : JSON.stringify(preferences[key]),
          );
        }
      });

      // Show visual feedback by updating the UI immediately
      setTimeout(() => {
        alert("Preferences saved successfully! Changes applied.");
        setSaving(false);
      }, 500);
    } catch (error) {
      console.error("Error saving preferences:", error);
      alert("Failed to save preferences");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fade-in">
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          <p className="mt-2 text-slate-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="border-b border-slate-200 dark:border-slate-700">
          <nav className="flex -mb-px">
            {[t.profile, t.notifications, t.preferences].map((tab, index) => {
              const tabKeys = ["profile", "notifications", "preferences"];
              const tabKey = tabKeys[index];
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tabKey)}
                  className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tabKey
                      ? "border-teal-500 text-teal-600 dark:text-teal-400"
                      : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300"
                  }`}
                >
                  {tab}
                </button>
              );
            })}

            {(user?.role === "admin" || user?.role === "manager") && (
              <button
                key="users"
                onClick={() => setActiveTab("users")}
                className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "users"
                    ? "border-teal-500 text-teal-600 dark:text-teal-400"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300"
                }`}
              >
                {t.userManagement || "User Management"}
              </button>
            )}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "profile" && (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-6">
                {t.profileInfo}
              </h3>

              {/* Avatar Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  {t.changePicture}
                </label>
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    {profileData.avatar ? (
                      <img
                        src={profileData.avatar}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-teal-500 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg">
                        {user.fullName
                          ? user.fullName.charAt(0).toUpperCase()
                          : user.email
                            ? user.email.charAt(0).toUpperCase()
                            : "U"}
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <label
                      htmlFor="avatar-upload"
                      className="bg-teal-500 text-white px-4 py-2 rounded-md hover:bg-teal-600 cursor-pointer text-sm font-medium transition-colors"
                    >
                      {t.changePicture}
                    </label>
                    <p className="text-xs text-slate-500 mt-1">
                      JPG, PNG up to 5MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t.fullName}
                  </label>
                  <input
                    type="text"
                    value={profileData.fullName}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        fullName: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t.email}
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t.role}
                </label>
                <input
                  type="text"
                  value={profileData.role}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-not-allowed"
                  disabled
                />
                <p className="text-xs text-slate-500 mt-1">
                  Role is managed by system administrator
                </p>
              </div>

              <div className="flex flex-wrap gap-4 mt-8">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-teal-500 text-white py-2 px-6 rounded-md hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
                >
                  {saving ? "Saving..." : t.saveProfile}
                </button>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 py-2 px-6 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 font-semibold transition-colors"
                >
                  {t.changePassword}
                </button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-6">
                {t.notificationPreferences}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Choose how you want to be notified about important updates and
                alerts.
              </p>

              <div className="space-y-6">
                {[
                  {
                    key: "email",
                    label: t.emailNotifications,
                    desc: "Receive updates via email",
                  },
                  {
                    key: "sms",
                    label: t.smsAlerts,
                    desc: "Get critical alerts via SMS",
                  },
                  {
                    key: "push",
                    label: t.pushNotifications,
                    desc: "Browser push notifications",
                  },
                  {
                    key: "lowStock",
                    label: t.lowStockWarnings,
                    desc: "Alerts when inventory runs low",
                  },
                ].map((notification) => (
                  <div
                    key={notification.key}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {notification.label}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {notification.desc}
                      </p>
                    </div>
                    <button
                      onClick={() => handleNotificationToggle(notification.key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        preferences.notifications[notification.key]
                          ? "bg-teal-500"
                          : "bg-slate-300 dark:bg-slate-600"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          preferences.notifications[notification.key]
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-blue-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Notification Settings
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      These preferences are saved locally and will apply to all
                      your devices. For SMS notifications, ensure your phone
                      number is verified.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-6">
                {t.systemPreferences}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Customize your experience with theme and language preferences.
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    {t.theme}
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "light", label: t.light, icon: "☀️" },
                      { value: "dark", label: t.dark, icon: "🌙" },
                      { value: "system", label: t.system, icon: "💻" },
                    ].map((theme) => (
                      <button
                        key={theme.value}
                        onClick={() => handleThemeChange(theme.value)}
                        className={`p-4 border-2 rounded-lg text-center transition-all ${
                          preferences.theme === theme.value
                            ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300"
                            : "border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="text-2xl mb-2">{theme.icon}</div>
                        <div className="text-sm font-medium">{theme.label}</div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Current theme:{" "}
                    <span className="font-medium capitalize">
                      {preferences.theme}
                    </span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t.language}
                  </label>
                  <select
                    value={preferences.language}
                    onChange={(e) =>
                      handlePreferenceChange("language", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t.dateFormat}
                  </label>
                  <select
                    value={preferences.dateFormat}
                    onChange={(e) =>
                      handlePreferenceChange("dateFormat", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    Preview: Today is {formatDate(new Date().toISOString())}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    onClick={handleSavePreferences}
                    disabled={saving}
                    className="bg-teal-500 text-white py-2 px-6 rounded-md hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
                  >
                    {saving ? "Saving..." : t.savePreferences}
                  </button>
                  <button
                    onClick={handleResetToDefaults}
                    className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 py-2 px-6 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 font-semibold transition-colors"
                  >
                    {t.resetDefaults}
                  </button>
                </div>
              </div>

              <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-amber-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Theme Changes
                    </h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      Theme changes take effect immediately. Dark mode may
                      affect readability in low-light conditions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" &&
            (user?.role === "admin" || user?.role === "manager") && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                      {t.manageUsersTitle || "Manage Users"}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {t.manageUsersDesc ||
                        "Create, view and delete user accounts."}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddUserModal(true)}
                    className="bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600 font-semibold transition-colors flex items-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    {t.addUser || "Add New User"}
                  </button>
                </div>

                {usersLoading ? (
                  <div className="text-center py-10">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                      <thead className="bg-slate-50 dark:bg-slate-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {t.nameHeader || "Name"}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {t.usernameHeader || "Username"}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {t.emailHeader || "Email"}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {t.roleHeader || "Role"}
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {t.actionHeader || "Actions"}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {usersList.map((u) => (
                          <tr key={u._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                              {u.fullName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                              {u.username}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                              {u.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  u.role === "admin"
                                    ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                    : u.role === "manager"
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                      : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-3">
                              {(user.role === "admin" ||
                                (user.role === "manager" &&
                                  u.role === "user")) &&
                                user._id !== u._id && (
                                  <button
                                    onClick={() => {
                                      setResetUserId(u._id);
                                      setShowResetModal(true);
                                    }}
                                    className="text-teal-600 hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-300"
                                    title="Reset Password"
                                  >
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4v-4l5.659-5.659C9.374 10.097 9 9.103 9 8a6 6 0 0112 0z"
                                      />
                                    </svg>
                                  </button>
                                )}
                              {user.role === "admin" && user._id !== u._id && (
                                <button
                                  onClick={() => handleDeleteUser(u._id)}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                  title="Delete User"
                                >
                                  {t.deleteMsg || "Delete"}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          {/* Password Change Modal */}
          {showPasswordModal && (
            <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-700">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                    {t.changePassword}
                  </h3>
                  <button
                    onClick={() => setShowPasswordModal(false)}
                    className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          currentPassword: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      placeholder="Confirm new password"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => setShowPasswordModal(false)}
                      className="flex-1 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 py-2 px-4 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleChangePassword}
                      disabled={saving}
                      className="flex-1 bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
                    >
                      {saving ? "Changing..." : "Change Password"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Add User Modal */}
          {showAddUserModal && (
            <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-700">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                    {t.addUser || "Add New User"}
                  </h3>
                  <button
                    onClick={() => setShowAddUserModal(false)}
                    className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleAddUser} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newUserData.fullName}
                      onChange={(e) =>
                        setNewUserData({
                          ...newUserData,
                          fullName: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      value={newUserData.username}
                      onChange={(e) =>
                        setNewUserData({
                          ...newUserData,
                          username: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={newUserData.email}
                      onChange={(e) =>
                        setNewUserData({
                          ...newUserData,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Password
                      </label>
                      <input
                        type="text"
                        required
                        value={newUserData.password}
                        onChange={(e) =>
                          setNewUserData({
                            ...newUserData,
                            password: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        placeholder="Assign password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Role
                      </label>
                      <select
                        value={newUserData.role}
                        onChange={(e) =>
                          setNewUserData({
                            ...newUserData,
                            role: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      >
                        <option value="user">User</option>
                        {user?.role === "admin" && (
                          <>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddUserModal(false)}
                      className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={usersLoading}
                      className="bg-teal-500 text-white px-6 py-2 rounded-md hover:bg-teal-600 disabled:opacity-50 transition-colors"
                    >
                      {usersLoading ? "Creating..." : "Create User"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Reset Password Modal */}
          {showResetModal && (
            <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-700">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                    Reset User Password
                  </h3>
                  <button
                    onClick={() => {
                      setShowResetModal(false);
                      setResetUserId(null);
                      setResetPasswordValue("");
                    }}
                    className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleResetPassword} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      New Password
                    </label>
                    <input
                      type="text"
                      required
                      value={resetPasswordValue}
                      onChange={(e) => setResetPasswordValue(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="pt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowResetModal(false);
                        setResetUserId(null);
                        setResetPasswordValue("");
                      }}
                      className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={usersLoading}
                      className="bg-teal-500 text-white px-6 py-2 rounded-md hover:bg-teal-600 disabled:opacity-50 transition-colors"
                    >
                      {usersLoading ? "Resetting..." : "Reset"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
