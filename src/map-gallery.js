/* global dialogPolyfill */

export default async function(node, url = 'map.svg') {
    let areas = await areas_fetch()
    svg_defs(node, areas)

    let map = document.createElement('div')
    node.appendChild(map)

    style_inject(node)
    let popup = new Popup(node)

    // inject an svg map
    await fetch(url).then( r => r.text()).then( v => map.innerHTML = v)

    // update map areas
    Array.from(map.querySelectorAll('.MapGallery__area'))
        .filter(v => areas[v.id]).forEach( region => {
            region.onclick = popup.register(areas[region.id].file)
            region.style.fill = `url(#MapGallery__pattern__${region.id})`
        })
}

function areas_fetch(url = 'map.json') {
    return fetch(url).then( r => r.json())
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
        return `<pattern id="MapGallery__pattern__${e(area_id)}" height="1" width="1" ><image href="${e(area.file)}" x="${e(area.x) || 0}" y="${e(area.y) || 0}" height="${e(area.height) || 100}" width="${e(area.width) || 100}" /></pattern>`
    }
    return Object.keys(areas).map( id => pattern(id, areas[id]))
}

class Popup {
    constructor(parent_node) {
        this.inject(parent_node)

        let close = this.dlg.querySelector('#MapGallery__popup__close')
        close.onclick = () => this.close()

        let twitter = this.dlg.querySelector('#MapGallery__popup__twitter')
        twitter.onclick = () => {
            this.close()
            let account = this.dlg.querySelector('img').src.split('/')
                .slice(-1)?.[0].replace(/\.[^.]+$/, '')
            window.open(`https://twitter.com/${e(account)}`, '_blank')
        }
    }

    inject(parent_node) {
        this.dlg = document.createElement('dialog')
        this.dlg.id = 'MapGallery__popup'
        this.dlg.innerHTML = `<header style="margin-bottom: 1em">
<button id="MapGallery__popup__close">Close</button>
<button id="MapGallery__popup__twitter">Open Twitter account</button>
</header>
<div><img></div>`
        parent_node.appendChild(this.dlg)

        if (typeof dialogPolyfill !== 'undefined')
            dialogPolyfill.registerDialog(this.dlg)
    }

    open(file_url) {
        if (!file_url) return
        this.dlg.querySelector('img').src = file_url
        this.dlg.showModal()
    }

    close() { this.dlg.close() }

    register(file) { return () => this.open(file) }
}

function style_inject(parent_node) {
    let node = document.createElement('style')
    node.innerHTML = `
.MapGallery__area:hover {
  stroke-width: 3;
  stroke: red;
}

#MapGallery__popup img {
  max-width: calc(100vw - 3*16px);
  max-height: calc(100vh - 4*16px - 2rem);
}
`
    parent_node.appendChild(node)
}

function e(str) {
    let map = {'&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot', "'": 'apos'}
    return String(str == null ? '' : str).replace(/[&<>"']/g, s=>`&${map[s]};`)
}
