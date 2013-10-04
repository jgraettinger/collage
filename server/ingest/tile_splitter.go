package ingest

import (
	"fmt"
	"image"
	"image/color"
	"image/png"
	"os"
	"path/filepath"

	"github.com/dademurphy/collage/server/model"
)

type TileSplitter struct {
	BaseDirectory string
}

type pixelAccumulator struct {
	r, g, b, count uint32
}

type tileStackEntry struct {
	tile              model.Tile
	remainingChildren []model.Tile
	data              [model.TileSize * model.TileSize]pixelAccumulator
}

func (e *tileStackEntry) ColorModel() color.Model {
	return color.NRGBA64Model
}

func (e *tileStackEntry) Bounds() image.Rectangle {
	// Note we're rounding down here, dropping
	// the right/bottom border of non-divisible tiles.
	width := e.tile.WSpan() >> e.tile.Level
	height := e.tile.HSpan() >> e.tile.Level
	return image.Rect(0, 0, int(width), int(height))
}

func (e *tileStackEntry) At(x, y int) color.Color {
	return &e.data[uint(y)*model.TileSize+uint(x)]
}

func (e *tileStackEntry) Opaque() bool {
	return true
}

func (a *pixelAccumulator) RGBA() (uint32, uint32, uint32, uint32) {
	return a.r / a.count,
		a.g / a.count,
		a.b / a.count,
		0xff
}

func (s TileSplitter) SplitTiles(id string, img image.Image) error {
	photo := &model.Photo{id, uint(img.Bounds().Max.X), uint(img.Bounds().Max.Y)}

	root := model.NewRootTile(photo)
	stack := append([]*tileStackEntry{},
		&tileStackEntry{tile: root, remainingChildren: root.Children()})

	for len(stack) != 0 {
		tail := stack[len(stack)-1]

		fmt.Printf("Examining %v: (%v, %v, %v, %v)@%v\n", tail.tile,
			tail.tile.WBegin(), 
			tail.tile.HBegin(),
			tail.tile.WEnd(),
			tail.tile.HEnd(),
			tail.tile.Level)

		if tail.tile.Level == 0 {
			// Walk over photo pixels covered by this tile.
			for w, wMax := tail.tile.WBegin(), tail.tile.WEnd(); w != wMax; w++ {
				for h, hMax := tail.tile.HBegin(), tail.tile.HEnd(); h != hMax; h++ {
					r, g, b, _ := img.At(int(w), int(h)).RGBA()

					// For each tile on the stack, map the photo pixel to the
					// corresponding tile pixel, and accumulate.
					for _, entry := range stack {
						tw := (w - entry.tile.WBegin()) >> entry.tile.Level
						th := (h - entry.tile.HBegin()) >> entry.tile.Level

						accum := &entry.data[th*model.TileSize+tw]
						accum.r += r
						accum.g += g
						accum.b += b
						accum.count += 1
					}
				}
			}
		}
		// Iteratively write and pop completed tiles off of the stack,
		// until the next child tile to visit is identified.
		for {
			if len(tail.remainingChildren) != 0 {
				// Push the next child to visit onto the stack.
				child := tail.remainingChildren[0]
				tail.remainingChildren = tail.remainingChildren[1:]
				stack = append(stack,
					&tileStackEntry{tile: child, remainingChildren: child.Children()})
				break
			} else {
				// This tile is complete. Write to disk and pop the stack,
				// but continue looking upstack for completed tiles.
				fullPath := filepath.Join(s.BaseDirectory,
					fmt.Sprintf("%v-%v-%v-%v.png", id,
						tail.tile.Level, tail.tile.WIndex, tail.tile.HIndex))
				fmt.Println("Writing ", fullPath)

				if file, err := os.Create(fullPath); err != nil {
					return err
				} else if err = png.Encode(file, tail); err != nil {
					return err
				}
				stack = stack[:len(stack)-1]
				if len(stack) != 0 {
					tail = stack[len(stack)-1]
					continue
				} else {
					break
				}
			}
		}
	}
	return nil
}
