import React, { useState } from 'react';
import { AtSign, Search, UserRound } from 'lucide-react';
import LandingHelpFaq from './LandingHelpFaq';
import './analysis-flow.css';

interface HeroSectionProps {
  username: string;
  onUsernameChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  error: string | null;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  username,
  onUsernameChange,
  onSubmit,
  isLoading,
  error,
}) => {
  const [logoFailed, setLogoFailed] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUsernameChange(e.target.value.replace(/@/g, '').trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && username.trim() && !isLoading) onSubmit();
  };

  return (
    <div className="hero-page">
      <div className="hero-page__glow hero-page__glow--left" aria-hidden />
      <div className="hero-page__glow hero-page__glow--right" aria-hidden />

      <div className="hero-page__content">
        <div className="hero-card hero-neon-surface">
          <div className="hero-card__top">
            <div className="hero-card__logo">
              <div className="hero-card__logo-icon analysis-btn-gradient">
                {!logoFailed ? (
                  <img
                    src="/spygram_transparentebranco.png"
                    alt=""
                    className="hero-card__logo-img"
                    onError={() => setLogoFailed(true)}
                  />
                ) : (
                  <UserRound className="hero-card__logo-fallback" aria-hidden />
                )}
              </div>
              <span className="hero-card__logo-text">
                <span className="hero-card__logo-spy">SPY</span>
                <span className="hero-card__logo-gram">GRAM</span>
              </span>
            </div>

            <div className="hero-card__visual" aria-hidden>
              <div className="hero-card__visual-bg" />
              <img src="/fluxo/hero-people.png" alt="" className="hero-card__people" />
            </div>

            <h1 className="hero-card__title">
              Informe o usuário do
              <br />
              <span className="hero-card__title-accent">Instagram</span>
            </h1>
          </div>

          <div className="hero-card__form-box hero-neon-border">
            <p className="hero-card__form-lead">
              Digite o @ exato da pessoa que você quer analisar
            </p>

            <div className="hero-card__badge">
              <span className="hero-card__badge-dot" />
              1 ANÁLISE GRÁTIS POR DISPOSITIVO
            </div>

            <label htmlFor="hero-username" className="hero-card__label">
              Nome de usuário
            </label>
            <div className="hero-card__input-wrap hero-neon-border hero-neon-border--input">
              <AtSign className="hero-card__input-icon" aria-hidden />
              <input
                id="hero-username"
                type="text"
                value={username}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="nomedousuario"
                disabled={isLoading}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                className="hero-card__input"
              />
            </div>

            {error && <p className="hero-card__error">{error}</p>}

            <button
              type="button"
              onClick={onSubmit}
              disabled={isLoading || !username.trim()}
              className="hero-card__cta analysis-cta-pulse hero-neon-border hero-neon-border--cta"
            >
              <Search className="hero-card__cta-icon" aria-hidden />
              {isLoading ? 'BUSCANDO PERFIL...' : 'INICIAR MONITORAMENTO'}
            </button>
          </div>
        </div>

        <LandingHelpFaq />
      </div>
    </div>
  );
};

export default HeroSection;
