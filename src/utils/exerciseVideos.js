/**
 * Banco de vídeos demonstrativos de exercícios.
 *
 * Como adicionar novos vídeos:
 *   1. Encontre o ID do vídeo no YouTube (a parte após "v=" na URL).
 *   2. Adicione uma entrada com o nome do exercício em LOWER CASE, sem acentos,
 *      espaços viram underscore — ou use a chave que aparecer no console ao
 *      clicar em "Ver execução" em um exercício sem vídeo.
 *   3. Pronto. Nenhuma outra mudança no código é necessária.
 *
 * A busca é tolerante: normaliza o nome do exercício (lowercase, sem acentos,
 * espaços → underscores) e tenta correspondência exata ou parcial.
 */

const DB = {
  // ── PEITO ──────────────────────────────────────────────────────
  supino_reto:               'KIWBpP1kcwI',
  supino_inclinado:          'IP4oeKh1Sd8',
  supino_declinado:          'OR4IqkpIIQ8',
  supino_reto_halteres:      'VmB1G1K5j1c',
  supino_inclinado_halteres: 'QLCzL2_wZj4',
  crucifixo:                 'e9BmBwFGhmI',
  crucifixo_inclinado:       'Iwe6AmxVf7o',
  peck_deck:                 'PBI02IQBRbk',
  crossover:                 'taI4XduLpTk',
  flexao_de_braco:           'IODxDxX7oi4',
  // ── COSTAS ────────────────────────────────────────────────────
  puxada_frontal:            'CAwf7n6Luuc',
  puxada_aberta:             'CAwf7n6Luuc',
  remada_curvada:            'G8l_8chR5BE',
  remada_curvada_barra:      'G8l_8chR5BE',
  remada_sentada:            'GZbfZ033f74',
  remada_unilateral:         'pYcpY20QaE8',
  pulldown:                  'CAwf7n6Luuc',
  levantamento_terra:        'op9kVnSso6Q',
  barra_fixa:                'eGo4IYlbE5g',
  // ── OMBROS ────────────────────────────────────────────────────
  desenvolvimento_militar:   'qEwKCR5JCog',
  desenvolvimento_halteres:  'qEwKCR5JCog',
  elevacao_lateral:          'FeCtHXHxKKQ',
  elevacao_frontal:          'sOoBhDFOrs4',
  crucifixo_invertido:       'Mk0t7QBnrMM',
  face_pull:                 'rep-qVOkqgk',
  // ── BICEPS ────────────────────────────────────────────────────
  rosca_direta:              'ykJmrZ5v0Oo',
  rosca_alternada:           'sAq_ocpS3zY',
  rosca_martelo:             'zC3nLlEvin4',
  rosca_concentrada:         'Jvj2wV0vOYU',
  rosca_scott:               'R4JJGhHmOIY',
  // ── TRICEPS ───────────────────────────────────────────────────
  triceps_testa:             'ir5PsbniVSc',
  triceps_frances:           'ir5PsbniVSc',
  triceps_pulley:            'vB5OHsJ3EME',
  triceps_corda:             'kiuVA0gs3EI',
  mergulho_triceps:          'wjUmnZH528Y',
  // ── PERNAS ────────────────────────────────────────────────────
  agachamento:               'aclHkVaku9U',
  agachamento_livre:         'aclHkVaku9U',
  leg_press:                 'IZxyjW7SKSA',
  leg_press_45:              'IZxyjW7SKSA',
  extensao_de_pernas:        'YyvSfVjQeL0',
  flexao_de_pernas:          'Orxowest56A',
  stiff:                     'oiDLNR4oHH0',
  terra_sumô:                'q4G8Ilinjgg',
  afundo:                    '3XDriUn0qdg',
  passada:                   '3XDriUn0qdg',
  elevacao_de_panturrilha:   'gwLzBvsoy_g',
  panturrilha_em_pe:         'gwLzBvsoy_g',
  hack_squat:                'EdtfosQCMDA',
  // ── ABDÔMEN ───────────────────────────────────────────────────
  abdominal_crunch:          'd2JmEMfFoxg',
  prancha:                   'pSHjTRCQxIw',
  elevacao_de_pernas:        '3XDriUn0qdg',
  abdominal_roda:            'pSHjTRCQxIw',
}

/** Normaliza o nome do exercício para corresponder às chaves do DB */
function normalize(name = '') {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // remove acentos
    .replace(/[^a-z0-9 ]/g, ' ')       // símbolos → espaço
    .trim()
    .replace(/\s+/g, '_')              // espaços → underscore
}

/**
 * Retorna o ID do YouTube para um exercício, ou null se não houver.
 * A busca tenta correspondência exata; se não encontrar, tenta
 * se alguma chave do banco está contida no nome (busca parcial).
 */
export function getExerciseVideoId(exerciseName) {
  const key = normalize(exerciseName)
  if (DB[key]) return DB[key]

  // Busca parcial: alguma chave do DB aparece dentro do nome normalizado?
  for (const [dbKey, videoId] of Object.entries(DB)) {
    if (key.includes(dbKey) || dbKey.includes(key)) return videoId
  }
  return null
}

/** URL de embed do YouTube para usar em iframe */
export function getEmbedUrl(videoId) {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
}
