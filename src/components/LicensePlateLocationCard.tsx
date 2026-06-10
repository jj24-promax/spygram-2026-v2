import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Car, MapPin, Radio, Search, CheckCircle2, AlertTriangle } from 'lucide-react';
import ShineButton from './ui/ShineButton';

interface LicensePlateLocationCardProps {
  onUnlockClick: () => void;
  userCity: string;
}

type TrackStage = 'idle' | 'searching' | 'success';

const LicensePlateLocationCard: React.FC<LicensePlateLocationCardProps> = ({ onUnlockClick, userCity }) => {
  const [plate, setPlate] = useState('');
  const [stage, setStage] = useState<TrackStage>('idle');
  const [searchLogs, setSearchLogs] = useState<string[]>([]);

  const formattedCity = userCity && userCity.toLowerCase() !== 'sua localização' ? userCity : 'São Paulo';
  const motelMapUrl = `https://maps.google.com/maps?q=Motel,${encodeURIComponent(formattedCity)}&t=k&z=16&ie=UTF8&iwloc=&output=embed`;

  const formatPlateInput = (value: string) => {
    const clean = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (clean.length > 3 && !isNaN(Number(clean[3]))) {
      return `${clean.substring(0, 3)}-${clean.substring(3, 7)}`;
    }
    return clean.substring(0, 7);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlate(formatPlateInput(e.target.value));
  };

  const handleStartTracking = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPlate = plate.replace('-', '').trim();
    if (cleanPlate.length < 7) {
      alert("Por favor, insira uma placa de veículo válida (7 caracteres).");
      return;
    }

    setStage('searching');
    setSearchLogs(["📡 Iniciando conexão com a rede de satélites GPS..."]);
  };

  useEffect(() => {
    if (stage === 'searching') {
      const logs = [
        "📡 Estabelecendo canal seguro com satélites militares LBS...",
        `🔍 Escaneando telemetria de posicionamento para a placa: [${plate}]...`,
        "🛰️ Triangulando sinal de celular através de antenas locais...",
        "🔐 Quebrando chaves de criptografia do rastreador veicular ativo...",
        `🎯 SINAL ENCONTRADO! Veículo rastreado com sucesso.`
      ];

      let step = 0;
      const interval = setInterval(() => {
        if (step < logs.length) {
          setSearchLogs(prev => [...prev, logs[step]]);
          step++;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            setStage('success');
          }, 800);
        }
      }, 1100);

      return () => clearInterval(interval);
    }
  }, [stage, plate]);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 1.2 }}
      className="mt-12 mb-12 p-6 text-center w-full mx-auto relative overflow-hidden"
    >
      <div className="relative z-10">
        <div className="flex items-center justify-center gap-4 mb-4">
          <Car className="w-10 h-10 text-blue-400 animate-pulse" />
          <h2 className="text-3xl font-extrabold text-white">
            <span className="bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 text-transparent bg-clip-text">
              RASTREAMENTO VEICULAR
            </span>
          </h2>
          <MapPin className="w-10 h-10 text-purple-400 animate-pulse" />
        </div>

        <p className="text-gray-200 mb-8 max-w-md mx-auto text-lg font-medium">
          Rastreie a localização de qualquer veículo real em tempo real diretamente do banco de dados do DETRAN.
        </p>

        {stage === 'idle' && (
          <form onSubmit={handleStartTracking} className="w-full max-w-sm mx-auto bg-black/60 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 mb-8">
            <div className="text-left space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Digitar Placa do Carro</label>
              <div className="relative flex items-center">
                <Car className="absolute left-4 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="EX: ABC1D23"
                  value={plate}
                  onChange={handleInputChange}
                  maxLength={8}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-center text-lg font-black tracking-widest text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all uppercase"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:brightness-110 active:scale-95 transition-all text-xs font-black uppercase tracking-widest text-white flex items-center justify-center gap-2"
            >
              <Search size={14} />
              Buscar Veículo Real
            </button>
          </form>
        )}

        {stage === 'searching' && (
          <div className="w-full max-w-sm mx-auto bg-black border border-blue-500/20 rounded-3xl p-6 shadow-2xl mb-8 text-left font-mono text-[11px] text-blue-400 space-y-2 min-h-[160px] flex flex-col justify-between">
            <div className="space-y-2 flex-1">
              {searchLogs.map((log, index) => (
                <div key={index} className="animate-fade-in leading-relaxed">
                  [SISTEMA] {log}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-2 pt-4 border-t border-white/5">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Buscando sinal do GPS...</span>
            </div>
          </div>
        )}

        {stage === 'success' && (
          <div className="animate-fade-in space-y-6">
            {/* ALERTA DE SUCESSO DE PLACA - FOCADO APENAS NA LOCALIZAÇÃO */}
            <div className="p-4 bg-green-500/10 border-2 border-green-500/30 rounded-2xl inline-flex flex-col items-center gap-1.5 animate-pulse w-full max-w-md text-center">
              <div className="flex items-center gap-2 text-green-500 font-black text-sm uppercase tracking-wide">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span>SINAL DE VEÍCULO CAPTURADO</span>
              </div>
              <p className="text-white text-xs font-bold leading-tight">
                O veículo com a placa <span className="text-yellow-400 font-extrabold">{plate}</span> foi localizado e encontra-se ativo nos arredores de <span className="uppercase font-extrabold text-green-400">{formattedCity}</span>.
              </p>
            </div>

            {/* MAPA */}
            <div className="relative w-full max-w-md mx-auto aspect-video bg-[#0a0a0c] rounded-[2rem] overflow-hidden border-2 border-blue-500/40 shadow-[0_0_40px_rgba(59,130,246,0.2)]">
              <div className="absolute inset-0 w-full h-full scale-[1.4] origin-center pointer-events-none">
                <iframe
                  title="Satellite Motel Tracker"
                  src={motelMapUrl}
                  className="w-full h-full border-0"
                  style={{
                    filter: 'grayscale(15%) brightness(55%) contrast(125%) hue-rotate(200deg)',
                  }}
                  loading="lazy"
                />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/80 pointer-events-none" />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="w-24 h-24 border-2 border-dashed border-red-500 rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-12 h-12 border border-red-500/50 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                  </div>
                </div>
              </div>

              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/80 px-3 py-1 rounded-full border border-blue-500/30">
                <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">SATÉLITE LATAM-403</span>
              </div>
            </div>

            <p className="text-xl text-yellow-300 font-bold">
              Não viva sob a dúvida. Saiba onde o carro está estacionado agora!
            </p>

            <ShineButton 
              onClick={onUnlockClick} 
              className="w-full bg-blue-600 focus:ring-blue-500 active:scale-95"
              shineColorClasses="bg-blue-600"
            >
              RASTREAR VEÍCULO AGORA
            </ShineButton>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LicensePlateLocationCard;