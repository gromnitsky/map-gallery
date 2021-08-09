/* global dialogPolyfill */

customElements.define('map-gallery', class extends HTMLElement {
    constructor() {
        super()

        let shadow_root = this.attachShadow({mode: 'open'})
        shadow_root.innerHTML = `
<style>
:host {
  display: block;
}

dialog img {
  max-width: calc(100vw - 3*16px);
  max-height: calc(100vh - 4*16px - 2rem);
}
</style>

<slot>
  <dialog part="popup">
    <header style="margin-bottom: 1em">
      <button id="MapGallery__popup__close">Close</button>
      <button id="MapGallery__popup__twitter">Open Twitter account</button>
    </header>
    <div><img></div>
  </dialog>
</slot>
`
        inject(shadow_root, this.getAttribute('map') || 'map.svg',
               this.getAttribute('areas') || 'map.json')
    }
})

async function inject(parent_node, map_url, areas_url) {
    let areas = await fetch(areas_url).then( r => r.json())
    svg_defs(parent_node, areas) // inject svg <def>

    let map = document.createElement('div')
    parent_node.appendChild(map)

    let popup = new Popup(parent_node)

    // inject an svg map
    map.innerHTML = await fetch(map_url).then( r => r.text())
    map.querySelector('svg').setAttribute('part', 'map')
    map.querySelector('svg').style.display = 'block'

    // update map areas
    let areas_nodes = map.querySelectorAll('.MapGallery__area')
    areas_nodes.forEach( node => node.setAttribute('part', 'map-area'))
    Array.from(areas_nodes).filter(v => areas[v.id]).forEach( region => {
            region.onclick = popup.register(areas[region.id].file)
            region.style.fill = e`url(#MapGallery__pattern__${region.id})`
        })
}

function svg_defs(parent_node, areas) {
    let el = document.createElement('div')
    el.style.height = '0px'; el.style.width = '0px'
    el.innerHTML = ['<svg width="0" height="0"><defs>',
                    ...svg_patterns(areas),
                    '</defs></svg>'].join`\n`
    parent_node.appendChild(el)
}

function svg_patterns(areas) {
    let pattern = (area_id, area) => {
        return e`<pattern id="MapGallery__pattern__${area_id}" height="1" width="1"><image href="${area.file}" x="${area.x || 0}" y="${area.y || 0}" height="${area.height || 100}" width="${area.width || 100}"></pattern>`
    }
    return Object.keys(areas).map( id => pattern(id, areas[id]))
}

class Popup {
    constructor(shadow_root) {
        this.dlg = shadow_root.querySelector('slot')
            .assignedNodes({flatten: true})
            .filter( v => v.tagName === 'DIALOG')?.[0]

        if (typeof dialogPolyfill !== 'undefined')
            dialogPolyfill.registerDialog(this.dlg)

        let close = this.dlg.querySelector('#MapGallery__popup__close')
        close.onclick = () => this.close()

        let twitter = this.dlg.querySelector('#MapGallery__popup__twitter')
        if (twitter) {
            twitter.onclick = () => {
                this.close()
                let account = this.dlg.querySelector('img').src.split('/')
                    .slice(-1)?.[0].replace(/\.[^.]+$/, '')
                window.open(e`https://twitter.com/${account}`, '_blank')
            }
        }
    }

    open(file_url) {
        if (!file_url) return
        this.dlg.querySelector('img').src = file_url
        this.dlg.showModal()
    }

    close() { this.dlg.close() }

    register(file) { return () => this.open(file) }
}

function e(strings, ...values) {
    let escape = (str) => {
        let map = {'&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot', "'": 'apos'}
        return String(str == null ? '' : str).replace(/[&<>"']/g, s => `&${map[s]};`)
    }
    return strings.reduce( (acc, cur, idx) => {
        acc.push(cur); acc.push(escape(values[idx]))
        return acc
    }, []).join('')
}
