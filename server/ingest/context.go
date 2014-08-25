package ingest

/*
#cgo LDFLAGS: -lraw
#include <stdlib.h>
#include <libraw/libraw.h>

void fillRGBA64(libraw_processed_image_t* image_in,
	int image_out_stride, void* image_out) {

	int h, w, image_in_stride = image_in->width * 3 * 2;
	for(h = 0; h != image_in->height; ++h) {
		uchar* row_in = image_in->data + h * image_in_stride;
		uchar* row_out = (uchar*)(image_out) + h * image_out_stride;
		for(w = 0; w != image_in->width; ++w) {
			uchar* pix_in = row_in + w * 3 * 2;
			uchar* pix_out = row_out + w * 4 * 2;
			pix_out[0] = pix_in[1];
			pix_out[1] = pix_in[0];
			pix_out[2] = pix_in[3];
			pix_out[3] = pix_in[2];
			pix_out[4] = pix_in[5];
			pix_out[5] = pix_in[4];
			pix_out[6] = 0xff;
			pix_out[7] = 0xff;
		}
	}
}
*/
import "C"

import (
	"errors"
	"fmt"
	"image"
	"time"
	"unsafe"

	"github.com/dademurphy/collage/server/model"
)

func LibRawVersion() string {
	return C.GoString(C.libraw_version())
}

type Context struct {
	raw *C.libraw_data_t
}

// Attempts to open a raw photo, and initialize a context for it's processing.
// The file is checked for validity, and photo metadata is extracted.
func NewContext(rawPath string) (*Context, error) {
	// Libraw allows flags for setting memory/IO error callbacks. It's defaults
	// just printf, and it'll throw a c++ exception regardless after callback.
	// TODO: Make sure we can catch the c++ exception thrown on corrupted file.
	c := &Context{raw: C.libraw_init(0)}
	if c.raw == nil {
		return nil, errors.New("libraw_init failed")
	}

	cRawPath := C.CString(rawPath)
	defer C.free(unsafe.Pointer(cRawPath))

	code, err := C.libraw_open_file(c.raw, cRawPath)
	if err = errconv(code, err); err != nil {
		return nil, err
	}

	fmt.Println("Using unpacker:",
		C.GoString(C.libraw_unpack_function_name(c.raw)))

	// Use the camera's recorded white-balance and color matrix.
	c.raw.params.use_camera_wb = 1
	c.raw.params.use_camera_matrix = 1
	// Always output 16 bits per channel.
	c.raw.params.output_bps = 16
	// Produce a linear RGB image.
	c.raw.params.gamm[0] = 1.0
	c.raw.params.gamm[1] = 1.0
	// Output in sRGB colorspace.
	c.raw.params.output_color = 1
	// Use DCB (4) interpolation.
	// TODO: Try LMMSE (9) interpolation, in the GPLv2 pack.
	c.raw.params.user_qual = 4
	c.raw.params.dcb_iterations = -1 // Useful only for DCB.
	c.raw.params.dcb_enhance_fl = 0
	// One median-filter pass. Libraw uses a 9-neighbor kernel.
	c.raw.params.med_passes = 1
	// Don't brighten the image via histogram.
	c.raw.params.no_auto_bright = 1
	// Use FBDD nose reduction pre-demosaic.
	c.raw.params.fbdd_noiserd = 1
	// Line noise (banding) reduction. Useful range is 0.001 to 0.02.
	c.raw.params.linenoise = 0
	return c, nil
}

func (c *Context) FreeContext() error {
	_, err := C.libraw_close(c.raw)
	return err
}

func (c *Context) Exif() *model.Exif {
	out := &model.Exif{}
	out.Make = C.GoString(&c.raw.idata.make[0])
	out.Model = C.GoString(&c.raw.idata.model[0])
	out.DateTime = time.Unix(int64(c.raw.other.timestamp), 0).UTC()
	return out
}

func (c *Context) ProduceLinearizedImage() (*image.RGBA64, error) {
	code, err := C.libraw_unpack(c.raw)
	if err = errconv(code, err); err != nil {
		return nil, err
	}
	fmt.Println("finished unpack")
	code, err = C.libraw_dcraw_process(c.raw)
	if err = errconv(code, err); err != nil {
		return nil, err
	}
	fmt.Println("finished process")
	render, err := C.libraw_dcraw_make_mem_image(c.raw, &code)
	defer C.free(unsafe.Pointer(render))
	if err = errconv(code, err); err != nil {
		return nil, err
	}
	// Sanity-check properties of the processed render.
	if render._type != C.LIBRAW_IMAGE_BITMAP {
		return nil, errors.New("Expected a bitmap image")
	}
	if render.colors != 3 {
		return nil, errors.New("Expected 3 color planes")
	}
	if render.bits != 16 {
		return nil, errors.New("Expected 16 bits per plane")
	}
	// Copy the render into a Golang-allocated image.
	final := image.NewRGBA64(image.Rect(0, 0,
		int(render.width), int(render.height)))
	C.fillRGBA64(render, C.int(final.Stride), unsafe.Pointer(&final.Pix[0]))
	return final, nil
}

// Converts LibRaw error codes to Go errors.
// LibRaw passes system errors as positive errno values,
// and reserves negative error codes for library errors.
// LIBRAW_SUCCESS is zero.
func errconv(code C.int, errno error) error {
	if errno != nil {
		return errno
	}
	if code < 0 {
		return errors.New(C.GoString(C.libraw_strerror(code)))
	} else if code > 0 {
		return errors.New(C.GoString(C.strerror(code)))
	}
	// code == LIBRAW_SUCCESS
	return nil
}
