package libraw

// #include <libraw/libraw.h>
import "C"

type Params struct {
	// Camera manufacturer and model.
	Make, Model string
	// Number of RAW images in file (0 means not recognized).
	RawCount int
	// DNV version (1 for Foveon matricies, 0 for others).
	DngVersion int
	// Number of colors in the file
	Colors int
	// Bit mask describing the order of color pixels in the matrix.
	Filters uint
	// Description of colors. Always length 4.
	Cdesc string
}

func extractParams(p *C.libraw_iparams_t) (out Params) {
	out.Make = C.GoString(&p.make[0])
	out.Model = C.GoString(&p.model[0])
	out.RawCount = int(p.raw_count)
	out.DngVersion = int(p.dng_version)
	out.Colors = int(p.colors)
	out.Filters = uint(p.filters)
	out.Cdesc = C.GoString(&p.cdesc[0])
	return
}
