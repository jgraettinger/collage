package libraw

/*
#include <libraw/libraw.h>

void loadPixel(ushort (*data)[4], int offset,
	ushort* r, ushort* g, ushort* b) {

	*r = data[offset][0];
	*g = data[offset][1];
	*b = data[offset][2];
}
*/
import "C"

import (
	//"fmt"
	"image"
	"image/color"
)

type imageProxy struct {
	bounds  image.Rectangle
	rowsize int
	buffer  *[4]C.ushort
}

func extractImageProxy(sizes ImageSizes, buffer *[4]C.ushort) *imageProxy {
	return &imageProxy{image.Rect(0, 0, sizes.Iwidth, sizes.Iheight),
		sizes.Iwidth, buffer}
}

func (p *imageProxy) ColorModel() color.Model {
	return color.NRGBA64Model
}

func (p *imageProxy) Bounds() image.Rectangle {
	return p.bounds
}

func (p *imageProxy) At(x, y int) color.Color {
	var r, g, b C.ushort
	C.loadPixel(p.buffer, C.int(y*p.rowsize+x), &r, &g, &b)

	//fmt.Println(r, g, b, a)
	return color.NRGBA64{uint16(r), uint16(g), uint16(b), (1<<16) - 1}
}

func (p *imageProxy) Opaque() bool {
	return true
}

func (p *imageProxy) SubImage(r image.Rectangle) image.Image {
	if !r.In(p.bounds) {
		return nil
	}
	return &imageProxy{r, p.rowsize, p.buffer}
}
