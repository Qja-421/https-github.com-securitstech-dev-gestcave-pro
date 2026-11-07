import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('super_admin' | 'client_admin' | 'employe')[];
}

const RoleGuard = ({ children, allowedRoles }: RoleGuardProps) => {
  const { profil, initialise, utilisateur } = useAuthStore();

  if (!initialise) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!utilisateur) {
    return <Navigate to="/connexion" replace />;
  }

  const estSuperAdmin = profil?.role === 'super_admin';

  if (estSuperAdmin && !allowedRoles.includes('super_admin')) {
    return <Navigate to="/super-admin" replace />;
  }

  if (!profil || !allowedRoles.includes(profil.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;
