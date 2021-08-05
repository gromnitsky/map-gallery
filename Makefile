out := _out

static.src := $(wildcard examples/*)
static.dest := $(patsubst examples/%, $(out)/%, $(static.src)) $(out)/map-gallery.js
$(out)/%: examples/%; $(copy)
$(out)/%: %; $(copy)

vendor.src := $(shell adieu -pe '$$("link,script").map((_,e) => $$(e).attr("href") || $$(e).attr("src")).get().filter(v => /node_modules/.test(v)).join`\n`' examples/single.html)
vendor.dest := $(addprefix $(out)/, $(vendor.src))
$(out)/node_modules/%: node_modules/%; $(copy)

all: $(static.dest) $(vendor.dest)

define copy =
@mkdir -p $(dir $@)
cp $< $@
endef



upload: all
	rsync -avPL --delete -e ssh $(out)/ gromnitsky@web.sourceforge.net:/home/user-web/gromnitsky/htdocs/js/examples/map-gallery/
