/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AcademicRecord, AcademicStatus, AcademicGrade, AcademicSubject } from '../types';
import { updateAcademicRecord, deleteAcademicRecord } from '../services/recordsService';
import { X, Calendar, Edit2, Trash2, CheckCircle, Save } from 'lucide-react';
import { SUBJECTS } from '../syllabus';

interface RecordModalProps {
  record: AcademicRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

export default function RecordModal({ record, isOpen, onClose, onToast }: RecordModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit fields
  const [grado, setGrado] = useState<AcademicGrade>('6');
  const [asig, setAsig] = useState<AcademicSubject>('Español');
  const [fecha, setFecha] = useState('');
  const [periodo, setPeriodo] = useState<'1' | '2' | '3' | '4'>('1');
  const [tema, setTema] = useState('');
  const [actividades, setActividades] = useState('');
  const [tareas, setTareas] = useState('');
  const [logros, setLogros] = useState('');
  const [dificultades, setDificultades] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [estado, setEstado] = useState<AcademicStatus>('Excelente');

  useEffect(() => {
    if (record) {
      setGrado(record.grado);
      setAsig(record.asig);
      setFecha(record.fecha);
      setPeriodo(record.periodo);
      setTema(record.tema);
      setActividades(record.actividades || '');
      setTareas(record.tareas || '');
      setLogros(record.logros || '');
      setDificultades(record.dificultades || '');
      setObservaciones(record.observaciones || '');
      setEstado(record.estado);
    }
    setIsEditing(false);
  }, [record, isOpen]);

  if (!isOpen || !record) return null;

  // Format full local date
  const dateObj = new Date(record.fecha + 'T12:00:00');
  const dateFormatted = dateObj.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Handle rapid status changes (real-time toggles in view mode)
  const handleQuickStatusChange = async (newStatus: AcademicStatus) => {
    try {
      setEstado(newStatus);
      await updateAcademicRecord(record.id, { estado: newStatus });
      onToast(`Estado actualizado a "${newStatus}" en tiempo real`, 'success');
    } catch (err) {
      console.error(err);
      onToast('Error al actualizar el estado', 'error');
    }
  };

  const handleUpdate = async () => {
    if (!tema.trim()) {
      onToast('El tema es obligatorio', 'error');
      return;
    }
    setIsSaving(true);
    try {
      await updateAcademicRecord(record.id, {
        grado,
        asig,
        fecha,
        periodo,
        tema: tema.trim(),
        actividades: actividades.trim(),
        tareas: tareas.trim(),
        logros: logros.trim(),
        dificultades: dificultades.trim(),
        observaciones: observaciones.trim(),
        estado,
      });
      onToast('Cambios guardados con éxito', 'success');
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      onToast('Error al guardar cambios', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('¿Seguro que deseas eliminar este registro por completo? Esta acción es irreversible.')) {
      try {
        await deleteAcademicRecord(record.id);
        onToast('Registro eliminado con éxito', 'success');
        onClose();
      } catch (err) {
        console.error(err);
        onToast('Error al eliminar el registro', 'error');
      }
    }
  };

  const statusOptions: { value: AcademicStatus; label: string; style: string; badge: string }[] = [
    { value: 'Excelente', label: '⭐ Excelente', style: 'border-emerald-500 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20', badge: 'bg-emerald-500/15 text-emerald-400' },
    { value: 'Bueno', label: '👍 Bueno', style: 'border-blue-500 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20', badge: 'bg-blue-500/15 text-blue-400' },
    { value: 'En proceso', label: '🔄 En proceso', style: 'border-amber-500 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20', badge: 'bg-amber-500/15 text-amber-400' },
    { value: 'Requiere apoyo', label: '🆘 Requiere apoyo', style: 'border-red-500 text-red-500 bg-red-500/10 hover:bg-red-500/20', badge: 'bg-red-500/15 text-red-400' }
  ];

  const currentBadgeStyle = statusOptions.find(o => o.value === record.estado)?.badge || 'bg-slate-700 text-slate-300';

  return (
    <div 
      className="fixed inset-0 z-200 flex items-center justify-center bg-black/75 p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border border-[#2a3347] bg-[#161b22] p-6 text-[#e2e8f0] shadow-2xl transition-all scale-100 font-sans">
        
        {/* Modal Header */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-xs text-[#64748b]">IE PATIO BONITO 2026</span>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${currentBadgeStyle}`}>
                Grado {record.grado}° · {record.asig} · Período {record.periodo}
              </span>
            </div>
            {isEditing ? (
              <input
                type="text"
                className="mt-2 w-full rounded-lg border border-[#2a3347] bg-[#1c2230] p-2 text-lg font-bold text-[#e2e8f0] outline-none focus:border-[#4f8ef7]"
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                placeholder="Tema de la clase"
              />
            ) : (
              <h2 className="mt-2 text-xl font-bold leading-tight text-[#e2e8f0]">{record.tema}</h2>
            )}
            <div className="mt-1 flex items-center gap-1 text-xs text-[#94a3b8]">
              <Calendar className="h-3.5 w-3.5" />
              <span className="capitalize">{dateFormatted}</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-lg border border-[#2a3347] p-2 text-[#64748b] hover:bg-[#1c2230] hover:text-[#e2e8f0] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Real-time Status Changer Row */}
        <div className="mb-6 border-y border-[#2a3347] py-4">
          <label className="mb-2 block text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase">
            Estado de Avance (Actualizar en tiempo real)
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {statusOptions.map((opt) => {
              const isSelected = opt.value === (isEditing ? estado : record.estado);
              return (
                <button
                  key={opt.value}
                  onClick={() => isEditing ? setEstado(opt.value) : handleQuickStatusChange(opt.value)}
                  className={`flex items-center justify-center gap-1 rounded-lg border-2 py-2 text-center text-xs font-semibold cursor-pointer transition-all ${
                    isSelected 
                      ? opt.style 
                      : 'border-[#2a3347] bg-[#1c2230] text-[#64748b] hover:border-[#64748b] hover:text-[#94a3b8]'
                  }`}
                >
                  {isSelected && <span className="text-[10px]">●</span>}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Details */}
        <div className="space-y-5">
          {isEditing ? (
            /* Editing Form */
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#94a3b8]">Grado</label>
                <select
                  className="rounded-lg border border-[#2a3347] bg-[#1c2230] p-2.5 text-sm text-[#e2e8f0]"
                  value={grado}
                  onChange={(e) => {
                    const nextG = e.target.value as AcademicGrade;
                    setGrado(nextG);
                    setAsig(SUBJECTS[nextG][0]);
                  }}
                >
                  <option value="6">6°</option>
                  <option value="7">7°</option>
                  <option value="11">11°</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#94a3b8]">Asignatura</label>
                <select
                  className="rounded-lg border border-[#2a3347] bg-[#1c2230] p-2.5 text-sm text-[#e2e8f0]"
                  value={asig}
                  onChange={(e) => setAsig(e.target.value as AcademicSubject)}
                >
                  {SUBJECTS[grado].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#94a3b8]">Fecha de Clase</label>
                <input
                  type="date"
                  className="rounded-lg border border-[#2a3347] bg-[#1c2230] p-2.5 text-sm text-[#e2e8f0]"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#94a3b8]">Período</label>
                <select
                  className="rounded-lg border border-[#2a3347] bg-[#1c2230] p-2.5 text-sm text-[#e2e8f0]"
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value as any)}
                >
                  <option value="1">Período 1</option>
                  <option value="2">Período 2</option>
                  <option value="3">Período 3</option>
                  <option value="4">Período 4</option>
                </select>
              </div>

              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#94a3b8]">Actividades Realizadas</label>
                <textarea
                  className="rounded-lg border border-[#2a3347] bg-[#1c2230] p-2.5 text-sm text-[#e2e8f0] outline-none focus:border-[#4f8ef7] min-height-[72px]"
                  value={actividades}
                  onChange={(e) => setActividades(e.target.value)}
                  placeholder="Ej: Lectura de texto, mapa conceptual..."
                />
              </div>

              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#94a3b8]">Tareas / Compromisos</label>
                <textarea
                  className="rounded-lg border border-[#2a3347] bg-[#1c2230] p-2.5 text-sm text-[#e2e8f0] outline-none focus:border-[#4f8ef7] min-height-[72px]"
                  value={tareas}
                  onChange={(e) => setTareas(e.target.value)}
                  placeholder="Ej: Traer resumen..."
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#94a3b8]">Logros Observados</label>
                <textarea
                  className="rounded-lg border border-[#2a3347] bg-[#1c2230] p-2.5 text-sm text-[#e2e8f0] outline-none focus:border-[#4f8ef7]"
                  value={logros}
                  onChange={(e) => setLogros(e.target.value)}
                  placeholder="Ej: Reconocieron los conceptos..."
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#94a3b8]">Dificultades</label>
                <textarea
                  className="rounded-lg border border-[#2a3347] bg-[#1c2230] p-2.5 text-sm text-[#e2e8f0] outline-none focus:border-[#4f8ef7]"
                  value={dificultades}
                  onChange={(e) => setDificultades(e.target.value)}
                  placeholder="Ej: Confusión en los términos..."
                />
              </div>

              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#94a3b8]">Observaciones Generales</label>
                <textarea
                  className="rounded-lg border border-[#2a3347] bg-[#1c2230] p-2.5 text-sm text-[#e2e8f0] outline-none focus:border-[#4f8ef7]"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Comentarios adicionales..."
                />
              </div>
            </div>
          ) : (
            /* Standard Static View with full fields */
            <div className="space-y-4">
              {record.actividades && (
                <div>
                  <h4 className="text-[10px] font-bold tracking-wider text-[#64748b] uppercase">Actividades realizadas</h4>
                  <p className="mt-1 text-sm bg-[#1c2230] p-3 rounded-lg text-[#94a3b8] leading-relaxed whitespace-pre-wrap">{record.actividades}</p>
                </div>
              )}
              {record.tareas && (
                <div>
                  <h4 className="text-[10px] font-bold tracking-wider text-amber-400 uppercase">📌 Compromisos / Tareas</h4>
                  <p className="mt-1 text-sm bg-amber-500/5 border border-amber-500/10 p-3 rounded-lg text-amber-200 leading-relaxed whitespace-pre-wrap">{record.tareas}</p>
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {record.logros && (
                  <div>
                    <h4 className="text-[10px] font-bold tracking-wider text-[#3dd68c] uppercase">🏆 Logros observados</h4>
                    <p className="mt-1 text-sm bg-emerald-500/5 p-3 rounded-lg text-emerald-300 leading-relaxed whitespace-pre-wrap">{record.logros}</p>
                  </div>
                )}
                {record.dificultades && (
                  <div>
                    <h4 className="text-[10px] font-bold tracking-wider text-[#f74f4f] uppercase">⚠️ Dificultades</h4>
                    <p className="mt-1 text-sm bg-red-500/5 p-3 rounded-lg text-red-300 leading-relaxed whitespace-pre-wrap">{record.dificultades}</p>
                  </div>
                )}
              </div>
              {record.observaciones && (
                <div>
                  <h4 className="text-[10px] font-bold tracking-wider text-[#64748b] uppercase">Observaciones generales</h4>
                  <p className="mt-1 text-sm bg-[#1c2230] p-3 rounded-lg text-[#94a3b8] leading-relaxed whitespace-pre-wrap">{record.observaciones}</p>
                </div>
              )}
              <div className="pt-2 text-[10px] font-mono text-[#64748b] flex justify-between">
                <span>Registrado por: {record.userEmail}</span>
                <span>Actualizado: {new Date(record.updatedAt).toLocaleDateString('es-CO')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="mt-8 flex justify-between gap-3 border-t border-[#2a3347] pt-5">
          <div>
            {!isEditing && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/15 hover:text-red-300 transition-all cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>Eliminar Registro</span>
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-lg border border-[#2a3347] bg-transparent px-4 py-2.5 text-xs font-semibold text-[#94a3b8] hover:bg-[#1c2230] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 rounded-lg bg-[#4f8ef7] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#3d7de8] transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 rounded-lg border border-[#2a3347] bg-[#1c2230] px-5 py-2.5 text-xs font-semibold text-[#e2e8f0] hover:bg-[#21283a] hover:border-[#4f8ef7] transition-all cursor-pointer"
              >
                <Edit2 className="h-4 w-4" />
                <span>Editar Clase</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
