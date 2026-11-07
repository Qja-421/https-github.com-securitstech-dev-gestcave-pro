import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Users, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function PlanningEquipe() {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  
  const shifts = [
    { id: 1, nom: 'Jean Dupont', role: 'Serveur', jour: 'Lundi', debut: '08:00', fin: '16:00', type: 'Matin' },
    { id: 2, nom: 'Marie Claire', role: 'Caissière', jour: 'Lundi', debut: '16:00', fin: '00:00', type: 'Soir' },
    { id: 3, nom: 'Paul Atangana', role: 'Cuisinier', jour: 'Mardi', debut: '09:00', fin: '17:00', type: 'Matin' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-text-primary tracking-tight">Planning Équipe</h2>
          <p className="text-text-secondary mt-1">Gérez les horaires et quarts de travail de votre personnel.</p>
        </div>
        
        <div className="flex gap-3">
          <button className="btn btn-ghost">
            <ChevronLeft size={18} /> Semaine Préc.
          </button>
          <button className="btn btn-ghost">
            Semaine Suiv. <ChevronRight size={18} />
          </button>
          <button className="btn btn-primary">
            <Plus size={18} /> Ajouter un Quart
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-3">
                <th className="p-4 border-b border-border w-48 font-bold text-text-secondary text-sm">Personnel</th>
                {days.map(day => (
                  <th key={day} className="p-4 border-b border-border text-center font-bold text-text-secondary text-sm">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {['Jean Dupont', 'Marie Claire', 'Paul Atangana'].map(personne => (
                <tr key={personne} className="hover:bg-surface-2 transition-colors">
                  <td className="p-4 border-r border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-light text-brand flex items-center justify-center font-bold text-xs">
                        {personne.substring(0, 2)}
                      </div>
                      <span className="font-bold text-sm text-text-primary">{personne}</span>
                    </div>
                  </td>
                  {days.map(day => {
                    const shift = shifts.find(s => s.nom === personne && s.jour === day);
                    return (
                      <td key={day} className="p-3 border-r border-border relative group">
                        {shift ? (
                          <div className={`p-2 rounded-lg border text-center cursor-pointer transition-all hover:scale-105
                            ${shift.type === 'Matin' ? 'bg-info-light border-info/20 text-info' : 'bg-warning-light border-warning/20 text-warning'}`}
                          >
                            <p className="text-xs font-bold">{shift.debut} - {shift.fin}</p>
                            <p className="text-[9px] uppercase tracking-wider opacity-80 mt-1">{shift.type}</p>
                          </div>
                        ) : (
                          <div className="h-12 w-full rounded-lg border border-dashed border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-surface-3">
                            <Plus size={14} className="text-text-muted" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
