package libraw

// #include <libraw/libraw.h>
import "C"

type ImageSizes struct {
	// Full size of raw image (including the frame) in pixels.
	RawHeight, RawWidth int
	// Size of visible ("meaningful") part of the image (sans frame).
	Height, Width int
	// Coordinates of the top left corner of the frame.
	TopMargin, LeftMargin int
	// Size of the output image (may differ from height/width for
	// cameras that require image rotation or have non-square pixels).
	Iheight, Iwidth int
	// Full size of raw data row in bytes.
	RawPitch int
	// Pixel width/height ratio. If it is not unity, scaling of the
	// image along one of the axes is required during output.
	PixelAspect float64
	// Image orientation (0 if does not require rotation; 3 if
	// requires 180-deg rotation; 5 if 90-deg counterclockwise,
	// 6 if 90-deg clockwise.
	Flip int
}

func extractImageSizes(p *C.libraw_image_sizes_t) (out ImageSizes) {
	out.RawHeight = int(p.raw_height)
	out.RawWidth = int(p.raw_width)
	out.Height = int(p.height)
	out.Width = int(p.width)
	out.TopMargin = int(p.top_margin)
	out.LeftMargin = int(p.left_margin)
	out.Iheight = int(p.iheight)
	out.Iwidth = int(p.iwidth)
	out.RawPitch = int(p.raw_pitch)
	out.PixelAspect = float64(p.pixel_aspect)
	out.Flip = int(p.flip)
	return
}
