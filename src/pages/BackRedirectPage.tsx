import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Lock, Shield } from 'lucide-react';
import { ProfileData } from '../../types';
import SalesNotification from '../components/SalesNotification';
import {
  BACK_REDIRECT_CASH_PRICE,
  BACK_REDIRECT_ORIGINAL_PRICE,
  BACK_REDIRECT_INSTALLMENTS,
  formatBRL,
  getBackRedirectDiscountPercent,
  getBackRedirectInstallmentValue,
} from '../constants/backRedirectPricing';
import { trackFacebookEvent } from '../services/facebookService';
import './BackRedirectPage.css';

function hashSeed(username: string): number {
  let h = 0;
  for (let i = 0; i < username.length; i++) {
    h = (h + username.charCodeAt(i) * (i + 1)) % 997;
  }
  return h;
}

const BackRedirectPage: React.FC = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const storedDataRaw = sessionStorage.getItem('invasionData');
    if (storedDataRaw) {
      const data = JSON.parse(storedDataRaw);
      setProfileData(data.profileData);
    }
  }, []);

  const username = profileData?.username || 'usuario.instagram';
  const displayUsername = `@${username}`;

  const stats = useMemo(() => {
    const seed = hashSeed(username);
    return {
      messages: 65 + (seed % 12),
      photos: 30 + (seed % 10),
      locations: 2 + (seed % 3),
    };
  }, [username]);

  const installmentValue = getBackRedirectInstallmentValue();
  const discountPercent = getBackRedirectDiscountPercent();

  const goToCheckout = () => {
    trackFacebookEvent('ViewContent', {}, {
      value: BACK_REDIRECT_CASH_PRICE,
      currency: 'BRL',
    });
    navigate('/checkout');
  };

  const features = [
    'Acesso completo a DMs, Stories e fotos sem deixar rastros',
    'Localização em tempo real e histórico de locais visitados',
    'Acesso a todas as fotos, incluindo apagadas e íntimas',
    'Conversas e áudios apagados recuperados',
    'TOTAL ANÔNIMO — o alvo nunca vai saber que você está monitorando',
  ];

  return (
    <div className="back-redirect">
      <SalesNotification />

      <div className="back-redirect__inner">
        <header className="back-redirect__logo">
          <div className="back-redirect__logo-icon">
            {!logoFailed ? (
              <img
                src="/spygram_transparentebranco.png"
                alt=""
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <span aria-hidden>🕵️</span>
            )}
          </div>
          <span className="back-redirect__logo-text">
            <span className="back-redirect__logo-spy">SPY</span>
            <span className="back-redirect__logo-gram">GRAM</span>
          </span>
        </header>

        <section className="back-redirect__alert">
          <div className="back-redirect__alert-icon" aria-hidden>
            ⚠️
          </div>
          <h1 className="back-redirect__alert-title">
            {displayUsername.toUpperCase()} VAI RECEBER UM ALERTA DIZENDO QUE VOCÊ ESTÁ MONITORANDO!
          </h1>
          <span className="back-redirect__alert-badge">Cuidado</span>
        </section>

        <p className="back-redirect__intro">
          Na versão gratuita, o Instagram pode notificar {displayUsername} que alguém está tentando
          acessar o perfil. Assine a versão paga para continuar monitorando de forma{' '}
          <strong>100% anônima</strong>.
        </p>

        <div className="back-redirect__benefit">
          <span className="back-redirect__benefit-check">✓</span>
          <span>
            Continue monitorando e vendo todo conteúdo que quiser sem que a pessoa seja notificada.
          </span>
        </div>
        <div className="back-redirect__benefit">
          <span className="back-redirect__benefit-check">✓</span>
          <span>Veja DMs, stories, fotos apagadas, curtidas secretas e localização!</span>
        </div>

        <div className="back-redirect__ig-card">
          <p>Ver o Instagram real de {displayUsername}</p>
          <button type="button" className="back-redirect__ig-btn" onClick={goToCheckout}>
            ABRIR...
          </button>
        </div>

        <h2 className="back-redirect__section-title">Resultados da análise completa</h2>

        <div className="back-redirect__stats">
          <div className="back-redirect__stat">
            <div className="back-redirect__stat-icon">💬</div>
            <div className="back-redirect__stat-label">Mensagens Suspeitas</div>
            <div className="back-redirect__stat-value">{stats.messages}</div>
            <div className="back-redirect__stat-hint">toque para ver</div>
          </div>
          <div className="back-redirect__stat">
            <div className="back-redirect__stat-icon">📷</div>
            <div className="back-redirect__stat-label">Fotos Comprometedoras</div>
            <div className="back-redirect__stat-value">{stats.photos}</div>
            <div className="back-redirect__stat-hint">toque para ver</div>
          </div>
          <div className="back-redirect__stat">
            <div className="back-redirect__stat-icon">📍</div>
            <div className="back-redirect__stat-label">Localizações Suspeitas</div>
            <div className="back-redirect__stat-value">{stats.locations}</div>
            <div className="back-redirect__stat-hint">toque para ver</div>
          </div>
        </div>

        <section className="back-redirect__offer">
          <h2 className="back-redirect__offer-title">Oferta especial para você!</h2>
          <p className="back-redirect__offer-sub">Desconto exclusivo por tempo limitado</p>

          <p className="back-redirect__price-old">De R$ {formatBRL(BACK_REDIRECT_ORIGINAL_PRICE)}</p>
          <p className="back-redirect__price-installment">
            Até {BACK_REDIRECT_INSTALLMENTS}x de <strong>R$ {installmentValue}</strong>
          </p>
          <div className="back-redirect__price-row">
            <span className="back-redirect__off-badge">{discountPercent}% OFF</span>
          </div>
          <p className="back-redirect__price-cash">
            ou <strong>R$ {formatBRL(BACK_REDIRECT_CASH_PRICE)}</strong> à vista
          </p>

          <button type="button" className="back-redirect__cta" onClick={goToCheckout}>
            <Lock size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
            SIM, QUERO MONITORAR SEM SER DESCOBERTO!
            <span className="back-redirect__cta-sub">
              Clique aqui para ter acesso completo e anônimo
            </span>
          </button>

          <div className="back-redirect__guarantee">
            <Shield size={18} />
            <span>GARANTIA DE 30 DIAS — reembolso 100%</span>
          </div>
        </section>

        <h3 className="back-redirect__features-title">
          Se você quer ter acesso a todas essas evidências sem ser descoberto, preste atenção...
        </h3>

        {features.map((feature) => (
          <div key={feature} className="back-redirect__feature">
            <span className="back-redirect__feature-check">
              <Check size={12} strokeWidth={3} />
            </span>
            <span>{feature}</span>
          </div>
        ))}

        <div className="back-redirect__warn-box back-redirect__warn-box--yellow">
          <strong>ATENÇÃO:</strong> Na versão gratuita, o perfil pode receber um alerta informando
          que alguém está tentando acessar as conversas e fotos.
        </div>

        <div className="back-redirect__warn-box back-redirect__warn-box--red">
          <strong>LEMBRE-SE:</strong> {displayUsername} pode descobrir que você está monitorando se
          você não garantir o acesso pago agora!
        </div>

        <section className="back-redirect__final-cta">
          <h3>Última oportunidade!</h3>
          <button type="button" className="back-redirect__cta" onClick={goToCheckout}>
            GARANTIR ANONIMATO TOTAL AGORA!
          </button>
        </section>

        <footer className="back-redirect__footer-risk">
          <div aria-hidden style={{ fontSize: '2rem' }}>
            🚨
          </div>
          <h3>Risco de ser descoberto!</h3>
          <blockquote className="back-redirect__quote">
            &ldquo;Alguém está tentando acessar suas conversas e fotos do Instagram&rdquo;
          </blockquote>
          <p className="back-redirect__footer-text">
            Não deixe isso acontecer! Garanta já sua versão paga!
          </p>
        </footer>
      </div>
    </div>
  );
};

export default BackRedirectPage;
