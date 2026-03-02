import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LabelList
} from "recharts";

// --- GRÁFICO DE ROSCA: ORIGEM DOS LEADS ---
export const LeadOriginChart = ({ data }: { data: any[] }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white p-5 rounded-md border border-gray-200 shadow-sm h-full flex flex-col">
      <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider">
        Origem dos Leads
      </h3>
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="relative w-full h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-slate-800">{total}</span>
            <span className="text-[10px] text-slate-400 uppercase font-bold">Total</span>
          </div>
        </div>
        <div className="w-full space-y-2 px-2">
          {data.map((item) => (
            <div key={item.label} className="flex items-center justify-between group">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                <span className="text-[11px] font-semibold text-slate-600 uppercase">{item.label}</span>
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-xs font-bold text-slate-800">{item.value}</span>
                <span className="text-[10px] font-medium text-slate-400">
                  ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- GRÁFICO DE BARRAS DUPLAS: VOLUME DE OPERAÇÃO ---
export const ProspectingComboChart = ({ data }: { data: any[] }) => {
  const chartData = data.map(d => ({
    ...d,
    conversao: d.tentativas > 0 ? Math.round((d.respostas / d.tentativas) * 100) : 0
  }));

  return (
    <div className="bg-white p-5 rounded-md border border-gray-200 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Volume de Operação
        </h3>
        {/* LEGENDA COM QUADRADINHOS */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-[#1e40af] rounded-sm" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Tentativas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-[#60a5fa] rounded-sm" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Conversas Geradas</span>
          </div>
        </div>
      </div>
      
      <div className="w-full h-[300px] mt-auto">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              yAxisId="left"
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#94a3b8' }}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              cursor={{fill: '#f8fafc'}}
            />
            {/* BARRA AZUL ESCURA (TENTATIVAS) */}
            <Bar 
              yAxisId="left"
              dataKey="tentativas" 
              name="Tentativas" 
              fill="#1e40af" 
              radius={[4, 4, 0, 0]} 
              barSize={12}
            >
              <LabelList dataKey="tentativas" position="top" formatter={(val: number) => val > 0 ? val : ''} style={{ fontSize: 9, fontWeight: 700, fill: '#1e40af' }} />
            </Bar>
            {/* BARRA AZUL CLARA (CONVERSAS GERADAS) */}
            <Bar 
              yAxisId="left"
              dataKey="respostas" 
              name="Conversas Geradas" 
              fill="#60a5fa" 
              radius={[4, 4, 0, 0]} 
              barSize={12}
            >
              <LabelList dataKey="respostas" position="top" formatter={(val: number) => val > 0 ? val : ''} style={{ fontSize: 9, fontWeight: 700, fill: '#60a5fa' }} />
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// --- GRÁFICO ANUAL ACUMULADO ---
const CustomAnnualTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 shadow-xl rounded-md text-sm min-w-[200px]">
        <p className="font-bold text-slate-800 mb-3 border-b border-gray-100 pb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-600 text-xs font-medium uppercase">{entry.name}</span>
            </div>
            <span className="font-bold text-slate-800 text-xs">
              {entry.name === 'Faturamento'
                ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(entry.value)
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const AnnualSummaryChart = ({ data }: { data: any[] }) => {
  return (
    <div className="w-full h-[350px] mt-6">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600, textTransform: 'uppercase' }} 
          />
          <YAxis 
            yAxisId="left" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#94a3b8' }} 
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            axisLine={false} 
            tickLine={false} 
            tickFormatter={(val) => `R$${val / 1000}k`}
            tick={{ fontSize: 10, fill: '#10b981', fontWeight: 600 }} 
          />
          <Tooltip content={<CustomAnnualTooltip />} cursor={{ fill: '#f8fafc' }} />
          
          {/* FATURAMENTO AGORA É A COLUNA (BAR) */}
          <Bar yAxisId="right" dataKey="faturamento" name="Faturamento" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
          
          {/* LEADS E VENDAS AGORA SÃO LINHAS */}
          <Line yAxisId="left" type="monotone" dataKey="leads" name="Leads Gerados" stroke="#64748b" strokeWidth={3} dot={{ r: 4, fill: '#64748b', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
          <Line yAxisId="left" type="monotone" dataKey="vendas" name="Vendas" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
