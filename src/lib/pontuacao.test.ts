import { describe, expect, it } from 'vitest'
import {
  calcularPlacar,
  desfazerUltimaBatida,
  descreverBatida,
  obterVencedor,
  registrarBatida,
  type Batida,
  type Jogador,
  type Partida,
} from './pontuacao'

const J = (...ids: string[]): Jogador[] => ids.map((id) => ({ id, nome: id }))
const pts = (p: ReturnType<typeof calcularPlacar>) => Object.fromEntries(p.map((j) => [j.id, j.pontos]))
const bat = (id: string, tipo: 9 | 10): Batida => ({ batedorId: id, tipo })

describe('Caxeta', () => {
  it('1) Partida 1: A,B,C,D com batidas 9,10,9,10 → A=5 B=6 C=5 D=6, ninguém eliminado', () => {
    const placar = calcularPlacar(J('A', 'B', 'C', 'D'), [bat('A', 9), bat('B', 10), bat('C', 9), bat('D', 10)])
    expect(pts(placar)).toEqual({ A: 5, B: 6, C: 5, D: 6 })
    expect(placar.every((j) => j.vivo)).toBe(true)
    expect(obterVencedor(placar)).toBeNull()
  })

  it('2) Partida 2: pontos iniciais por jogador, eliminações duplas e vencedor D', () => {
    const jogadores = J('A', 'B', 'C', 'D')
    const iniciais = { A: 1, B: 2, C: 5, D: 10 }
    const batidas = [bat('D', 10), bat('C', 9), bat('D', 10), bat('D', 9)]

    const apos1 = calcularPlacar(jogadores, batidas.slice(0, 1), iniciais)
    expect(pts(apos1)).toEqual({ A: 0, B: 0, C: 3, D: 10 })
    expect(apos1.filter((j) => !j.vivo).map((j) => j.id)).toEqual(['A', 'B'])

    expect(calcularPlacar(jogadores, batidas.slice(0, 2), iniciais).find((j) => j.id === 'D')!.pontos).toBe(9)
    expect(calcularPlacar(jogadores, batidas.slice(0, 3), iniciais).find((j) => j.id === 'C')!.pontos).toBe(1)

    const final = calcularPlacar(jogadores, batidas, iniciais)
    expect(pts(final)).toMatchObject({ C: 0, D: 9 })
    expect(obterVencedor(final)?.id).toBe('D')
  })

  it('3) 1 ponto levando batida de 10 vai a 0 (nunca negativo)', () => {
    const placar = calcularPlacar(J('A', 'B', 'C', 'D'), [bat('A', 10)], { A: 10, B: 1, C: 10, D: 10 })
    expect(placar.find((j) => j.id === 'B')!.pontos).toBe(0)
  })

  it('4) Batedor nunca perde pontos', () => {
    const placar = calcularPlacar(J('A', 'B', 'C', 'D'), [bat('A', 10), bat('A', 9), bat('A', 10)])
    expect(placar.find((j) => j.id === 'A')!.pontos).toBe(10)
  })

  it('5) Desfazer devolve o jogador eliminado', () => {
    let p: Partida = { jogadores: J('A', 'B', 'C', 'D'), batidas: [] }
    for (let i = 0; i < 5; i++) p = registrarBatida(p, 'A', 10)
    expect(calcularPlacar(p.jogadores, p.batidas).filter((j) => !j.vivo).length).toBe(3)
    p = desfazerUltimaBatida(p)
    const placar = calcularPlacar(p.jogadores, p.batidas)
    expect(placar.every((j) => j.vivo)).toBe(true)
    expect(pts(placar)).toEqual({ A: 10, B: 2, C: 2, D: 2 })
  })

  // Cenário comum: A,B,C,D,E; A bate 10 quatro vezes (B..E=2) e B bate 10 → A=8, B=2, C=D=E=0 (3 eliminados, sem vencedor)
  const cenarioComEliminados = (): Partida => {
    let p: Partida = { jogadores: J('A', 'B', 'C', 'D', 'E'), batidas: [] }
    for (let i = 0; i < 4; i++) p = registrarBatida(p, 'A', 10)
    return registrarBatida(p, 'B', 10)
  }

  it('6) Batida de jogador eliminado é recusada', () => {
    const p = cenarioComEliminados()
    const placar = calcularPlacar(p.jogadores, p.batidas)
    expect(pts(placar)).toEqual({ A: 8, B: 2, C: 0, D: 0, E: 0 })
    expect(obterVencedor(placar)).toBeNull()
    expect(registrarBatida(p, 'C', 9)).toBe(p)
    expect(registrarBatida(p, 'E', 10)).toBe(p)
  })

  it('7) Batida após existir vencedor é recusada', () => {
    let p: Partida = { jogadores: J('A', 'B', 'C', 'D'), batidas: [] }
    for (let i = 0; i < 5; i++) p = registrarBatida(p, 'A', 10)
    expect(obterVencedor(calcularPlacar(p.jogadores, p.batidas))?.id).toBe('A')
    expect(registrarBatida(p, 'A', 9)).toBe(p)
    expect(p.batidas.length).toBe(5)
  })

  it('8) Eliminado não perde mais pontos e só vivos podem bater', () => {
    const p = registrarBatida(cenarioComEliminados(), 'A', 10)
    const placar = calcularPlacar(p.jogadores, p.batidas)
    expect(pts(placar)).toEqual({ A: 8, B: 0, C: 0, D: 0, E: 0 })
    expect(placar.filter((j) => j.vivo).map((j) => j.id)).toEqual(['A'])
    expect(obterVencedor(placar)?.id).toBe('A')
  })

  it('registrarBatida recusa batedor inexistente', () => {
    const p: Partida = { jogadores: J('A', 'B', 'C', 'D'), batidas: [] }
    expect(registrarBatida(p, 'Z', 9)).toBe(p)
  })

  it('descreverBatida mostra eliminações', () => {
    const p: Partida = {
      jogadores: [
        { id: '1', nome: 'Ana' },
        { id: '2', nome: 'Beto' },
        { id: '3', nome: 'Carla' },
        { id: '4', nome: 'Davi' },
      ],
      batidas: [],
    }
    let q = p
    for (let i = 0; i < 4; i++) q = registrarBatida(q, '1', 10)
    expect(descreverBatida(q, 0)).toBe('Mão 1: Ana bateu com 10 cartas (-2)')
    expect(descreverBatida(q, 4 - 1)).toBe('Mão 4: Ana bateu com 10 cartas (-2)')
    q = registrarBatida(q, '1', 10)
    expect(descreverBatida(q, 4)).toBe('Mão 5: Ana bateu com 10 cartas (-2) • eliminou Beto, Carla, Davi')
  })
})
