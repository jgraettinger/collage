package ingest

import (
	"image"

	"github.com/dademurphy/collage/server/model"
)

type CompletedTileCallback func(tile model.Tile, high, low *image.RGBA)

type TileImageBuilder struct {
	Full *image.RGBA64
	Callback CompletedTileCallback
}

type accumulatorSample struct {
	r, g, b uint32
}

type accumulator struct {
	model.Tile
	children []model.Tile
	data [model.TileSize * model.TileSize]accumulatorSample
}

func (b TileImageBuilder) BuildTree(root model.Tile) {
	stack := append([]*accumulator{},
		&accumulator{Tile: root, children: root.Children()})

	tileRect := image.Rect(0, 0, int(model.TileSize), int(model.TileSize))
	high, low := image.NewRGBA(tileRect), image.NewRGBA(tileRect)

	for len(stack) != 0 {
		tail := stack[len(stack)-1]

		if tail.Level == 0 {
			// Walk over photo pixels covered by this tile.
			for w, wMax := tail.WBegin(), tail.WEnd(); w != wMax; w++ {
				for h, hMax := tail.HBegin(), tail.HEnd(); h != hMax; h++ {
					offsetIn := h * uint(b.Full.Stride) + w * 8

					//rh, rl, gh, gl, bh, bl := b.Full.Pix[offsetIn:offsetIn+6]
					r := uint32(b.Full.Pix[offsetIn+0]) << 8 + uint32(b.Full.Pix[offsetIn+1])
					g := uint32(b.Full.Pix[offsetIn+2]) << 8 + uint32(b.Full.Pix[offsetIn+3])
					b := uint32(b.Full.Pix[offsetIn+4]) << 8 + uint32(b.Full.Pix[offsetIn+5])

					// For each tile on the stack, map the photo pixel to the
					// corresponding tile pixel, and accumulate.
					for _, entry := range stack {
						tw := (w - entry.WBegin()) >> entry.Level
						th := (h - entry.HBegin()) >> entry.Level

						accum := &entry.data[th*model.TileSize+tw]
						accum.r += r
						accum.g += g
						accum.b += b
					}
				}
			}
		}
		// Iteratively write and pop completed tiles off of the stack,
		// until the next child tile to visit is identified.
		for len(stack) != 0 {
			tail = stack[len(stack)-1]

			if len(tail.children) != 0 {
				// Pop the next child to visit, and push it onto the accumulator stack.
				var child model.Tile
				child, tail.children = tail.children[0], tail.children[1:]
				stack = append(stack,
					&accumulator{Tile: child, children: child.Children()})
				break
			}
			// The tail is complete. Handoff to the client & pop the stack.
			flattenAccumulator(tail, high, low)
			b.Callback(tail.Tile, high, low)
			stack = stack[:len(stack)-1]
		}
	}
}

func flattenAccumulator(a *accumulator, high *image.RGBA, low *image.RGBA) {
	width, height := a.WSpan() >> a.Level, a.HSpan() >> a.Level
	high.Rect = image.Rect(0, 0, int(width), int(height))
	low.Rect = high.Rect

	// Normalize by the square area of pixels sampled.
	areaShift := 2 * a.Level

	for h := uint(0); h != height; h++ {
		for w := uint(0); w != width; w++ {
			in := a.data[h * model.TileSize + w]
			r := in.r >> areaShift
			g := in.g >> areaShift
			b := in.b >> areaShift

			hind := h * uint(high.Stride) + w * 4
			high.Pix[hind+0] = uint8(r >> 8)
			high.Pix[hind+1] = uint8(g >> 8)
			high.Pix[hind+2] = uint8(b >> 8)
			high.Pix[hind+3] = 0xff

			lind := h * uint(low.Stride) + w * 4
			low.Pix[lind+0] = uint8(r & 0xff)
			low.Pix[lind+1] = uint8(g & 0xff)
			low.Pix[lind+2] = uint8(b & 0xff)
			low.Pix[lind+3] = 0xff
		}
	}
}
