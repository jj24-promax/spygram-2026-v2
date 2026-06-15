/**
 * Classificador inteligente de gênero (masculino/feminino) baseado em nomes,
 * sufixos e termos da biografia comuns em língua portuguesa (especialmente Brasil).
 */

import { FEMALE_NAME_SET, MALE_NAME_SET } from '../../brazilianNames';

type AppGender = 'male' | 'female' | 'unknown';

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

function normalizeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function extractFirstName(fullName: string, username: string): string {
  const normalizedName = normalizeName(fullName);
  if (normalizedName) {
    const fromFullName = normalizedName.split(/\s+/)[0]?.replace(/[^a-z]/g, '');
    if (fromFullName && fromFullName.length >= 2) return fromFullName;
  }

  const normalizedUser = normalizeName(username);
  if (!normalizedUser) return '';

  const stem = normalizedUser.split(/[._@/]+/).find((part) => part.length >= 2);
  return stem?.replace(/[^a-z]/g, '') || '';
}

export function classifyGender(
  fullName: string, 
  username: string, 
  biography: string = ''
): 'male' | 'female' | 'unknown' {
  const firstName = extractFirstName(fullName, username);
  if (!firstName) return 'unknown';

  const normalized = firstName;

  // 1. Verificação exata por lista de nomes populares
  if (FEMALE_NAME_SET.has(firstName)) return 'female';
  if (MALE_NAME_SET.has(firstName)) return 'male';

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

/** Gênero do alvo buscado — recalcula pelo @ quando a sessão antiga não tinha o campo. */
export function resolveTargetGender(profile: {
  gender?: AppGender;
  username: string;
  fullName?: string;
  biography?: string;
}): AppGender {
  if (profile.gender && profile.gender !== 'unknown') {
    return profile.gender;
  }

  const usernameStem = profile.username.split(/[._]/)[0] || profile.username;
  return classifyGender(profile.fullName || '', usernameStem, profile.biography || '');
}