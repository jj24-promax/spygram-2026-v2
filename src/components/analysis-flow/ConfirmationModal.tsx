import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronDown, Lock } from 'lucide-react';
import type { ProfileData } from '../../../types';
import './analysis-flow.css';

interface ConfirmationModalProps {
  isOpen: boolean;
  profile: ProfileData;
  onConfirm: () => void;
  onReject: () => void;
}

const formatStat = (n: number) => n.toLocaleString('pt-BR');

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  profile,
  onConfirm,
  onReject,
}) => {
    <AnimatePresence>
      {isOpen && (
        <div className="confirm-modal__backdrop">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className="confirm-modal hero-neon-surface"
          >
            <header className="confirm-modal__header">
              <span className="confirm-modal__username">{profile.username}</span>
              <ChevronDown className="confirm-modal__chevron" aria-hidden />
            </header>

            <div className="confirm-modal__body">
              <div className="confirm-modal__profile-row">
                <div className="confirm-modal__avatar-ring">
                  <img
                    src={profile.profilePicUrl}
                    alt={profile.username}
                    className="confirm-modal__avatar"
                  />
                </div>

                <div className="confirm-modal__identity">
                  <p className="confirm-modal__name">{profile.fullName || profile.username}</p>
                  <div className="confirm-modal__stats">
                    <div className="confirm-modal__stat">
                      <span className="confirm-modal__stat-value">{formatStat(profile.postsCount)}</span>
                      <span className="confirm-modal__stat-label">posts</span>
                    </div>
                    <div className="confirm-modal__stat">
                      <span className="confirm-modal__stat-value">{formatStat(profile.followers)}</span>
                      <span className="confirm-modal__stat-label">segs</span>
                    </div>
                    <div className="confirm-modal__stat">
                      <span className="confirm-modal__stat-value">{formatStat(profile.following)}</span>
                      <span className="confirm-modal__stat-label">seg</span>
                    </div>
                  </div>
                </div>
              </div>

              {profile.biography && (
                <p className="confirm-modal__bio">{profile.biography}</p>
              )}

              {profile.isPrivate && (
                <div className="confirm-modal__private">
                  <Lock className="confirm-modal__private-icon" aria-hidden />
                  <span>Conta privada</span>
                </div>
              )}

              <div className="confirm-modal__warning">
                <AlertTriangle className="confirm-modal__warning-icon" aria-hidden />
                <p>Confirme com cuidado — esta é sua única análise gratuita.</p>
              </div>

              <p className="confirm-modal__question">Este é o perfil certo?</p>

              <div className="confirm-modal__actions">
                <button type="button" onClick={onConfirm} className="confirm-modal__confirm analysis-btn-gradient-alt">
                  SIM, CONFIRMAR
                </button>
                <button type="button" onClick={onReject} className="confirm-modal__reject">
                  Não
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;
