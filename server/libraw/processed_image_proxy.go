package libraw

/*
#include <libraw/libraw.h>
*/
import "C"

import (
	//"fmt"
	"image"
	"image/color"
	"errors"
	"reflect"
	"unsafe"
)

type procImageProxy struct {
	bounds image.Rectangle
	rowsize int

	colors, bits int

	data []C.uchar
}

func extractProccessedImage(p *C.libraw_processed_image_t) (*procImageProxy, error) {
	if p._type != C.LIBRAW_IMAGE_BITMAP {
		return nil, errors.New("Only bitmap images are supported")
	}
	var out procImageProxy
	out.bounds = image.Rect(0, 0, int(p.width), int(p.height))
	out.colors = int(p.colors)
	out.bits = int(p.bits)
	out.rowsize = int(p.width)

	sliceHeader := (*reflect.SliceHeader)(unsafe.Pointer(&out.data))
	sliceHeader.Cap = int(p.data_size)
	sliceHeader.Len = int(p.data_size)
	sliceHeader.Data = uintptr(unsafe.Pointer(&p.data[0]))

	return &out, nil
}

func (p *procImageProxy) ColorModel() color.Model {
	return color.NRGBA64Model
}

func (p *procImageProxy) Bounds() image.Rectangle {
	return p.bounds
}

func (p *procImageProxy) At(x, y int) color.Color {
	var c color.NRGBA64
	offset := (y * p.rowsize + x) * p.colors * (p.bits / 8)

	c.R = uint16(p.data[offset + 1]) << 8 + uint16(p.data[offset + 0])
	c.G = uint16(p.data[offset + 3]) << 8 + uint16(p.data[offset + 2])
	c.B = uint16(p.data[offset + 5]) << 8 + uint16(p.data[offset + 4])
	c.A = 0xffff
	return c
}

func (p *procImageProxy) Opaque() bool {
	return true
}

func (p *procImageProxy) SubImage(r image.Rectangle) image.Image {
	if !r.In(p.bounds) {
		return nil
	}
	return &procImageProxy{r, p.rowsize, p.colors, p.bits, p.data}
}
