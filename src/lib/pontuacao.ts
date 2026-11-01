// Lógica pura da Caxeta (sem React). O placar é sempre CALCULADO a partir das batidas.

export type Jogador = { id: string; nome: string }
export type TipoBatida = 9 | 10
export type Batida = { batedorId: string; tipo: TipoBatida }
export type Partida = { jogadores: Jogador[]; batidas: Batida[] }
export type ItemPlacar = { id: string; nome: string; pontos: number; vivo: boolean }

export const PONTOS_INICIAIS = 10

const penalidade = (tipo: TipoBatida): number => (tipo === 9 ? 1 : 2)

/** pontosIniciais: número único (padrão 10) ou mapa por jogador (só para testes). */
export function calcularPlacar(
  jogadores: Jogador[],
  batidas: Batida[],
  pontosIniciais: number | Record<string, number> = PONTOS_INICIAIS,
): ItemPlacar[] {
  const pontos = new Map<string, number>()
  for (const j of jogadores) {
    pontos.set(j.id, typeof pontosIniciais === 'number' ? pontosIniciais : (pontosIniciais[j.id] ?? PONTOS_INICIAIS))
  }
  for (const b of batidas) {
    const perda = penalidade(b.tipo)
    for (const j of jogadores) {
      const p = pontos.get(j.id)!
      if (j.id !== b.batedorId && p > 0) pontos.set(j.id, Math.max(0, p - perda))
    }
  }
  return jogadores.map((j) => {
    const p = pontos.get(j.id)!
    return { id: j.id, nome: j.nome, pontos: p, vivo: p > 0 }
  })
}

export function obterVencedor(placar: ItemPlacar[]): ItemPlacar | null {
  const vivos = placar.filter((j) => j.vivo)
  return vivos.length === 1 ? vivos[0] : null
}

/** Retorna a nova partida; se a batida for inválida, retorna a MESMA partida. */
export function registrarBatida(partida: Partida, batedorId: string, tipo: TipoBatida): Partida {
  if (tipo !== 9 && tipo !== 10) return partida
  const placar = calcularPlacar(partida.jogadores, partida.batidas)
  if (obterVencedor(placar)) return partida
  const batedor = placar.find((j) => j.id === batedorId)
  if (!batedor || !batedor.vivo) return partida
  return { ...partida, batidas: [...partida.batidas, { batedorId, tipo }] }
}

export function desfazerUltimaBatida(partida: Partida): Partida {
  if (partida.batidas.length === 0) return partida
  return { ...partida, batidas: partida.batidas.slice(0, -1) }
}

/** Ex.: "Mão 3: Ana bateu com 10 cartas (-2) • eliminou Beto" */
export function descreverBatida(partida: Partida, indice: number): string {
  const batida = partida.batidas[indice]
  if (!batida) return ''
  const antes = calcularPlacar(partida.jogadores, partida.batidas.slice(0, indice))
  const depois = calcularPlacar(partida.jogadores, partida.batidas.slice(0, indice + 1))
  const batedor = partida.jogadores.find((j) => j.id === batida.batedorId)
  const eliminados = depois
    .filter((j, i) => antes[i].vivo && !j.vivo)
    .map((j) => j.nome)
  let texto = `Mão ${indice + 1}: ${batedor?.nome ?? '?'} bateu com ${batida.tipo} cartas (-${penalidade(batida.tipo)})`
  if (eliminados.length > 0) texto += ` • eliminou ${eliminados.join(', ')}`
  return texto
}
