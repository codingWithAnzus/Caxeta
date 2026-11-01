// Gera os ícones do PWA: node scripts/gerar-icones.mjs
import sharp from 'sharp'
import { writeFileSync } from 'node:fs'

const BG = '#0E1116'
const VERDE = '#34D399'

// escala = tamanho do "C" em relação ao ícone (maskable precisa ficar na zona segura)
function svg(escala, arredondado) {
  const r = 256 * escala * 0.5
  const stroke = 256 * escala * 0.26
  const rr = r - stroke / 2
  // arco em "C": abertura à direita
  const a = (30 * Math.PI) / 180
  const x1 = 256 + rr * Math.cos(-a), y1 = 256 + rr * Math.sin(-a)
  const x2 = 256 + rr * Math.cos(a), y2 = 256 + rr * Math.sin(a)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" ${arredondado ? 'rx="112"' : ''} fill="${BG}"/>
  <path d="M ${x1} ${y1} A ${rr} ${rr} 0 1 0 ${x2} ${y2}" fill="none" stroke="${VERDE}" stroke-width="${stroke}" stroke-linecap="round"/>
</svg>`
}

const png = async (s, tam, nome) =>
  sharp(Buffer.from(s)).resize(tam, tam).png().toFile(`public/${nome}`)

const normal = svg(1.6, false)
const maskable = svg(1.5, false)
writeFileSync('public/favicon.svg', svg(1.6, true))
await png(normal, 192, 'icon-192.png')
await png(normal, 512, 'icon-512.png')
await png(maskable, 192, 'icon-maskable-192.png')
await png(maskable, 512, 'icon-maskable-512.png')
console.log('Ícones gerados em public/')
