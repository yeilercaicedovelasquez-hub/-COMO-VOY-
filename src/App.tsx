/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  auth, 
  logInWithGoogle, 
  logOut 
} from './firebase';
import { 
  AcademicRecord, 
  AcademicStatus, 
  AcademicGrade, 
  AcademicSubject 
} from './types';
import { 
  subscribeToRecords, 
  createAcademicRecord, 
  updateAcademicRecord, 
  deleteAcademicRecord 
} from './services/recordsService';
import { SUBJECTS, SYLLABUS_TOPICS } from './syllabus';
import RecordModal from './components/RecordModal';
import Toast from './components/Toast';
import { 
  Home, 
  FileEdit, 
  Clipboard, 
  BarChart4, 
  BookOpen, 
  ChevronRight, 
  CheckCircle, 
  AlertTriangle, 
  Plus, 
  LogOut, 
  LogIn, 
  ShieldAlert, 
  Search, 
  TrendingUp, 
  Filter, 
  Calendar,
  Layers,
  Sparkles,
  Menu,
  X
} from 'lucide-react';

export default function App() {
  // Navigation
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'register' | 'records' | 'weekly'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auth States
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // DB States
  const [records, setRecords] = useState<AcademicRecord[]>([]);
  const [activeCourseFilter, setActiveCourseFilter] = useState<{ grade: AcademicGrade; subject: AcademicSubject } | null>(null);

  // Form States
  const [fGrado, setFGrado] = useState<AcademicGrade | ''>('');
  const [fAsig, setFAsig] = useState<AcademicSubject | ''>('');
  const [fFecha, setFFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [fPeriodo, setFPeriodo] = useState<'1' | '2' | '3' | '4'>('1');
  const [fTema, setFTema] = useState('');
  const [fActividades, setFActividades] = useState('');
  const [fTareas, setFTareas] = useState('');
  const [fLogros, setFLogros] = useState('');
  const [fDificultades, setFDificultades] = useState('');
  const [fObservaciones, setFObservaciones] = useState('');
  const [fEstado, setFEstado] = useState<AcademicStatus | ''>('');

  // Records Page Filters
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('');

  // Weekly Summary States
  const [selectedWeek, setSelectedWeek] = useState<string>(() => {
    const today = new Date();
    const date = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const day = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  });

  // Modal State
  const [selectedRecord, setSelectedRecord] = useState<AcademicRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Toast States
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastVisible, setToastVisible] = useState(false);

  // Grade accordion state UI
  const [openGrades, setOpenGrades] = useState<Record<string, boolean>>({
    'g6': true,
    'g7': true,
    'g11': true
  });

  // Handle Google Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to Records collection dynamically
  useEffect(() => {
    if (!user) {
      setRecords([]);
      return;
    }

    const unsubscribe = subscribeToRecords((updatedRecords) => {
      setRecords(updatedRecords);
    }, (error) => {
      triggerToast('Error en la base de datos: ' + error.message, 'error');
    });

    return () => unsubscribe();
  }, [user]);

  // Utility to fire a visual toast notification
  const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setToastVisible(true);
  };

  // Login handler
  const handleLogIn = async () => {
    try {
      await logInWithGoogle();
      triggerToast('Sesión iniciada con éxito', 'success');
    } catch (err) {
      triggerToast('Fallo al iniciar sesión con Google', 'error');
    }
  };

  // Logout handler
  const handleLogOut = async () => {
    try {
      await logOut();
      triggerToast('Sesión cerrada correctamente', 'success');
    } catch (err) {
      triggerToast('Error al cerrar la sesión', 'error');
    }
  };

  // Update available subject options based on form Grade selection
  const handleGradeChange = (g: AcademicGrade) => {
    setFGrado(g);
    const available = SUBJECTS[g];
    if (available && available.length > 0) {
      setFAsig(available[0]);
    } else {
      setFAsig('');
    }
  };

  // Clear registration form
  const handleClearForm = () => {
    setFGrado('');
    setFAsig('');
    setFTema('');
    setFActividades('');
    setFTareas('');
    setFLogros('');
    setFDificultades('');
    setFObservaciones('');
    setFEstado('');
    setFFecha(new Date().toISOString().split('T')[0]);
    setFPeriodo('1');
  };

  // Save new record
  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fGrado || !fAsig || !fTema.trim() || !fEstado || !fFecha) {
      triggerToast('Por favor completa todos los campos obligatorios (*)', 'error');
      return;
    }

    try {
      await createAcademicRecord({
        grado: fGrado,
        asig: fAsig,
        fecha: fFecha,
        periodo: fPeriodo,
        tema: fTema.trim(),
        actividades: fActividades.trim(),
        tareas: fTareas.trim(),
        logros: fLogros.trim(),
        dificultades: fDificultades.trim(),
        observaciones: fObservaciones.trim(),
        estado: fEstado,
      });

      triggerToast('✅ Clase registrada exitosamente');
      handleClearForm();
      setCurrentPage('dashboard');
    } catch (err: any) {
      console.error(err);
      triggerToast('Error al guardar el progreso', 'error');
    }
  };

  // Quick Action: edit status directly
  const handleQuickStatusChange = async (id: string, newStatus: AcademicStatus) => {
    try {
      await updateAcademicRecord(id, { estado: newStatus });
      triggerToast(`Estado actualizado a "${newStatus}" en tiempo real`, 'success');
    } catch (err) {
      console.error(err);
      triggerToast('Error al actualizar el estado', 'error');
    }
  };

  // Quick helper to view details inside interactive modal
  const handleViewDetails = (rec: AcademicRecord) => {
    setSelectedRecord(rec);
    setIsModalOpen(true);
  };

  // Filter click on courses list on sidebar
  const handleSidebarCourseClick = (g: AcademicGrade, s: AcademicSubject) => {
    setFilterGrade(g);
    setFilterSubject(s);
    setFilterStatus('all');
    setFilterMonth('');
    setCurrentPage('records');
    setIsMobileMenuOpen(false);
  };

  const handleClearFilters = () => {
    setFilterGrade('all');
    setFilterSubject('all');
    setFilterStatus('all');
    setFilterMonth('');
  };

  // Accordion toggle
  const toggleGradeGroup = (g: string) => {
    setOpenGrades(prev => ({ ...prev, [g]: !prev[g] }));
  };

  // Calculate statistics counts
  const totalClases = records.length;
  const uniqueTopics = new Set(records.map(r => r.tema)).size;
  const excellentOrGoodCount = records.filter(r => r.estado === 'Excelente' || r.estado === 'Bueno').length;
  const pendingTasksCount = records.filter(r => r.tareas && r.tareas.trim().length > 0).length;

  // Filter records list of the records tab
  const filteredRecords = records.filter(r => {
    if (filterGrade !== 'all' && r.grado !== filterGrade) return false;
    if (filterSubject !== 'all' && r.asig !== filterSubject) return false;
    if (filterStatus !== 'all' && r.estado !== filterStatus) return false;
    if (filterMonth && !r.fecha.startsWith(filterMonth)) return false;
    return true;
  });

  // Calculate details for course progress cards
  const getCourseDetails = (g: AcademicGrade, s: AcademicSubject) => {
    const courseRecs = records.filter(r => r.grado === g && r.asig === s);
    const total = courseRecs.length;
    const pending = courseRecs.filter(r => r.tareas && r.tareas.trim().length > 0).length;
    
    // Max period encountered
    const maxPeriod = courseRecs.length ? Math.max(...courseRecs.map(r => parseInt(r.periodo) || 1)) : 1;

    // Local syllabus progress
    const syllabusKey = `${g}-${s}`;
    let syllabusTotalCount = 0;
    const currentPeriodTopics = SYLLABUS_TOPICS[syllabusKey]?.[maxPeriod] || [];
    syllabusTotalCount = currentPeriodTopics.length;

    return { total, pending, maxPeriod, syllabusTotalCount };
  };

  // Setup local dates and titles based on the Week Picker value
  const getWeekRange = (weekStr: string) => {
    if (!weekStr) return { formatted: '', startISO: '', endISO: '' };
    const [yr, wk] = weekStr.split('-W').map(Number);
    
    // Get date of target week
    const d = new Date(yr, 0, 1 + (wk - 1) * 7);
    const dow = d.getDay();
    const ISOweekStart = d;
    if (dow <= 4) ISOweekStart.setDate(d.getDate() - d.getDay() + 1);
    else ISOweekStart.setDate(d.getDate() + 8 - d.getDay());

    const start = new Date(ISOweekStart);
    const end = new Date(start); 
    end.setDate(start.getDate() + 6);

    const fmt = (dt: Date) => dt.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
    return {
      formatted: `${fmt(start)} – ${fmt(end)}`,
      startISO: start.toISOString().split('T')[0],
      endISO: end.toISOString().split('T')[0]
    };
  };

  const weekInfo = getWeekRange(selectedWeek);

  // Sub-filter records just for the weekly page scope
  const weeklyRecords = records.filter(r => {
    if (!weekInfo.startISO) return false;
    return r.fecha >= weekInfo.startISO && r.fecha <= weekInfo.endISO;
  });

  // Weekly stats
  const weeklyStatusCounts = {
    'Excelente': weeklyRecords.filter(r => r.estado === 'Excelente').length,
    'Bueno': weeklyRecords.filter(r => r.estado === 'Bueno').length,
    'En proceso': weeklyRecords.filter(r => r.estado === 'En proceso').length,
    'Requiere apoyo': weeklyRecords.filter(r => r.estado === 'Requiere apoyo').length,
  };

  const weeklyUniqueTopics = Array.from(new Set(weeklyRecords.map(r => r.tema)));
  const weeklyPendingTasksList = weeklyRecords.filter(r => r.tareas && r.tareas.trim().length > 0);

  // Course grouped records for the weekly view
  const weeklyGroupedByCourse: Record<string, AcademicRecord[]> = {};
  weeklyRecords.forEach(r => {
    const key = `Grado ${r.grado}° - ${r.asig}`;
    if (!weeklyGroupedByCourse[key]) weeklyGroupedByCourse[key] = [];
    weeklyGroupedByCourse[key].push(r);
  });

  const getStatusPillClass = (status: AcademicStatus) => {
    switch (status) {
      case 'Excelente': return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20';
      case 'Bueno': return 'bg-blue-500/15 text-blue-400 border border-blue-500/20';
      case 'En proceso': return 'bg-amber-500/15 text-amber-400 border border-amber-500/20';
      case 'Requiere apoyo': return 'bg-red-500/15 text-red-400 border border-red-500/20';
    }
  };

  const currentFormattedWeekLabel = () => {
    const today = new Date();
    const day = today.getDay() || 7;
    const mon = new Date(today); 
    mon.setDate(today.getDate() - day + 1);
    const sun = new Date(mon); 
    sun.setDate(mon.getDate() + 6);
    const fmt = (dt: Date) => dt.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
    return `${fmt(mon)} – ${fmt(sun)}`;
  };

  if (authLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#0d1117] text-[#e2e8f0]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2a3347] border-t-[#4f8ef7]"></div>
        <p className="mt-4 text-xs font-mono text-[#64748b]">Cargando ¿Cómo Voy?...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e2e8f0] font-sans">
      
      {/* 🔐 AUTH GATING GATEWAY */}
      {!user ? (
        <div className="flex min-h-screen flex-col lg:flex-row">
          
          {/* Creative branding left column */}
          <div className="relative flex flex-1 flex-col justify-between bg-[#161b22] border-b lg:border-b-0 lg:border-r border-[#2a3347] p-8 lg:p-16 overflow-hidden">
            <div className="absolute -top-16 -left-16 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl"></div>
            <div className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-purple-500/5 blur-3xl"></div>
            
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-[#4f8ef7]">¿Cómo Voy?</span>
              <span className="text-[10px] font-mono text-[#64748b] bg-[#1c2230] px-2 py-0.5 rounded-full">PATIO BONITO</span>
            </div>

            <div className="my-10 max-w-lg z-10 transition-opacity">
              <h1 className="text-3xl font-extrabold tracking-tight text-[#e2e8f0] sm:text-4xl">
                Seguimiento Académico en Tiempo Real
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-[#94a3b8]">
                Plataforma de gestión curricular y avances de aprendizaje para la Institución Educativa Patio Bonito. Registra progresos escolares, planeaciones por períodos académicos y compromisos en tiempo real de forma segura y centralizada.
              </p>
              
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-[#2a3347] bg-[#1c2230] p-4">
                  <span className="text-lg">⚡</span>
                  <h3 className="mt-2 text-xs font-bold text-[#e2e8f0] uppercase tracking-wider">Base de datos en la nube</h3>
                  <p className="mt-1 text-xs text-[#64748b]">Cambios actualizados instantáneamente en cualquier dispositivo.</p>
                </div>
                <div className="rounded-xl border border-[#2a3347] bg-[#1c2230] p-4">
                  <span className="text-lg">🔒</span>
                  <h3 className="mt-2 text-xs font-bold text-[#e2e8f0] uppercase tracking-wider">Políticas Zero-Trust</h3>
                  <p className="mt-1 text-xs text-[#64748b]">Reglas estrictas de privacidad que resguardan cada clase registrada.</p>
                </div>
              </div>
            </div>

            <div className="text-[10px] font-mono text-[#64748b]">
              <span>Desarrollado para educadores © 2026</span>
            </div>
          </div>

          {/* Prompt Sign-In right column */}
          <div className="flex flex-1 flex-col items-center justify-center p-8 bg-[#0d1117]">
            <div className="w-full max-w-sm text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#161b22] border border-[#2a3347]">
                <Layers className="h-6 w-6 text-[#4f8ef7]" />
              </div>
              <h2 className="mt-5 text-xl font-bold tracking-tight text-[#e2e8f0]">Acceso al Portal Docente</h2>
              <p className="mt-2 text-xs text-[#94a3b8]">Regístrate o inicia sesión de manera segura con tu cuenta institucional para comenzar</p>
              
              <button
                onClick={handleLogIn}
                className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-[#4f8ef7] py-3.5 px-4 font-semibold text-sm text-white shadow-lg hover:bg-[#3d7de8] transition-all cursor-pointer active:scale-98"
              >
                <LogIn className="h-5 w-5" />
                <span>Iniciar Sesión con Google</span>
              </button>

              <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-[#64748b]">
                <ShieldAlert className="h-3.5 w-3.5 text-[#f7a24f]" />
                <span>Acceso restringido a personal docente calificado</span>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* 📱 MAIN FULL APPLICATION USER INTERFACE */
        <div className="flex min-h-screen">
          
          {/* 1. SIDEBAR (RESPONSIVE) */}
          <aside className={`fixed top-0 bottom-0 left-0 z-100 flex w-[260px] flex-col border-r border-[#2a3347] bg-[#161b22] transition-transform duration-300 lg:translate-x-0 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <div className="flex items-center justify-between border-b border-[#2a3347] p-5">
              <div>
                <div className="text-lg font-bold tracking-tight text-[#4f8ef7] flex items-center gap-2">
                  <span>¿Cómo Voy?</span>
                  <span className="text-[9px] bg-[#4f8ef7]/15 text-[#4f8ef7] px-2 py-0.5 rounded-full font-mono">2026</span>
                </div>
                <div className="text-[10px] font-mono text-[#64748b] mt-0.5">I.E. PATIO BONITO</div>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="rounded-lg p-1.5 hover:bg-[#1c2230] lg:hidden text-[#94a3b8]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] px-3 mb-2">Navegación</div>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => { setCurrentPage('dashboard'); setIsMobileMenuOpen(false); }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-semibold cursor-pointer transition-colors ${
                      currentPage === 'dashboard' ? 'bg-[#4f8ef7]/12 text-[#4f8ef7]' : 'text-[#94a3b8] hover:bg-[#1c2230] hover:text-[#e2e8f0]'
                    }`}
                  >
                    <Home className="h-4 w-4" />
                    <span>Panel General</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => { setCurrentPage('register'); setIsMobileMenuOpen(false); }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-semibold cursor-pointer transition-colors ${
                      currentPage === 'register' ? 'bg-[#4f8ef7]/12 text-[#4f8ef7]' : 'text-[#94a3b8] hover:bg-[#1c2230] hover:text-[#e2e8f0]'
                    }`}
                  >
                    <FileEdit className="h-4 w-4" />
                    <span>Registrar Clase</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => { setCurrentPage('records'); setIsMobileMenuOpen(false); }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-semibold cursor-pointer transition-colors ${
                      currentPage === 'records' ? 'bg-[#4f8ef7]/12 text-[#4f8ef7]' : 'text-[#94a3b8] hover:bg-[#1c2230] hover:text-[#e2e8f0]'
                    }`}
                  >
                    <Clipboard className="h-4 w-4" />
                    <span>Registros</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => { setCurrentPage('weekly'); setIsMobileMenuOpen(false); }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-semibold cursor-pointer transition-colors ${
                      currentPage === 'weekly' ? 'bg-[#4f8ef7]/12 text-[#4f8ef7]' : 'text-[#94a3b8] hover:bg-[#1c2230] hover:text-[#e2e8f0]'
                    }`}
                  >
                    <BarChart4 className="h-4 w-4" />
                    <span>Resumen Semanal</span>
                  </button>
                </li>
              </ul>

              {/* Course Accordions */}
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] px-3 mt-6 mb-2">Cursos asignados</div>
              
              <div className="space-y-3">
                {/* Grade 6 */}
                <div>
                  <button 
                    onClick={() => toggleGradeGroup('g6')}
                    className="flex w-full items-center justify-between px-3 py-1 font-semibold text-[11px] text-[#94a3b8] hover:text-[#e2e8f0]"
                  >
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#4f8ef7]"></span>
                      Grado 6°
                    </span>
                    <span className="text-[9px] text-[#64748b]">{openGrades.g6 ? '▲' : '▼'}</span>
                  </button>
                  {openGrades.g6 && (
                    <div className="mt-1 pl-4 space-y-0.5">
                      <button 
                        onClick={() => handleSidebarCourseClick('6', 'Español')}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-[#94a3b8] hover:bg-[#1c2230] hover:text-[#e2e8f0]"
                      >
                        <BookOpen className="h-3 w-3 text-[#4f8ef7]" />
                        <span>Español</span>
                        <span className="ml-auto bg-[#1c2230] text-[#64748b] text-[9px] px-1.5 py-0.2 rounded-full">P1</span>
                      </button>
                      <button 
                        onClick={() => handleSidebarCourseClick('6', 'Sociales')}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-[#94a3b8] hover:bg-[#1c2230] hover:text-[#e2e8f0]"
                      >
                        <BookOpen className="h-3 w-3 text-[#7c6af7]" />
                        <span>Sociales</span>
                        <span className="ml-auto bg-[#1c2230] text-[#64748b] text-[9px] px-1.5 py-0.2 rounded-full">P1</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Grade 7 */}
                <div>
                  <button 
                    onClick={() => toggleGradeGroup('g7')}
                    className="flex w-full items-center justify-between px-3 py-1 font-semibold text-[11px] text-[#94a3b8] hover:text-[#e2e8f0]"
                  >
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#7c6af7]"></span>
                      Grado 7°
                    </span>
                    <span className="text-[9px] text-[#64748b]">{openGrades.g7 ? '▲' : '▼'}</span>
                  </button>
                  {openGrades.g7 && (
                    <div className="mt-1 pl-4 space-y-0.5">
                      <button 
                        onClick={() => handleSidebarCourseClick('7', 'Español')}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-[#94a3b8] hover:bg-[#1c2230] hover:text-[#e2e8f0]"
                      >
                        <BookOpen className="h-3 w-3 text-[#4f8ef7]" />
                        <span>Español</span>
                        <span className="ml-auto bg-[#1c2230] text-[#64748b] text-[9px] px-1.5 py-0.2 rounded-full">P1</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Grade 11 */}
                <div>
                  <button 
                    onClick={() => toggleGradeGroup('g11')}
                    className="flex w-full items-center justify-between px-3 py-1 font-semibold text-[11px] text-[#94a3b8] hover:text-[#e2e8f0]"
                  >
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#f7a24f]"></span>
                      Grado 11°
                    </span>
                    <span className="text-[9px] text-[#64748b]">{openGrades.g11 ? '▲' : '▼'}</span>
                  </button>
                  {openGrades.g11 && (
                    <div className="mt-1 pl-4 space-y-0.5">
                      <button 
                        onClick={() => handleSidebarCourseClick('11', 'Filosofía')}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-[#94a3b8] hover:bg-[#1c2230] hover:text-[#e2e8f0]"
                      >
                        <BookOpen className="h-3 w-3 text-[#f7a24f]" />
                        <span>Filosofía</span>
                        <span className="ml-auto bg-[#1c2230] text-[#64748b] text-[9px] px-1.5 py-0.2 rounded-full">P1</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </nav>

            {/* User Profile / Logout Footer */}
            <div className="border-t border-[#2a3347] bg-[#0d1117]/30 p-4">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="docente" className="h-9 w-9 rounded-full border border-[#2a3347]" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1c2230] border border-[#2a3347] text-xs font-bold text-[#4f8ef7]">
                    {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 overflow-hidden">
                  <div className="truncate text-xs font-bold text-[#e2e8f0]">{user.displayName || 'Docente'}</div>
                  <div className="truncate text-[10px] text-[#64748b]">{user.email}</div>
                </div>
                <button 
                  onClick={handleLogOut}
                  title="Cerrar Sesión"
                  className="rounded-lg p-1.5 hover:bg-red-500/10 text-[#64748b] hover:text-red-400 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </aside>

          {/* 2. MAIN CONTAINER */}
          <div className="flex-1 lg:pl-[260px] flex flex-col min-h-screen">
            
            {/* Header / Top bar */}
            <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[#2a3347] bg-[#161b22] px-6 py-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsMobileMenuOpen(true)} 
                  className="rounded-lg p-2 hover:bg-[#1c2230] text-[#94a3b8] lg:hidden cursor-pointer"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-base font-bold text-[#e2e8f0]">
                    {currentPage === 'dashboard' && 'Panel General'}
                    {currentPage === 'register' && 'Registrar Clase'}
                    {currentPage === 'records' && 'Registros de Clases'}
                    {currentPage === 'weekly' && 'Resumen Semanal'}
                  </h1>
                  <p className="font-mono text-[10px] text-[#64748b] mt-0.5">
                    Semana en curso: <span className="text-[#94a3b8]">{currentFormattedWeekLabel()}</span>
                  </p>
                </div>
              </div>

              <div>
                <button
                  onClick={() => setCurrentPage('register')}
                  className="flex items-center gap-1.5 rounded-lg bg-[#4f8ef7] px-4 py-2 text-xs font-semibold text-white shadow hover:bg-[#3d7de8] transition-all cursor-pointer active:scale-98"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nueva Clase</span>
                </button>
              </div>
            </header>

            {/* Page Router content */}
            <main className="flex-grow p-6">
              
              {/* PAGE 1: DASHBOARD */}
              {currentPage === 'dashboard' && (
                <div className="space-y-8 animate-fade-in">
                  
                  {/* Grid Stat Cards */}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    
                    <div className="relative overflow-hidden rounded-xl border border-[#2a3347] bg-[#161b22] p-5">
                      <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#4f8ef7]"></div>
                      <span className="absolute top-4 right-4 text-xl opacity-35">📚</span>
                      <h4 className="text-[10px] font-bold tracking-wider text-[#64748b] uppercase">CLASES REGISTRADAS</h4>
                      <p className="mt-2 font-mono text-3xl font-extrabold text-[#e2e8f0]">{totalClases}</p>
                      <p className="mt-1 text-[10px] text-[#64748b]">Total acumulado 2026</p>
                    </div>

                    <div className="relative overflow-hidden rounded-xl border border-[#2a3347] bg-[#161b22] p-5">
                      <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#7c6af7]"></div>
                      <span className="absolute top-4 right-4 text-xl opacity-35">🎯</span>
                      <h4 className="text-[10px] font-bold tracking-wider text-[#64748b] uppercase">TEMAS DESARROLLADOS</h4>
                      <p className="mt-2 font-mono text-3xl font-extrabold text-[#e2e8f0]">{uniqueTopics}</p>
                      <p className="mt-1 text-[10px] text-[#64748b]">Únicos este año</p>
                    </div>

                    <div className="relative overflow-hidden rounded-xl border border-[#2a3347] bg-[#161b22] p-5">
                      <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500"></div>
                      <span className="absolute top-4 right-4 text-xl opacity-35">✅</span>
                      <h4 className="text-[10px] font-bold tracking-wider text-[#64748b] uppercase">ESTADO EXCELENTE/BUENO</h4>
                      <p className="mt-2 font-mono text-3xl font-extrabold text-[#e2e8f0]">{excellentOrGoodCount}</p>
                      <p className="mt-1 text-[10px] text-[#64748b]">Clases con buen avance</p>
                    </div>

                    <div className="relative overflow-hidden rounded-xl border border-[#2a3347] bg-[#161b22] p-5">
                      <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-500"></div>
                      <span className="absolute top-4 right-4 text-xl opacity-35">⏳</span>
                      <h4 className="text-[10px] font-bold tracking-wider text-[#64748b] uppercase">PENDIENTES/TAREAS</h4>
                      <p className="mt-2 font-mono text-3xl font-extrabold text-[#e2e8f0]">{pendingTasksCount}</p>
                      <p className="mt-1 text-[10px] text-[#64748b]">Con compromisos activos</p>
                    </div>

                  </div>

                  {/* Course Cards row */}
                  <div>
                    <h3 className="mb-4 text-sm font-bold text-[#e2e8f0] flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#4f8ef7]" />
                      <span>Cursos Activos (Grados y Materias)</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                      
                      {/* Español 6 */}
                      {(() => {
                        const info = getCourseDetails('6', 'Español');
                        return (
                          <div 
                            onClick={() => handleSidebarCourseClick('6', 'Español')}
                            className="group rounded-xl border border-[#2a3347] bg-[#161b22] p-5 hover:border-[#4f8ef7] hover:bg-[#1c2230] hover:-translate-y-0.5 transition-all cursor-pointer shadow-md"
                          >
                            <div className="mb-4 flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-xl">📖</div>
                              <div>
                                <h4 className="text-sm font-bold text-[#e2e8f0] group-hover:text-[#4f8ef7]">Español</h4>
                                <p className="text-[11px] font-mono text-[#64748b]">GRADO 6° · HUM</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center py-2 mb-3">
                              <div><div className="font-mono text-lg font-bold text-[#e2e8f0]">{info.total}</div><div className="text-[9px] text-[#64748b]">Clases</div></div>
                              <div><div className="font-mono text-lg font-bold text-amber-500">{info.pending}</div><div className="text-[9px] text-[#64748b]">Pendientes</div></div>
                              <div><div className="font-mono text-lg font-bold text-[#e2e8f0]">{info.maxPeriod}</div><div className="text-[9px] text-[#64748b]">Periodo</div></div>
                            </div>
                            <div className="h-1 w-full bg-[#1c2230] rounded-full overflow-hidden">
                              <div className="h-full bg-[#4f8ef7] transition-all duration-500" style={{ width: `${Math.min(info.total * 4, 100)}%` }}></div>
                            </div>
                            <div className="mt-3 flex gap-1 items-center justify-between">
                              <span className="text-[10px] text-[#64748b]">Periodos:</span>
                              <div className="flex gap-1">
                                {[1,2,3,4].map(p => {
                                  const done = records.some(r => r.grado === '6' && r.asig === 'Español' && parseInt(r.periodo) === p);
                                  const current = p === info.maxPeriod;
                                  return (
                                    <div 
                                      key={p} 
                                      className={`h-2.5 w-2.5 rounded-full ${
                                        done ? 'bg-emerald-500' : current ? 'bg-blue-500 animate-pulse' : 'bg-[#2a3347]'
                                      }`}
                                      title={`Periodo ${p}`}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Sociales 6 */}
                      {(() => {
                        const info = getCourseDetails('6', 'Sociales');
                        return (
                          <div 
                            onClick={() => handleSidebarCourseClick('6', 'Sociales')}
                            className="group rounded-xl border border-[#2a3347] bg-[#161b22] p-5 hover:border-[#7c6af7] hover:bg-[#1c2230] hover:-translate-y-0.5 transition-all cursor-pointer shadow-md"
                          >
                            <div className="mb-4 flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-xl">🌎</div>
                              <div>
                                <h4 className="text-sm font-bold text-[#e2e8f0] group-hover:text-[#7c6af7]">Ciencias Sociales</h4>
                                <p className="text-[11px] font-mono text-[#64748b]">GRADO 6° · SOC</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center py-2 mb-3">
                              <div><div className="font-mono text-lg font-bold text-[#e2e8f0]">{info.total}</div><div className="text-[9px] text-[#64748b]">Clases</div></div>
                              <div><div className="font-mono text-lg font-bold text-amber-500">{info.pending}</div><div className="text-[9px] text-[#64748b]">Pendientes</div></div>
                              <div><div className="font-mono text-lg font-bold text-[#e2e8f0]">{info.maxPeriod}</div><div className="text-[9px] text-[#64748b]">Periodo</div></div>
                            </div>
                            <div className="h-1 w-full bg-[#1c2230] rounded-full overflow-hidden">
                              <div className="h-full bg-[#7c6af7] transition-all duration-500" style={{ width: `${Math.min(info.total * 4, 100)}%` }}></div>
                            </div>
                            <div className="mt-3 flex gap-1 items-center justify-between">
                              <span className="text-[10px] text-[#64748b]">Periodos:</span>
                              <div className="flex gap-1">
                                {[1,2,3,4].map(p => {
                                  const done = records.some(r => r.grado === '6' && r.asig === 'Sociales' && parseInt(r.periodo) === p);
                                  const current = p === info.maxPeriod;
                                  return (
                                    <div 
                                      key={p} 
                                      className={`h-2.5 w-2.5 rounded-full ${
                                        done ? 'bg-emerald-500' : current ? 'bg-indigo-500 animate-pulse' : 'bg-[#2a3347]'
                                      }`}
                                      title={`Periodo ${p}`}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Español 7 */}
                      {(() => {
                        const info = getCourseDetails('7', 'Español');
                        return (
                          <div 
                            onClick={() => handleSidebarCourseClick('7', 'Español')}
                            className="group rounded-xl border border-[#2a3347] bg-[#161b22] p-5 hover:border-[#4f8ef7] hover:bg-[#1c2230] hover:-translate-y-0.5 transition-all cursor-pointer shadow-md"
                          >
                            <div className="mb-4 flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-xl">📖</div>
                              <div>
                                <h4 className="text-sm font-bold text-[#e2e8f0] group-hover:text-[#4f8ef7]">Español</h4>
                                <p className="text-[11px] font-mono text-[#64748b]">GRADO 7° · HUM</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center py-2 mb-3">
                              <div><div className="font-mono text-lg font-bold text-[#e2e8f0]">{info.total}</div><div className="text-[9px] text-[#64748b]">Clases</div></div>
                              <div><div className="font-mono text-lg font-bold text-amber-500">{info.pending}</div><div className="text-[9px] text-[#64748b]">Pendientes</div></div>
                              <div><div className="font-mono text-lg font-bold text-[#e2e8f0]">{info.maxPeriod}</div><div className="text-[9px] text-[#64748b]">Periodo</div></div>
                            </div>
                            <div className="h-1 w-full bg-[#1c2230] rounded-full overflow-hidden">
                              <div className="h-full bg-[#4f8ef7] transition-all duration-500" style={{ width: `${Math.min(info.total * 4, 100)}%` }}></div>
                            </div>
                            <div className="mt-3 flex gap-1 items-center justify-between">
                              <span className="text-[10px] text-[#64748b]">Periodos:</span>
                              <div className="flex gap-1">
                                {[1,2,3,4].map(p => {
                                  const done = records.some(r => r.grado === '7' && r.asig === 'Español' && parseInt(r.periodo) === p);
                                  const current = p === info.maxPeriod;
                                  return (
                                    <div 
                                      key={p} 
                                      className={`h-2.5 w-2.5 rounded-full ${
                                        done ? 'bg-emerald-500' : current ? 'bg-blue-500 animate-pulse' : 'bg-[#2a3347]'
                                      }`}
                                      title={`Periodo ${p}`}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Filosofía 11 */}
                      {(() => {
                        const info = getCourseDetails('11', 'Filosofía');
                        return (
                          <div 
                            onClick={() => handleSidebarCourseClick('11', 'Filosofía')}
                            className="group rounded-xl border border-[#2a3347] bg-[#161b22] p-5 hover:border-[#f7a24f] hover:bg-[#1c2230] hover:-translate-y-0.5 transition-all cursor-pointer shadow-md"
                          >
                            <div className="mb-4 flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-xl">🧠</div>
                              <div>
                                <h4 className="text-sm font-bold text-[#e2e8f0] group-hover:text-[#f7a24f]">Filosofía</h4>
                                <p className="text-[11px] font-mono text-[#64748b]">GRADO 11° · HUM</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center py-2 mb-3">
                              <div><div className="font-mono text-lg font-bold text-[#e2e8f0]">{info.total}</div><div className="text-[9px] text-[#64748b]">Clases</div></div>
                              <div><div className="font-mono text-lg font-bold text-amber-500">{info.pending}</div><div className="text-[9px] text-[#64748b]">Pendientes</div></div>
                              <div><div className="font-mono text-lg font-bold text-[#e2e8f0]">{info.maxPeriod}</div><div className="text-[9px] text-[#64748b]">Periodo</div></div>
                            </div>
                            <div className="h-1 w-full bg-[#1c2230] rounded-full overflow-hidden">
                              <div className="h-full bg-[#f7a24f] transition-all duration-500" style={{ width: `${Math.min(info.total * 4, 100)}%` }}></div>
                            </div>
                            <div className="mt-3 flex gap-1 items-center justify-between">
                              <span className="text-[10px] text-[#64748b]">Periodos:</span>
                              <div className="flex gap-1">
                                {[1,2,3,4].map(p => {
                                  const done = records.some(r => r.grado === '11' && r.asig === 'Filosofía' && parseInt(r.periodo) === p);
                                  const current = p === info.maxPeriod;
                                  return (
                                    <div 
                                      key={p} 
                                      className={`h-2.5 w-2.5 rounded-full ${
                                        done ? 'bg-emerald-500' : current ? 'bg-amber-500 animate-pulse' : 'bg-[#2a3347]'
                                      }`}
                                      title={`Periodo ${p}`}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                    </div>
                  </div>

                  {/* Recent classes registration activity-list */}
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#e2e8f0]">Últimas Clases Registradas</h3>
                      <button 
                        onClick={() => setCurrentPage('records')} 
                        className="rounded-lg bg-[#1c2230] px-3.5 py-1.5 text-xs font-semibold text-[#4f8ef7] hover:bg-[#21283a] transition-all cursor-pointer"
                      >
                        Ver todos los registros
                      </button>
                    </div>

                    {records.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-[#2a3347] p-10 text-center text-[#64748b]">
                        <div className="text-4xl mb-3">📝</div>
                        <p className="text-sm">Aún no hay clases registradas en el sistema para esta escuela.</p>
                        <button 
                          onClick={() => setCurrentPage('register')} 
                          className="mt-4 rounded-lg bg-[#4f8ef7] px-4 py-2 text-xs font-semibold text-white hover:bg-[#3d7de8] transition-all cursor-pointer"
                        >
                          Registrar Primera Clase
                        </button>
                      </div>
                    ) : (
                      <div className="grid gap-4.5">
                        {records.slice(0, 5).map((r) => {
                          const dateObj = new Date(r.fecha + 'T12:00:00');
                          const dateStr = dateObj.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
                          return (
                            <div 
                              key={r.id} 
                              onClick={() => handleViewDetails(r)}
                              className="group flex flex-col sm:flex-row justify-between items-start sm:items-center rounded-xl border border-[#2a3347] bg-[#161b22] px-5 py-4.5 hover:border-[#4f8ef7] transition-all cursor-pointer relative"
                            >
                              <div className="flex-1 pr-4">
                                <div className="flex gap-2 items-center text-[10px] mb-2 font-semibold">
                                  <span className={`px-2 py-0.5 rounded-full ${
                                    r.asig === 'Español' ? 'bg-blue-500/10 text-blue-400' : r.asig === 'Sociales' ? 'bg-purple-500/10 text-purple-400' : 'bg-amber-500/10 text-amber-400'
                                  }`}>
                                    {r.asig}
                                  </span>
                                  <span className="text-[#64748b]">Grado {r.grado}° · P{r.periodo}</span>
                                  <span className="text-[#64748b] ml-auto sm:ml-0">{dateStr}</span>
                                </div>
                                <h4 className="text-sm font-semibold text-[#e2e8f0] group-hover:text-[#4f8ef7] leading-snug">{r.tema}</h4>
                                {r.actividades && (
                                  <p className="text-xs text-[#94a3b8] mt-1.5 line-clamp-1">{r.actividades}</p>
                                )}
                                
                                <div className="flex gap-2 mt-3 text-[10px] flex-wrap">
                                  {r.tareas && r.tareas.trim() && <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/10">📌 Compromisos pendientes</span>}
                                  {r.logros && r.logros.trim() && <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/10">🏆 Logros</span>}
                                  {r.dificultades && r.dificultades.trim() && <span className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/10">⚠️ Dificultades</span>}
                                </div>
                              </div>

                              <div className="mt-4 sm:mt-0 flex flex-col items-end gap-1.5 self-stretch sm:self-auto border-t sm:border-y-0 border-[#2a3347]/50 pt-3 sm:pt-0">
                                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getStatusPillClass(r.estado)}`}>
                                  {r.estado}
                                </span>
                                <div className="flex gap-1">
                                  {/* Fast status trigger selectors in line */}
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleQuickStatusChange(r.id, 'Excelente'); }}
                                    title="Marcar Excelente"
                                    className="h-5 w-5 hover:bg-[#1c2230] rounded flex items-center justify-center text-[10px] cursor-pointer"
                                  >
                                    ⭐
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleQuickStatusChange(r.id, 'Bueno'); }}
                                    title="Marcar Bueno"
                                    className="h-5 w-5 hover:bg-[#1c2230] rounded flex items-center justify-center text-[10px] cursor-pointer"
                                  >
                                    👍
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleQuickStatusChange(r.id, 'En proceso'); }}
                                    title="Marcar En proceso"
                                    className="h-5 w-5 hover:bg-[#1c2230] rounded flex items-center justify-center text-[10px] cursor-pointer"
                                  >
                                    🔄
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* PAGE 2: REGISTER */}
              {currentPage === 'register' && (
                <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
                  <div>
                    <h2 className="text-xl font-bold text-[#e2e8f0]">Registrar nueva clase</h2>
                    <p className="text-xs text-[#94a3b8] mt-1">Sincronización instantánea con el expediente de la institución en tiempo real.</p>
                  </div>

                  <form onSubmit={handleSaveRecord} className="rounded-xl border border-[#2a3347] bg-[#161b22] p-6 space-y-6">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                      
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wide">Grado *</label>
                        <select
                          required
                          className="rounded-lg border border-[#2a3347] bg-[#1c2230] p-2.5 text-sm text-[#e2e8f0] focus:border-[#4f8ef7] outline-none"
                          value={fGrado}
                          onChange={(e) => handleGradeChange(e.target.value as AcademicGrade)}
                        >
                          <option value="">Seleccionar grado</option>
                          <option value="6">Grado 6°</option>
                          <option value="7">Grado 7°</option>
                          <option value="11">Grado 11°</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wide">Asignatura *</label>
                        <select
                          required
                          className="rounded-lg border border-[#2a3347] bg-[#1c2230] p-2.5 text-sm text-[#e2e8f0] focus:border-[#4f8ef7] outline-none"
                          value={fAsig}
                          onChange={(e) => setFAsig(e.target.value as AcademicSubject)}
                          disabled={!fGrado}
                        >
                          <option value="">Selecciona grado primero...</option>
                          {fGrado && SUBJECTS[fGrado].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wide">Fecha de Clase *</label>
                        <input
                          required
                          type="date"
                          className="rounded-lg border border-[#2a3347] bg-[#1c2230] p-2.5 text-sm text-[#e2e8f0] focus:border-[#4f8ef7] outline-none"
                          value={fFecha}
                          onChange={(e) => setFFecha(e.target.value)}
                        />
                      </div>

                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wide">Período de Clase</label>
                        <select
                          className="rounded-lg border border-[#2a3347] bg-[#1c2230] p-2.5 text-sm text-[#e2e8f0] focus:border-[#4f8ef7] outline-none"
                          value={fPeriodo}
                          onChange={(e) => setFPeriodo(e.target.value as any)}
                        >
                          <option value="1">Período 1</option>
                          <option value="2">Período 2</option>
                          <option value="3">Período 3</option>
                          <option value="4">Período 4</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2 flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wide">Tema Trabajado *</label>
                        <input
                          required
                          type="text"
                          list="topics-autocomplete"
                          className="rounded-lg border border-[#2a3347] bg-[#1c2230] p-2.5 text-sm text-[#e2e8f0] focus:border-[#4f8ef7] placeholder-[#64748b] outline-none"
                          value={fTema}
                          onChange={(e) => setFTema(e.target.value)}
                          placeholder="Escribe o selecciona de la malla curricular"
                        />
                        <datalist id="topics-autocomplete">
                          {fGrado && fAsig && SYLLABUS_TOPICS[`${fGrado}-${fAsig}`]?.[Number(fPeriodo)]?.map(t => (
                            <option key={t} value={t} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wide">Actividades Realizadas</label>
                        <textarea
                          rows={3}
                          className="rounded-lg border border-[#2a3347] bg-[#1c2230] p-3 text-sm text-[#e2e8f0] focus:border-[#4f8ef7] placeholder-[#64748b] outline-none leading-relaxed"
                          value={fActividades}
                          onChange={(e) => setFActividades(e.target.value)}
                          placeholder="Ej: Lectura dirigida, debate sobre la estructura del lenguaje..."
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wide">Tareas / Compromisos</label>
                        <textarea
                          rows={3}
                          className="rounded-lg border border-[#2a3347] bg-[#1c2230] p-3 text-sm text-[#e2e8f0] focus:border-[#4f8ef7] placeholder-[#64748b] outline-none leading-relaxed"
                          value={fTareas}
                          onChange={(e) => setFTareas(e.target.value)}
                          placeholder="Ej: Resolver cuestionario de la página 34 para entregar..."
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wide">Logros Observados</label>
                        <textarea
                          rows={3.5}
                          className="rounded-lg border border-[#2a3347] bg-[#1c2230] p-3 text-sm text-[#e2e8f0] focus:border-[#4f8ef7] placeholder-[#64748b] outline-none leading-relaxed"
                          value={fLogros}
                          onChange={(e) => setFLogros(e.target.value)}
                          placeholder="Clara asimilación de la teoría narradora y los personajes..."
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wide">Dificultades</label>
                        <textarea
                          rows={3.5}
                          className="rounded-lg border border-[#2a3347] bg-[#1c2230] p-3 text-sm text-[#e2e8f0] focus:border-[#4f8ef7] placeholder-[#64748b] outline-none leading-relaxed"
                          value={fDificultades}
                          onChange={(e) => setFDificultades(e.target.value)}
                          placeholder="A algunos alumnos se les dificultó diferenciar entre mito y leyenda..."
                        />
                      </div>

                      <div className="sm:col-span-2 flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wide">Observaciones Generales</label>
                        <textarea
                          rows={2}
                          className="rounded-lg border border-[#2a3347] bg-[#1c2230] p-3 text-sm text-[#e2e8f0] focus:border-[#4f8ef7] placeholder-[#64748b] outline-none leading-relaxed"
                          value={fObservaciones}
                          onChange={(e) => setFObservaciones(e.target.value)}
                          placeholder="Detalles complementarios del clima escolar (asistencia, atención)..."
                        />
                      </div>
                    </div>

                    <div className="border-t border-[#2a3347] pt-5">
                      <label className="mb-2 block text-xs font-bold tracking-wide text-[#94a3b8] uppercase">Estado de Avance *</label>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {[
                          { val: 'Excelente', lbl: '⭐ Excelente', style: 'border-emerald-500 text-emerald-400 bg-emerald-500/10' },
                          { val: 'Bueno', lbl: '👍 Bueno', style: 'border-blue-500 text-blue-400 bg-blue-500/10' },
                          { val: 'En proceso', lbl: '🔄 En proceso', style: 'border-amber-500 text-amber-400 bg-amber-500/10' },
                          { val: 'Requiere apoyo', lbl: '🆘 Requiere apoyo', style: 'border-red-500 text-red-500 bg-red-500/10' },
                        ].map((item) => {
                          const isSelected = fEstado === item.val;
                          return (
                            <button
                              type="button"
                              key={item.val}
                              onClick={() => setFEstado(item.val as AcademicStatus)}
                              className={`rounded-lg border py-2.5 text-[11px] font-bold text-center transition-all cursor-pointer ${
                                isSelected 
                                  ? item.style 
                                  : 'border-[#2a3347] bg-[#1c2230] text-[#64748b] hover:bg-[#21283a] hover:text-[#94a3b8]'
                              }`}
                            >
                              {item.lbl}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-[#2a3347] pt-5">
                      <button
                        type="button"
                        onClick={handleClearForm}
                        className="rounded-lg border border-[#2a3347] bg-transparent px-5 py-2.5 text-xs font-semibold text-[#94a3b8] hover:bg-[#1c2230] hover:text-[#e2e8f0] transition-colors cursor-pointer"
                      >
                        Limpiar Campos
                      </button>
                      <button
                        type="submit"
                        className="rounded-lg bg-[#4f8ef7] px-6 py-2.5 text-xs font-semibold text-white shadow hover:bg-[#3d7de8] transition-all cursor-pointer active:scale-98"
                      >
                        💾 Guardar Registro
                      </button>
                    </div>

                  </form>
                </div>
              )}

              {/* PAGE 3: RECORDS */}
              {currentPage === 'records' && (
                <div className="space-y-6 animate-fade-in">
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-[#e2e8f0]">Registros de Clases</h2>
                      <p className="text-xs text-[#94a3b8] mt-1">Expediente curricular y bitácoras activas de la institución.</p>
                    </div>
                    <button
                      onClick={() => setCurrentPage('register')}
                      className="rounded-lg bg-[#4f8ef7] px-4 py-2 text-xs font-semibold text-white shadow hover:bg-[#3d7de8] transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Registrar Clase</span>
                    </button>
                  </div>

                  {/* Filters Bar */}
                  <div className="flex flex-col gap-4 rounded-xl border border-[#2a3347] bg-[#161b22] p-5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#94a3b8]">
                      <Filter className="h-3.5 w-3.5 text-[#4f8ef7]" />
                      <span>FILTRAR RESULTADOS:</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
                      
                      <select
                        className="rounded-lg border border-[#2a3347] bg-[#1c2230] p-2 text-xs text-[#e2e8f0] cursor-pointer outline-none focus:border-[#4f8ef7]"
                        value={filterGrade}
                        onChange={(e) => setFilterGrade(e.target.value)}
                      >
                        <option value="all">Todos los Grados</option>
                        <option value="6">Grado 6°</option>
                        <option value="7">Grado 7°</option>
                        <option value="11">Grado 11°</option>
                      </select>

                      <select
                        className="rounded-lg border border-[#2a3347] bg-[#1c2230] p-2 text-xs text-[#e2e8f0] cursor-pointer outline-none focus:border-[#4f8ef7]"
                        value={filterSubject}
                        onChange={(e) => setFilterSubject(e.target.value)}
                      >
                        <option value="all">Todas las Asignaturas</option>
                        <option value="Español">Español</option>
                        <option value="Sociales">Sociales</option>
                        <option value="Filosofía">Filosofía</option>
                      </select>

                      <select
                        className="rounded-lg border border-[#2a3347] bg-[#1c2230] p-2 text-xs text-[#e2e8f0] cursor-pointer outline-none focus:border-[#4f8ef7]"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                      >
                        <option value="all">Todos los Estados</option>
                        <option value="Excelente">Excelente</option>
                        <option value="Bueno">Bueno</option>
                        <option value="En proceso">En proceso</option>
                        <option value="Requiere apoyo">Requiere apoyo</option>
                      </select>

                      <input
                        type="month"
                        className="rounded-lg border border-[#2a3347] bg-[#1c2230] p-2 text-xs text-[#e2e8f0] cursor-pointer outline-none focus:border-[#4f8ef7]"
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        placeholder="Filtrar por Mes"
                      />

                      <button
                        onClick={handleClearFilters}
                        className="col-span-2 sm:col-span-1 border border-dashed border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 rounded-lg p-2 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        ✕ Limpiar filtros
                      </button>

                    </div>
                  </div>

                  {/* Records Table view */}
                  {filteredRecords.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#2a3347] bg-[#161b22] px-6 py-12 text-center text-[#64748b]">
                      <Search className="mx-auto h-8 w-8 opacity-40 mb-3 text-[#64748b]" />
                      <p className="text-sm">No pudimos encontrar clases registradas con esos filtros.</p>
                      <button onClick={handleClearFilters} className="mt-3 text-[#4f8ef7] text-xs font-bold hover:underline cursor-pointer">Restablecer filtros</button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-[#2a3347] bg-[#161b22]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#1c2230]/75 border-b border-[#2a3347] text-[#64748b] uppercase tracking-wider text-[10px] font-bold">
                            <th className="p-4">Fecha</th>
                            <th className="p-4">Grado</th>
                            <th className="p-4">Asignatura</th>
                            <th className="p-4 text-center">Per.</th>
                            <th className="p-4">Tema Tratado</th>
                            <th className="p-4">Estado</th>
                            <th className="p-4 text-center">Tareas</th>
                            <th className="p-4">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2a3347]/50 text-[#94a3b8]">
                          {filteredRecords.map((r) => {
                            const dateObj = new Date(r.fecha + 'T12:00:00');
                            const dateFormattedStr = dateObj.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
                            return (
                              <tr key={r.id} className="hover:bg-slate-800/10 group transition-colors">
                                <td className="p-4 font-mono font-medium text-[#e2e8f0]">{dateFormattedStr}</td>
                                <td className="p-4 text-xs font-semibold">{r.grado}°</td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                    r.asig === 'Español' ? 'bg-blue-500/10 text-blue-400' : r.asig === 'Sociales' ? 'bg-purple-500/10 text-purple-400' : 'bg-amber-500/10 text-amber-400'
                                  }`}>
                                    {r.asig}
                                  </span>
                                </td>
                                <td className="p-4 text-center font-mono text-[#64748b]">{r.periodo}</td>
                                <td className="p-4 font-semibold text-[#e2e8f0] max-w-[200px] truncate">{r.tema}</td>
                                <td className="p-4">
                                  <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold ${getStatusPillClass(r.estado)}`}>
                                    {r.estado}
                                  </span>
                                </td>
                                <td className="p-4 text-center">
                                  {r.tareas && r.tareas.trim() ? (
                                    <span className="text-amber-500 font-bold" title={r.tareas}>📌</span>
                                  ) : (
                                    <span className="text-[#64748b]">-</span>
                                  )}
                                </td>
                                <td className="p-4">
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => handleViewDetails(r)}
                                      className="rounded bg-[#1c2230] border border-[#2a3347] px-2.5 py-1 text-[10px] font-semibold text-[#e2e8f0] hover:border-[#4f8ef7] hover:bg-[#21283a] transition-all cursor-pointer"
                                    >
                                      👁 Ver / Editar
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
              )}

              {/* PAGE 4: WEEKLY */}
              {currentPage === 'weekly' && (
                <div className="space-y-6 animate-fade-in">
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-[#e2e8f0]">Resumen Semanal</h2>
                      <p className="text-xs text-[#94a3b8] mt-1">Inspección de reportes unificados de avance por semanas lectivas.</p>
                    </div>
                    
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-semibold text-[#64748b]">Cambiar Semana:</span>
                      <input
                        type="week"
                        className="rounded-lg border border-[#2a3347] bg-[#1c2230] px-3 py-2 text-xs text-[#e2e8f0] cursor-pointer outline-none focus:border-[#4f8ef7]"
                        value={selectedWeek}
                        onChange={(e) => setSelectedWeek(e.target.value)}
                      />
                    </div>
                  </div>

                  {weeklyRecords.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#2a3347] bg-[#161b22] px-6 py-16 text-center text-[#64748b]">
                      <Calendar className="mx-auto h-12 w-12 text-[#64748b] opacity-40 mb-3" />
                      <p className="text-sm">No se reportan clases ni bitácoras guardadas para esta semana lectiva:</p>
                      <p className="font-mono text-xs text-[#4f8ef7] mt-1.5">{weekInfo?.formatted}</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      
                      <div className="rounded-xl border border-[#2a3347] bg-[#161b22] p-5">
                        <span className="text-xs font-semibold tracking-wider text-[#64748b] uppercase">Reporte General de Avance</span>
                        <div className="text-sm text-amber-400 mt-0.5">
                          📅 Semana : <strong className="text-[#e2e8f0]">{weekInfo?.formatted}</strong>
                        </div>
                      </div>

                      {/* 2 Grid cards */}
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        
                        {/* Weekly classes progress counts */}
                        <div className="rounded-xl border border-[#2a3347] bg-[#161b22] p-5 space-y-4">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">Estadísticas de la semana</h3>
                          
                          <div className="space-y-2.5 divide-y divide-[#2a3347]/40">
                            
                            <div className="flex justify-between items-center py-2">
                              <span className="text-xs text-[#94a3b8]">Total clases impartidas</span>
                              <span className="font-mono text-sm font-bold text-[#e2e8f0]">{weeklyRecords.length}</span>
                            </div>

                            <div className="flex justify-between items-center py-2">
                              <span className="text-xs text-emerald-400">Excelente ⭐</span>
                              <span className="font-mono text-sm font-bold text-emerald-400">{weeklyStatusCounts.Excelente}</span>
                            </div>

                            <div className="flex justify-between items-center py-2">
                              <span className="text-xs text-blue-400">Bueno 👍</span>
                              <span className="font-mono text-sm font-bold text-blue-400">{weeklyStatusCounts.Bueno}</span>
                            </div>

                            <div className="flex justify-between items-center py-2">
                              <span className="text-xs text-amber-400">En proceso 🔄</span>
                              <span className="font-mono text-sm font-bold text-amber-400">{weeklyStatusCounts['En proceso']}</span>
                            </div>

                            <div className="flex justify-between items-center py-2">
                              <span className="text-xs text-red-400">Requiere apoyo 🆘</span>
                              <span className="font-mono text-sm font-bold text-red-500">{weeklyStatusCounts['Requiere apoyo']}</span>
                            </div>

                            <div className="flex justify-between items-center py-2">
                              <span className="text-xs text-[#94a3b8]">Compromisos activos</span>
                              <span className="font-mono text-sm font-bold text-[#e2e8f0]">{weeklyPendingTasksList.length}</span>
                            </div>

                          </div>
                        </div>

                        {/* Weekly Topics covered */}
                        <div className="rounded-xl border border-[#2a3347] bg-[#161b22] p-5 space-y-4 flex flex-col">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">Temas desarrollados</h3>
                          <div className="flex flex-wrap gap-2 overflow-y-auto">
                            {weeklyUniqueTopics.map((topic, i) => (
                              <span 
                                key={i} 
                                className="rounded-lg border border-[#2a3347] bg-[#1c2230] px-3 py-1.5 text-xs text-[#e2e8f0] leading-snug"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>

                      </div>

                      {/* Course specific breakdown of the week */}
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {Object.entries(weeklyGroupedByCourse).map(([courseName, recs]) => (
                          <div key={courseName} className="rounded-xl border border-[#2a3347] bg-[#161b22] p-5 space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#e2e8f0] border-b border-[#2a3347] pb-2">
                              🏫 {courseName}
                            </h3>
                            <div className="space-y-3">
                              {recs.map((r) => {
                                const dayFormatted = new Date(r.fecha + 'T12:00:00')
                                  .toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' });
                                return (
                                  <div 
                                    key={r.id} 
                                    onClick={() => handleViewDetails(r)}
                                    className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-800/10 cursor-pointer text-xs"
                                  >
                                    <span className="text-[#94a3b8] font-medium capitalize flex-1 max-w-[220px] truncate">
                                      <span className="font-mono text-[#64748b] pr-2 text-[10px]">{dayFormatted}:</span>
                                      {r.tema}
                                    </span>
                                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${getStatusPillClass(r.estado)}`}>
                                      {r.estado}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Compromisos pendientes breakdown if exists */}
                      {weeklyPendingTasksList.length > 0 && (
                        <div className="rounded-xl border border-[#2a3347] bg-[#161b22] p-5 space-y-4">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">📌 Compromisos pendientes de la semana</h3>
                          <div className="divide-y divide-[#2a3347]/30">
                            {weeklyPendingTasksList.map((r) => (
                              <div key={r.id} onClick={() => handleViewDetails(r)} className="py-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 cursor-pointer hover:bg-slate-800/5 rounded-lg px-2 text-xs">
                                <div>
                                  <span className="font-semibold text-amber-200">Grado {r.grado}° {r.asig}</span>
                                  <p className="text-[#94a3b8] mt-1">Tema: {r.tema}</p>
                                </div>
                                <div className="text-amber-500/80 bg-amber-500/5 px-3 py-2 border border-amber-500/10 rounded-lg max-w-md line-clamp-2 md:text-right">
                                  {r.tareas}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                </div>
              )}

            </main>

          </div>

          {/* 3. MODAL INTERACTIVO DETALLES & EDICIÓN */}
          <RecordModal
            record={selectedRecord}
            isOpen={isModalOpen}
            onClose={() => { setIsModalOpen(false); setSelectedRecord(null); }}
            onToast={triggerToast}
          />

          {/* 4. NOTIFICACIONES FLOTANTES (TOAST) */}
          <Toast
            message={toastMessage}
            type={toastType}
            visible={toastVisible}
            onClose={() => setToastVisible(false)}
          />

        </div>
      )}

    </div>
  );
}
