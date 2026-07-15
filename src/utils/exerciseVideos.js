/**
 * BANCO DE VÍDEOS — Ganhos Brutais
 *
 * Para adicionar um novo vídeo basta acrescentar uma linha aqui.
 * A chave deve ser o nome do exercício em minúsculas, sem acentos,
 * espaços substituídos por underscore.
 *
 * Exemplo:
 *   supino_reto: 'KIWBpP1kcwI'
 *
 * O valor é o ID do YouTube (parte após "?v=" na URL do vídeo).
 * Nenhuma outra mudança no código é necessária.
 */
const VIDEOS = {
  // ── PEITO ──────────────────────────────────────────────────
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
  // ── COSTAS ─────────────────────────────────────────────────
  puxada_frontal:            'CAwf7n6Luuc',
  puxada_aberta:             'CAwf7n6Luuc',
  puxada_na_polia:           'CAwf7n6Luuc',
  remada_curvada:            'G8l_8chR5BE',
  remada_curvada_barra:      'G8l_8chR5BE',
  remada_sentada:            'GZbfZ033f74',
  remada_unilateral:         'pYcpY20QaE8',
  remada_baixa:              'GZbfZ033f74',
  pulldown:                  'CAwf7n6Luuc',
  levantamento_terra:        'op9kVnSso6Q',
  barra_fixa:                'eGo4IYlbE5g',
  pullover:                  'yFsHVFKhDpw',
  // ── OMBROS ─────────────────────────────────────────────────
  desenvolvimento_militar:   'qEwKCR5JCog',
  desenvolvimento_halteres:  'qEwKCR5JCog',
  elevacao_lateral:          'FeCtHXHxKKQ',
  elevacao_frontal:          'sOoBhDFOrs4',
  crucifixo_invertido:       'Mk0t7QBnrMM',
  face_pull:                 'rep-qVOkqgk',
  encolhimento:              'cJRVVxmytaM',
  // ── BÍCEPS ─────────────────────────────────────────────────
  rosca_direta:              'ykJmrZ5v0Oo',
  rosca_alternada:           'sAq_ocpS3zY',
  rosca_martelo:             'zC3nLlEvin4',
  rosca_concentrada:         'Jvj2wV0vOYU',
  rosca_scott:               'R4JJGhHmOIY',
  rosca_no_cabo:             'av7-8CzC9Sw',
  // ── TRÍCEPS ────────────────────────────────────────────────
  triceps_testa:             'ir5PsbniVSc',
  triceps_frances:           'ir5PsbniVSc',
  triceps_pulley:            'vB5OHsJ3EME',
  triceps_corda:             'kiuVA0gs3EI',
  triceps_coice:             'l3WAbkkxp3U',
  mergulho_triceps:          'wjUmnZH528Y',
  // ── PERNAS ─────────────────────────────────────────────────
  agachamento:               'aclHkVaku9U',
  agachamento_livre:         'aclHkVaku9U',
  agachamento_goblet:        'MeIiIdhvXT4',
  leg_press:                 'IZxyjW7SKSA',
  leg_press_45:              'IZxyjW7SKSA',
  extensao_de_pernas:        'YyvSfVjQeL0',
  flexao_de_pernas:          'Orxowest56A',
  stiff:                     'oiDLNR4oHH0',
  terra_sumo:                'q4G8Ilinjgg',
  afundo:                    '3XDriUn0qdg',
  passada:                   '3XDriUn0qdg',
  afundo_bulgaro:            '2C-uNgKwPLE',
  elevacao_de_panturrilha:   'gwLzBvsoy_g',
  panturrilha_em_pe:         'gwLzBvsoy_g',
  hack_squat:                'EdtfosQCMDA',
  cadeira_abdutora:          'kFAFHRtQ6F0',
  cadeira_adutora:           'fQTf5zSjlxY',
  // ── ABDÔMEN ────────────────────────────────────────────────
  abdominal_crunch:          'd2JmEMfFoxg',
  prancha:                   'pSHjTRCQxIw',
  elevacao_de_pernas:        'JB2oyawG9KI',
  abdominal_roda:            'pSHjTRCQxIw',
  abdominal_infra:           'JB2oyawG9KI',
  obliquo:                   'rnhPiT4K5OA',
}

/** Normaliza o nome para casar com as chaves do banco */
function normalize(name = '') {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9 ]/g, ' ')
    .trim()
    .replace(/\s+/g, '_')
}

/**
 * Retorna o ID do YouTube para um exercício, ou null se não houver cadastro.
 * Tenta correspondência exata primeiro, depois parcial.
 */
export function getExerciseVideoId(exerciseName) {
  const key = normalize(exerciseName)
  if (VIDEOS[key]) return VIDEOS[key]
  // Busca parcial — alguma chave do banco está contida no nome?
  for (const [k, id] of Object.entries(VIDEOS)) {
    if (key.includes(k) || k.includes(key)) return id
  }
  return null
}

// getEmbedUrl removed — app now uses YouTube search links instead of iframe
