/**
 * Classificador inteligente de gênero (masculino/feminino) baseado em nomes,
 * sufixos e termos da biografia comuns em língua portuguesa (especialmente Brasil).
 */

const FEMALE_EXACT_NAMES = new Set([
  'ana', 'maria', 'julia', 'beatriz', 'leticia', 'camila', 'larissa', 'amanda', 
  'carol', 'carolina', 'gabriela', 'gabi', 'aline', 'patricia', 'bruna', 'isabela', 
  'isabelle', 'laura', 'luana', 'luiza', 'mariana', 'vitoria', 'fernanda', 'vanessa', 
  'jessica', 'renata', 'thais', 'taina', 'aline', 'alice', 'clara', 'sofia', 'rebeca', 
  'yasmin', 'helena', 'manuela', 'eduarda', 'rafaela', 'giovanna', 'sarah', 'milena', 
  'lorena', 'marina', 'bianca', 'nicole', 'debora', 'sabrina', 'paloma', 'priscila',
  'elisa', 'cecilia', 'clara', 'melissa', 'livia', 'isis', 'ester', 'olivia', 'ruth'
]);

const MALE_EXACT_NAMES = new Set([
  'joao', 'pedro', 'lucas', 'gabriel', 'matheus', 'felipe', 'bruno', 'vinicius', 
  'thiago', 'leonardo', 'gustavo', 'guilherme', 'rafael', 'rodrigo', 'daniel', 'marcos', 
  'andre', 'luiz', 'luis', 'eduardo', 'arthur', 'carlos', 'vitor', 'hugo', 'igor', 
  'diego', 'diogo', 'renan', 'caio', 'samuel', 'marcelo', 'alexandre', 'otavio', 
  'willian', 'william', 'allan', 'alan', 'douglas', 'murilo', 'henrique', 'enzo', 
  'miguel', 'davi', 'heitor', 'ricardo', 'fabio', 'fernando', 'marcio', 'roberto',
  'antonio', 'francisco', 'jose', 'paulo', 'sebastiao', 'marcos', 'cleber', 'claudio'
]);

const FEMALE_BIO_KEYWORDS = [
  'ela', 'dela', 'she', 'her', 'casada', 'noiva', 'namorada', 'mãe', 'mae', 'mulher', 
  'menina', 'garota', 'advogada', 'psicologa', 'médica', 'dentista', 'nutricionista', 
  'arquiteta', 'engenheira', 'empreendedora', 'atleta', 'modelo', 'blogueira', 'makeup'
];

const MALE_BIO_KEYWORDS = [
  'ele', 'dele', 'he', 'him', 'casado', 'noivo', 'namorado', 'pai', 'homem', 'menino', 
  'garoto', 'advogado', 'psicologo', 'médico', 'dentista', 'nutricionista', 'arquiteto', 
  'engenheiro', 'empreendedor', 'atleta', 'modelo', 'investidor', 'coach', 'personal'
];

export function classifyGender(
  fullName: string, 
  username: string, 
  biography: string = ''
): 'male' | 'female' | 'unknown' {
  const nameToAnalyze = (fullName || username || '').trim().toLowerCase();
  if (!nameToAnalyze) return 'unknown';

  // Remove acentuação para análise precisa
  const normalized = nameToAnalyze.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // Extrai o primeiro nome
  const firstName = normalized.split(/\s+/)[0];

  // 1. Verificação exata por lista de nomes populares
  if (FEMALE_EXACT_NAMES.has(firstName)) return 'female';
  if (MALE_EXACT_NAMES.has(firstName)) return 'male';

  // 2. Verificação por biografia (pronomes e termos de gênero)
  const bioLower = biography.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  let femalePoints = 0;
  let malePoints = 0;

  for (const word of FEMALE_BIO_KEYWORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(bioLower)) femalePoints++;
  }

  for (const word of MALE_BIO_KEYWORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(bioLower)) malePoints++;
  }

  if (femalePoints > malePoints) return 'female';
  if (malePoints > femalePoints) return 'male';

  // 3. Sufixos típicos da língua portuguesa para o primeiro nome
  // Nomes femininos em PT-BR quase sempre terminam em "a" (ex: Amanda, Jéssica) ou "y"/"i"
  if (firstName.endsWith('a') && firstName !== 'luca' && firstName !== 'andrea') {
    return 'female';
  }

  // Nomes masculinos em PT-BR quase sempre terminam em "o" (ex: Pedro, Rodrigo, Tiago)
  if (firstName.endsWith('o') || firstName.endsWith('r') || firstName.endsWith('l') || firstName.endsWith('s')) {
    // Exceções de sementes comuns femininas com estes sufixos
    if (firstName === 'isis' || firstName === 'ruth' || firstName === 'carol' || firstName === 'sol') {
      return 'female';
    }
    return 'male';
  }

  return 'unknown';
}