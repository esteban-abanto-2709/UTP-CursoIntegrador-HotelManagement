"use client";
import React from "react";

type Activity = {
  name: string;
  startWeek: number;
  endWeek: number;
};

type Phase = {
  id: string;
  name: string;
  colorClass: string;
  bgClass: string;
  activities: Activity[];
};

const phases: Phase[] = [
  {
    id: "f1",
    name: "1. Planificación",
    colorClass: "bg-blue-500",
    bgClass: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    activities: [
      { name: "Sprint 1: Requerimientos y alcance", startWeek: 1, endWeek: 2 },
      { name: "Sprint 2: Equipo y riesgos", startWeek: 3, endWeek: 4 },
    ],
  },
  {
    id: "f2",
    name: "2. Diseño",
    colorClass: "bg-purple-500",
    bgClass: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
    activities: [
      { name: "Sprint 3: Procesos y arquitectura", startWeek: 5, endWeek: 6 },
      { name: "Sprint 4: Wireframes y UI/UX", startWeek: 7, endWeek: 8 },
    ],
  },
  {
    id: "f3",
    name: "3. Desarrollo",
    colorClass: "bg-emerald-500",
    bgClass: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    activities: [
      { name: "Sprint 5: Maquetación web", startWeek: 9, endWeek: 11 },
      { name: "Sprint 6: Formularios y módulos", startWeek: 12, endWeek: 14 },
      { name: "Sprint 7: Fixture y resultados", startWeek: 15, endWeek: 15 },
    ],
  },
  {
    id: "f4",
    name: "4. QA (Pruebas)",
    colorClass: "bg-orange-500",
    bgClass: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
    activities: [
      { name: "Sprint 8: Pruebas funcionales", startWeek: 9, endWeek: 16 },
    ],
  },
  {
    id: "f5",
    name: "5. Implementación",
    colorClass: "bg-rose-500",
    bgClass: "bg-rose-500/20 text-rose-400 border border-rose-500/30",
    activities: [
      { name: "Sprint 9: Despliegue y entrega", startWeek: 17, endWeek: 17 },
    ],
  },
];

const totalWeeks = 17;
const weeksArray = Array.from({ length: totalWeeks }, (_, i) => i + 1);
const totalActivities = phases.reduce(
  (acc, phase) => acc + phase.activities.length,
  0,
);

export default function Cronograma() {
  return (
    <div className="w-full h-full flex flex-col bg-[#0f172a] rounded-2xl border border-slate-800 shadow-2xl text-slate-200 font-sans p-6 overflow-hidden">
      {/* Encabezado Principal y Leyenda */}
      <div className="shrink-0 mb-4 flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
            Cronograma de Actividades
          </h2>
          <p className="text-sm text-slate-400">
            Diagrama de Gantt - Semanas del 1 al 17
          </p>
        </div>

        {/* Leyenda de Colores (Movida arriba a la derecha) */}
        <div className="flex items-center gap-3 lg:gap-5 text-[0.7rem] lg:text-sm text-slate-400 bg-slate-800/40 px-4 py-2 rounded-xl border border-slate-800/50 shadow-sm">
          {phases.map((p) => (
            <div
              key={`legend-${p.id}`}
              className="flex items-center gap-1.5 lg:gap-2"
            >
              <div
                className={`w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full ${p.colorClass} shadow-sm`}
              ></div>
              <span className="font-medium">
                {p.name.split(". ")[1]?.trim() || p.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla Adaptativa que se acomoda al alto */}
      <div className="flex-1 min-h-0 w-full rounded-xl border border-slate-700 bg-[#0b1121] overflow-hidden flex flex-col">
        <table className="w-full h-full table-fixed text-sm border-collapse">
          <thead>
            <tr className="bg-slate-800/80 border-b border-slate-700 h-10 lg:h-12 text-slate-300">
              <th className="w-[12%] font-semibold border-r border-slate-700 px-4 text-left">
                Fase
              </th>
              <th className="w-[24%] font-semibold border-r border-slate-700 px-4 text-left">
                Sprint & Actividades
              </th>
              {weeksArray.map((w) => (
                <th
                  key={`h-w${w}`}
                  className="font-semibold border-r border-slate-700 last:border-r-0 text-center text-slate-400"
                >
                  S{w}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-[#0b1121]">
            {phases.map((phase) => {
              return phase.activities.map((activity, index) => {
                return (
                  <tr
                    key={`${phase.id}-act-${index}`}
                    style={{ height: `${100 / totalActivities}%` }}
                    className="border-b border-slate-800/60 hover:bg-slate-800/30 group"
                  >
                    {/* Renderizamos el rowSpan de la fase SI es la primera actividad de la fase */}
                    {index === 0 && (
                      <td
                        rowSpan={phase.activities.length}
                        className="border-r border-slate-800 px-4 align-middle bg-slate-900/30 text-center"
                      >
                        <div
                          className={`mx-auto max-w-max px-3 py-1.5 text-[0.75rem] lg:text-sm rounded-md font-semibold tracking-wide shadow-sm ${phase.bgClass}`}
                        >
                          {phase.name}
                        </div>
                      </td>
                    )}

                    {/* Actividad */}
                    <td className="px-4 border-r border-slate-800/60 align-middle">
                      <div className="flex items-center font-medium text-slate-300 group-hover:text-white transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-2.5 shrink-0"></div>
                        <span className="truncate leading-tight text-xs lg:text-sm">
                          {activity.name}
                        </span>
                      </div>
                    </td>

                    {/* Calendario Gantt */}
                    {weeksArray.map((w) => {
                      const isSelected =
                        w >= activity.startWeek && w <= activity.endWeek;
                      const isStart = w === activity.startWeek;
                      const isEnd = w === activity.endWeek;

                      return (
                        <td
                          key={`w${w}`}
                          className="border-r border-slate-800/40 last:border-r-0 p-0 relative align-middle bg-[#0a0f1d]/30"
                        >
                          {isSelected && (
                            <div
                              className={`absolute inset-y-1.5 lg:inset-y-2.5 z-10 ${phase.colorClass} shadow-sm group-hover:brightness-110 transition-all 
                                ${isStart ? "left-1 rounded-l-md" : "left-0"} 
                                ${isEnd ? "right-1 rounded-r-md" : "right-0"}
                                ${!isStart && !isEnd ? "left-0 right-0" : ""}
                              `}
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
