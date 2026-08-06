import React, { useState, useEffect, useCallback } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { LandingPage } from './components/LandingPage';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { DataSiswaView } from './components/DataSiswaView';
import { AbsenSiswaView } from './components/AbsenSiswaView';
import { KonselingView } from './components/KonselingView';
import { JurnalHarianView } from './components/JurnalHarianView';
import { PenilaianHarianView } from './components/PenilaianHarianView';
import { InstallModal } from './components/InstallModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';

import {
  Siswa,
  Absensi,
  Konseling,
  JurnalHarian,
  PenilaianHarian,
  ActiveTab
} from './types';

import {
  initDatabase,
  getAllSiswa,
  saveSiswa,
  deleteSiswa,
  saveSiswaBatch,
  getAllAbsensi,
  saveAbsensiBatch,
  deleteAbsensi,
  getAllKonseling,
  saveKonseling,
  deleteKonseling,
  getAllJurnal,
  saveJurnal,
  deleteJurnal,
  getAllPenilaian,
  savePenilaian,
  deletePenilaian,
  exportDatabaseJSON
} from './db/indexedDB';

import { exportMultiSheetDatabaseExcel, parseExcelFile } from './utils/excelUtils';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [inMainApp, setInMainApp] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Network Online/Offline
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Dark Mode
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('bk_dark_mode') === 'true';
  });

  // PWA Install Prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstallPWA, setCanInstallPWA] = useState(false);

  // Modals
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Database State
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [absensiList, setAbsensiList] = useState<Absensi[]>([]);
  const [konselingList, setKonselingList] = useState<Konseling[]>([]);
  const [jurnalList, setJurnalList] = useState<JurnalHarian[]>([]);
  const [penilaianList, setPenilaianList] = useState<PenilaianHarian[]>([]);

  // PWA Register & Install Prompt Handler
  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      const registerSW = () => {
        navigator.serviceWorker.register('/sw.js').then(
          (reg) => console.log('ServiceWorker registered with scope:', reg.scope),
          (err) => console.log('ServiceWorker registration failed:', err)
        );
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
      }
    }

    // Capture beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstallPWA(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Online/Offline Listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch Database Data
  const loadAllData = useCallback(async () => {
    await initDatabase();
    const [sw, ab, ks, jr, pn] = await Promise.all([
      getAllSiswa(),
      getAllAbsensi(),
      getAllKonseling(),
      getAllJurnal(),
      getAllPenilaian()
    ]);
    setSiswaList(sw);
    setAbsensiList(ab);
    setKonselingList(ks);
    setJurnalList(jr);
    setPenilaianList(pn);
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Dark Mode Class Handler
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('bk_dark_mode', String(darkMode));
  }, [darkMode]);

  // Trigger PWA Installation
  const handleTriggerPWAInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('User response to install prompt:', outcome);
      setDeferredPrompt(null);
      setCanInstallPWA(false);
    } else {
      setIsInstallModalOpen(true);
    }
  };

  // Excel Handlers
  const handleImportExcelFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseExcelFile(file);
      if (parsed.siswa.length > 0) await saveSiswaBatch(parsed.siswa);
      if (parsed.absensi.length > 0) await saveAbsensiBatch(parsed.absensi);
      if (parsed.konseling.length > 0) {
        for (const k of parsed.konseling) await saveKonseling(k);
      }
      await loadAllData();
      alert(`Import berhasil! Diimpor ${parsed.siswa.length} data siswa dari file Excel.`);
    } catch (err) {
      alert('Gagal mengimpor file Excel. Pastikan format tabel sesuai.');
    }
  };

  const handleExportFullExcel = () => {
    exportMultiSheetDatabaseExcel({
      siswa: siswaList,
      absensi: absensiList,
      konseling: konselingList,
      jurnal: jurnalList,
      penilaian: penilaianList
    });
  };

  // Siswa Handlers
  const handleAddSiswa = async (item: Siswa) => {
    await saveSiswa(item);
    await loadAllData();
  };

  const handleUpdateSiswa = async (item: Siswa) => {
    await saveSiswa(item);
    await loadAllData();
  };

  const handleDeleteSiswa = async (id: string) => {
    await deleteSiswa(id);
    await loadAllData();
  };

  // Absensi Handlers
  const handleSaveAbsensiBatch = async (items: Absensi[]) => {
    await saveAbsensiBatch(items);
    await loadAllData();
  };

  const handleDeleteAbsensi = async (id: string) => {
    await deleteAbsensi(id);
    await loadAllData();
  };

  // Konseling Handlers
  const handleAddKonseling = async (item: Konseling) => {
    await saveKonseling(item);
    await loadAllData();
  };

  const handleUpdateKonseling = async (item: Konseling) => {
    await saveKonseling(item);
    await loadAllData();
  };

  const handleDeleteKonseling = async (id: string) => {
    await deleteKonseling(id);
    await loadAllData();
  };

  // Jurnal Handlers
  const handleAddJurnal = async (item: JurnalHarian) => {
    await saveJurnal(item);
    await loadAllData();
  };

  const handleUpdateJurnal = async (item: JurnalHarian) => {
    await saveJurnal(item);
    await loadAllData();
  };

  const handleDeleteJurnal = async (id: string) => {
    await deleteJurnal(id);
    await loadAllData();
  };

  // Penilaian Handlers
  const handleAddPenilaian = async (item: PenilaianHarian) => {
    await savePenilaian(item);
    await loadAllData();
  };

  const handleUpdatePenilaian = async (item: PenilaianHarian) => {
    await savePenilaian(item);
    await loadAllData();
  };

  const handleDeletePenilaian = async (id: string) => {
    await deletePenilaian(id);
    await loadAllData();
  };

  return (
    <div className="min-h-screen bg-[#071533] text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-900">
      {/* 1. Splash Screen (Initial 2 seconds) */}
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}

      {/* 2. Landing Page or Main Application View */}
      {!inMainApp ? (
        <LandingPage
          onEnterApp={() => setInMainApp(true)}
          onInstallClick={() => setIsInstallModalOpen(true)}
          canInstallPWA={canInstallPWA}
          isOnline={isOnline}
        />
      ) : (
        <div className="flex flex-col min-h-screen">
          {/* Header */}
          <Header
            activeTab={activeTab}
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenInstall={() => setIsInstallModalOpen(true)}
            onOpenBackupModal={() => setIsBackupModalOpen(true)}
            onGoHome={() => setInMainApp(false)}
            isOnline={isOnline}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode(!darkMode)}
            onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />

          {/* Main Body */}
          <div className="flex-1 flex max-w-7xl w-full mx-auto pb-16 md:pb-6">
            {/* Sidebar */}
            <Sidebar
              activeTab={activeTab}
              onNavigate={(tab) => setActiveTab(tab)}
              isMobileOpen={isMobileMenuOpen}
              onCloseMobile={() => setIsMobileMenuOpen(false)}
            />

            {/* Active Content View */}
            <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
              {activeTab === 'dashboard' && (
                <DashboardView
                  siswa={siswaList}
                  absensi={absensiList}
                  konseling={konselingList}
                  jurnal={jurnalList}
                  penilaian={penilaianList}
                  onNavigate={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'siswa' && (
                <DataSiswaView
                  siswaList={siswaList}
                  onAddSiswa={handleAddSiswa}
                  onUpdateSiswa={handleUpdateSiswa}
                  onDeleteSiswa={handleDeleteSiswa}
                  onImportExcel={handleImportExcelFile}
                  onExportExcel={handleExportFullExcel}
                />
              )}

              {activeTab === 'absensi' && (
                <AbsenSiswaView
                  siswaList={siswaList}
                  absensiList={absensiList}
                  onSaveAbsensiBatch={handleSaveAbsensiBatch}
                  onDeleteAbsensi={handleDeleteAbsensi}
                  onExportExcel={handleExportFullExcel}
                />
              )}

              {activeTab === 'konseling' && (
                <KonselingView
                  siswaList={siswaList}
                  konselingList={konselingList}
                  onAddKonseling={handleAddKonseling}
                  onUpdateKonseling={handleUpdateKonseling}
                  onDeleteKonseling={handleDeleteKonseling}
                />
              )}

              {activeTab === 'jurnal' && (
                <JurnalHarianView
                  jurnalList={jurnalList}
                  onAddJurnal={handleAddJurnal}
                  onUpdateJurnal={handleUpdateJurnal}
                  onDeleteJurnal={handleDeleteJurnal}
                />
              )}

              {activeTab === 'penilaian' && (
                <PenilaianHarianView
                  siswaList={siswaList}
                  penilaianList={penilaianList}
                  onAddPenilaian={handleAddPenilaian}
                  onUpdatePenilaian={handleUpdatePenilaian}
                  onDeletePenilaian={handleDeletePenilaian}
                  onExportExcel={handleExportFullExcel}
                />
              )}
            </main>
          </div>
        </div>
      )}

      {/* Global Modals */}
      <InstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onTriggerInstall={handleTriggerPWAInstall}
      />

      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onRefreshData={loadAllData}
      />
    </div>
  );
}
