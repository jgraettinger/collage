package model

import (
	"math"
)

type Tile struct {
	Photo                 *Photo
	Level, WIndex, HIndex uint
}

const (
	TileShift = 8
	TileSize  uint = 1 << TileShift
)

func RootTile(photo *Photo) Tile {
	var level uint
	if photo.Width > photo.Height {
		level = maximumLevel(photo.Width)
	} else {
		level = maximumLevel(photo.Height)
	}
	return Tile{photo, level, 0, 0}
}

func maximumLevel(span uint) uint {
	if span <= TileSize {
		return 0
	}
	return uint(math.Ceil(math.Log2(float64(span)))) - TileShift
}

func (t Tile) WBegin() uint {
	return TileSize << t.Level * t.WIndex
}
func (t Tile) WEnd() uint {
	wend := TileSize << t.Level * (t.WIndex + 1)
	if wend < t.Photo.Width {
		return wend
	} else {
		return t.Photo.Width
	}
}
func (t Tile) WSpan() uint {
	return t.WEnd() - t.WBegin()
}
func (t Tile) HBegin() uint {
	return TileSize << t.Level * t.HIndex
}
func (t Tile) HEnd() uint {
	hend := TileSize << t.Level * (t.HIndex + 1)
	if hend < t.Photo.Height {
		return hend
	} else {
		return t.Photo.Height
	}
}
func (t Tile) HSpan() uint {
	return t.HEnd() - t.HBegin()
}

func (t Tile) Children() (children []Tile) {
	if t.Level == 0 {
		return
	}
	/* Parent tiles split themselves into up to four children, depending on
	 * whether each potential child has overlap with the photo bounds.
	 *
	 * Specifically, children have one level less than the parent (half of the
	 * parent tile's stride), and a wIndex/hIndex which has been shifted by
	 * one, plus zero or one.
	 */
	level := t.Level - 1
	wIndex := t.WIndex << 1
	hIndex := t.HIndex << 1
	size := TileSize << level
	// Would the right/bottom child tiles lay outside the photo bounds?
	wCheck := (wIndex+1)*size < t.Photo.Width
	hCheck := (hIndex+1)*size < t.Photo.Height

	// This tile is guaranteed to exist.
	children = append(children, Tile{t.Photo, level, wIndex, hIndex})
	if wCheck {
		children = append(children, Tile{t.Photo, level, wIndex + 1, hIndex})
	}
	if hCheck {
		children = append(children, Tile{t.Photo, level, wIndex, hIndex + 1})
	}
	if wCheck && hCheck {
		children = append(children, Tile{t.Photo, level, wIndex + 1, hIndex + 1})
	}
	return
}
