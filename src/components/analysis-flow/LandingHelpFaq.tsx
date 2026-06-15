import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import './analysis-flow.css';

interface FaqEntry {
  id: string;
  question: string;
  answer: React.ReactNode;
}

const LANDING_FAQS: FaqEntry[] = [
  {
    id: 'find-at',
    question: 'Como descubro o @ certo da pessoa?',
    answer: (
      <>
        <ol className="landing-faq__list landing-faq__list--ordered">
          <li>Abra o app do Instagram no seu celular</li>
          <li>Procure o nome da pessoa ou abra um story dela</li>
          <li>
            Quando entrar no perfil, olhe pro <strong>TOPO</strong> da tela — o @ aparece bem em
            cima, em texto pequeno (geralmente acima da foto do perfil)
          </li>
          <li>
            Cuidado: o nome que aparece embaixo da foto é o nome completo da pessoa (ex: &quot;Maria
            Silva&quot;), <strong>NÃO</strong> é o @
          </li>
          <li>
            Memorize o @ certinho (ele pode ter ponto, número ou outros símbolos — ex: maria.silva87,
            mari_oficial, mariasil)
          </li>
          <li>Volte aqui e digite no campo acima exatamente como você viu</li>
        </ol>
        <p className="landing-faq__note">
          <strong>Obs:</strong> o Instagram não deixa copiar e colar o @ — você precisa digitar
          igualzinho ao que aparece no perfil.
        </p>
      </>
    ),
  },
  {
    id: 'leave-ig-browser',
    question: 'Por que é melhor sair do navegador do Instagram?',
    answer: (
      <>
        <p>
          Aqui você está vendo essa página dentro do app do Instagram. Pra confirmar o @ certo da
          pessoa, você teria que sair daqui, ir no perfil dela, voltar... e às vezes essa página
          fecha no caminho.
        </p>
        <p>
          No navegador padrão do celular (Chrome ou Safari) é mais fácil: você troca rapidinho entre
          o Instagram e essa página sem perder nada. Use o botão amarelo acima pra abrir lá.
        </p>
      </>
    ),
  },
  {
    id: 'open-external',
    question: 'Estou no Instagram, como abro em outro navegador?',
    answer: (
      <>
        <p>
          O botão amarelo &quot;Abrir em outro navegador&quot; nesta tela faz isso pra você sem
          perder o progresso.
        </p>
        <p>Se não funcionar, dá pra fazer manualmente:</p>
        <ul className="landing-faq__list">
          <li>
            <strong>Android:</strong> toque nos 3 pontinhos no topo direito da tela → &quot;Abrir no
            navegador&quot;
          </li>
          <li>
            <strong>iPhone:</strong> toque nos 3 pontinhos no topo direito da tela → &quot;Abrir no
            navegador externo&quot;
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'exact-at',
    question: 'Tenho que digitar o @ certinho mesmo?',
    answer: (
      <>
        <p>
          Sim. Qualquer letra trocada cai num perfil diferente. Por exemplo, se a pessoa que você
          quer ver é &quot;maria.silva&quot; e você digitar &quot;mariasilva&quot; sem o ponto, vai
          cair num perfil errado.
        </p>
        <p>
          Por isso, antes de clicar em Iniciar monitoramento, confere o @ direto no Instagram pra
          ter certeza.
        </p>
      </>
    ),
  },
  {
    id: 'come-back',
    question: 'Posso fechar e voltar depois?',
    answer: (
      <p>
        Sim. Abrindo o mesmo link no mesmo navegador, seu progresso volta. Se você precisar mudar de
        navegador, use o botão amarelo &quot;Abrir em outro navegador&quot; — ele preserva tudo
        (gênero do alvo, etapas que você já fez).
      </p>
    ),
  },
];

const LandingHelpFaq: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <section className="landing-faq" aria-label="Precisa de ajuda">
      <h2 className="landing-faq__heading">Precisa de ajuda? 🙋</h2>

      <div className="landing-faq__card">
        {LANDING_FAQS.map((faq) => {
          const isOpen = openId === faq.id;

          return (
            <div key={faq.id} className="landing-faq__item">
              {isOpen ? (
                <div className="landing-faq__expanded">
                  <div className="landing-faq__expanded-head">
                    <p className="landing-faq__expanded-question">{faq.question}</p>
                    <button
                      type="button"
                      className="landing-faq__close"
                      onClick={() => setOpenId(null)}
                      aria-label="Fechar resposta"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <AnimatePresence initial={false}>
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="landing-faq__answer-wrap"
                    >
                      <div className="landing-faq__answer">{faq.answer}</div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  type="button"
                  className="landing-faq__trigger"
                  onClick={() => toggle(faq.id)}
                  aria-expanded={false}
                >
                  <span>{faq.question}</span>
                  <Plus className="landing-faq__plus" aria-hidden />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="landing-faq__footer">
        <a href="#" className="landing-faq__footer-link">
          Termos de Uso
        </a>
        <span aria-hidden> • </span>
        <a href="#" className="landing-faq__footer-link">
          Política de Privacidade
        </a>
      </p>
    </section>
  );
};

export default LandingHelpFaq;
