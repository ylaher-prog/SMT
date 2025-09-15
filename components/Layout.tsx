import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
// FIX: Import Notification type
import type { Page, Teacher, AcademicStructure, Notification, PhaseStructure, Tenant } from '../types';
import type { Permission } from '../permissions';

interface LayoutProps {
  children: React.ReactNode;
  activePage: Page;
  setActivePage: (page: Page) => void;
  currentUser: Teacher;
  onLogout: () => void;
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  isDarkMode: boolean;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  academicStructure: AcademicStructure;
  phaseStructures: PhaseStructure[];
  currentAcademicYear: string;
  setCurrentAcademicYear: (year: string) => void;
  permissions: Permission[];
  notifications: Notification[];
  onUpdateNotifications: (ids: string[], read: boolean) => void;
  selectedPhaseId: string;
  setSelectedPhaseId: (phaseId: string) => void;
  selectedCurriculum: string;
  setSelectedCurriculum: (curriculum: string) => void;
  selectedMode: string;
  setSelectedMode: (mode: string) => void;
  tenants: Tenant[];
  currentTenantId: string | null;
  setCurrentTenantId: (tenantId: string) => void;
}

const Layout: React.FC<LayoutProps> = (props) => {
  const { children, activePage, setActivePage, currentUser, onLogout, setTeachers, isDarkMode, setIsDarkMode, academicStructure, phaseStructures, currentAcademicYear, setCurrentAcademicYear, permissions, notifications, onUpdateNotifications, selectedPhaseId, setSelectedPhaseId, selectedCurriculum, setSelectedCurriculum, selectedMode, setSelectedMode, tenants, currentTenantId, setCurrentTenantId } = props;
  return (
    <div className="flex h-screen bg-brand-bg dark:bg-brand-navy font-sans text-brand-text-dark dark:text-gray-300">
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        currentUser={currentUser} 
        academicStructure={academicStructure}
        permissions={permissions}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          pageTitle={activePage.charAt(0).toUpperCase() + activePage.slice(1)} 
          currentUser={currentUser}
          onLogout={onLogout}
          setTeachers={setTeachers}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          academicStructure={academicStructure}
          currentAcademicYear={currentAcademicYear}
          setCurrentAcademicYear={setCurrentAcademicYear}
          notifications={notifications}
          onUpdateNotifications={onUpdateNotifications}
          permissions={permissions}
          phaseStructures={phaseStructures}
          selectedPhaseId={selectedPhaseId}
          setSelectedPhaseId={setSelectedPhaseId}
          selectedCurriculum={selectedCurriculum}
          setSelectedCurriculum={setSelectedCurriculum}
          selectedMode={selectedMode}
          setSelectedMode={setSelectedMode}
          tenants={tenants}
          currentTenantId={currentTenantId}
          setCurrentTenantId={setCurrentTenantId}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;