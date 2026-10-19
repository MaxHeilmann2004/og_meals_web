import { ELEMENT_NODE, parse, render, walkSync } from 'ultrahtml'
import type { ElementNode, Node } from 'ultrahtml'

/** Returns the markup of the element marked with `data-image-root` from a full SSR document. */
export const extractImageRoot = (html: string): ElementNode => {
  const document = parse(html.replace(/<!--[\s\S]*?-->/g, ''))
  let root: ElementNode | undefined
  walkSync(document, (node: Node) => {
    if (!root && node.type === ELEMENT_NODE && 'data-image-root' in node.attributes) root = node
  })
  if (!root) throw new Error('Meal plan image root not found in rendered page.')
  return root
}

export const collectImages = (root: ElementNode) => {
  const images: ElementNode[] = []
  walkSync(root, (node: Node) => {
    if (node.type === ELEMENT_NODE && node.name === 'img') images.push(node)
  })
  return images
}

export const renderMarkup = (root: ElementNode) => render(root)

const namedEntities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0' }

const decodeText = (text: string) => text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
  if (entity[0] === '#') {
    const code = entity[1]!.toLowerCase() === 'x' ? Number.parseInt(entity.slice(2), 16) : Number.parseInt(entity.slice(1), 10)
    return Number.isNaN(code) ? match : String.fromCodePoint(code)
  }
  return namedEntities[entity.toLowerCase()] ?? match
})

/** satori-html keeps HTML entities (e.g. `&amp;`) in text nodes; Satori would print them literally. */
export const decodeEntities = <T>(node: T): T => {
  if (typeof node === 'string') return decodeText(node) as T
  if (Array.isArray(node)) return node.map(child => decodeEntities(child)) as T
  if (node && typeof node === 'object') {
    const props = (node as { props?: { children?: unknown } }).props
    if (props?.children !== undefined) props.children = decodeEntities(props.children)
  }
  return node
}
