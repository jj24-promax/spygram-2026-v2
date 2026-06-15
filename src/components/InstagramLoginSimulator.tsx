import React, { useState, useEffect, useRef } from 'react';
import { RotateCw, Facebook } from 'lucide-react';
import { ProfileData } from '../../types';

interface InstagramLoginSimulatorProps {
  profileData: ProfileData;
  onSuccess: () => void;
  /** Prévia via VSL — uma senha correta, sem erros, com tempo de entrada mais realista */
  instantAccess?: boolean;
}

type AttemptStage = 'typing' | 'attempting' | 'error' | 'success_typing' | 'success';

const INSTANT_TYPING_MS = 95;
const INSTANT_ATTEMPT_MS = 2200;
const INSTANT_SUCCESS_MS = 2800;

const generateRandomPassword = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  const length = Math.floor(Math.random() * 5) + 8;
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const correctPassword = 'biel_2805@';

const InstagramLoginSimulator: React.FC<InstagramLoginSimulatorProps> = ({
  profileData,
  onSuccess,
  instantAccess = false,
}) => {
  const [attemptCount, setAttemptCount] = useState(1);
  const [currentPassword, setCurrentPassword] = useState(
    instantAccess ? correctPassword : ''
  );
  const [displayedPassword, setDisplayedPassword] = useState('');
  const [stage, setStage] = useState<AttemptStage>('typing');

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (instantAccess) return;
    setCurrentPassword(generateRandomPassword());
  }, [instantAccess]);

  useEffect(() => {
    const runAnimationCycle = () => {
      if (stage === 'typing') {
        if (displayedPassword.length < currentPassword.length) {
          timeoutRef.current = setTimeout(() => {
            setDisplayedPassword((prev) => currentPassword.substring(0, prev.length + 1));
          }, instantAccess ? INSTANT_TYPING_MS : 80);
        } else {
          setStage('attempting');
        }
      } else if (stage === 'attempting') {
        timeoutRef.current = setTimeout(() => {
          if (instantAccess) {
            setStage('success');
            return;
          }
          if (attemptCount >= 4) {
            setDisplayedPassword('');
            setStage('success_typing');
          } else {
            setStage('error');
          }
        }, instantAccess ? INSTANT_ATTEMPT_MS : 800);
      } else if (stage === 'error') {
        timeoutRef.current = setTimeout(() => {
          setAttemptCount((prev) => prev + 1);
          setCurrentPassword(generateRandomPassword());
          setDisplayedPassword('');
          setStage('typing');
        }, 1500);
      } else if (stage === 'success_typing') {
        if (displayedPassword.length < correctPassword.length) {
          timeoutRef.current = setTimeout(() => {
            setDisplayedPassword((prev) => correctPassword.substring(0, prev.length + 1));
          }, 100);
        } else {
          setStage('success');
        }
      } else if (stage === 'success') {
        timeoutRef.current = setTimeout(
          onSuccess,
          instantAccess ? INSTANT_SUCCESS_MS : 2000
        );
      }
    };

    runAnimationCycle();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [stage, displayedPassword, currentPassword, onSuccess, attemptCount, instantAccess]);

  const getPasswordDisplay = () => {
    if (stage === 'success_typing') return displayedPassword;
    if (stage === 'typing') return displayedPassword;
    if (stage === 'success') return '•'.repeat(correctPassword.length);
    return '•'.repeat(currentPassword.length);
  };

  const showCrackingBox = stage === 'typing' || stage === 'attempting' || stage === 'error';

  return (
    <div className="w-full max-w-sm mx-auto p-6 bg-black text-white flex flex-col items-center justify-center min-h-screen font-sans">
      <div className="w-full text-center flex flex-col items-center">
        <img
          src="/instagram-logo.png"
          alt="Instagram Logo"
          className="h-16 mx-auto mb-10"
          style={{ filter: 'invert(1)' }}
        />

        <form className="w-full flex flex-col gap-2">
          <input
            type="text"
            value={profileData.username}
            readOnly
            className="w-full bg-[#1e1e1e] text-gray-300 px-3 py-2.5 rounded-md border border-gray-700 text-sm"
          />
          <div className="relative w-full">
            <input
              type="password"
              value={getPasswordDisplay()}
              readOnly
              className={`w-full px-3 py-2.5 rounded-md text-sm font-mono
                bg-[#1e1e1e] border
                ${stage === 'error' ? 'border-red-500 text-red-300' : 'border-gray-700 text-white'}
                focus:outline-none`}
            />
            {(stage === 'typing' || stage === 'success_typing') && (
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white animate-pulse">
                |
              </span>
            )}
          </div>

          {stage === 'error' && (
            <p className="text-red-500 text-xs text-center mt-2">
              A senha que você inseriu está incorreta.
            </p>
          )}

          {showCrackingBox && (
            <div className="mt-4 flex items-center gap-3 bg-[#1e1e1e] border border-gray-700 rounded-lg p-3 text-left">
              <RotateCw className="w-6 h-6 text-purple-400 animate-spin" />
              <div>
                <p className="text-sm font-semibold text-white">Quebrando criptografia da conta</p>
                <p className="text-xs text-gray-400">
                  {instantAccess
                    ? 'Validando credencial de acesso...'
                    : 'Testando combinações de senha...'}
                </p>
              </div>
            </div>
          )}

          {stage === 'success' && (
            <div className="mt-4 flex items-center gap-3 bg-green-950/40 border border-green-700/50 rounded-lg p-3 text-left">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-xs font-bold">
                ✓
              </div>
              <div>
                <p className="text-sm font-semibold text-green-300">Senha encontrada</p>
                <p className="text-xs text-gray-400">Entrando na conta...</p>
              </div>
            </div>
          )}

          <button
            type="button"
            className={`w-full mt-4 py-2 rounded-lg font-semibold text-white text-sm ${
              stage === 'success'
                ? 'bg-[#0095f6] opacity-100'
                : 'bg-[#0095f6] opacity-70 cursor-not-allowed'
            }`}
            disabled={stage !== 'success'}
          >
            Entrar
          </button>
        </form>

        <div className="mt-4 text-center">
          <a href="#" className="text-xs text-[#0095f6] no-underline">
            Esqueceu a senha?
          </a>
        </div>

        <div className="flex items-center w-full my-6">
          <div className="flex-grow border-t border-gray-700" />
          <span className="px-4 text-xs font-semibold text-gray-500">OU</span>
          <div className="flex-grow border-t border-gray-700" />
        </div>

        <button type="button" className="flex items-center justify-center gap-2 text-sm font-semibold text-[#0095f6]">
          <Facebook className="w-5 h-5" />
          <span>Entrar com o Facebook</span>
        </button>
      </div>
      <footer className="absolute bottom-4 text-center text-xs">
        <p className="text-gray-500">
          Não tem uma conta?{' '}
          <a href="#" className="font-semibold text-[#0095f6] no-underline">
            Cadastre-se.
          </a>
        </p>
      </footer>
    </div>
  );
};

export default InstagramLoginSimulator;
