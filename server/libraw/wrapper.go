package libraw

// #include <libraw/libraw.h>
// #cgo LDFLAGS: -lraw
import "C"

import (
	"errors"
	"fmt"
	"image"
	"unsafe"
)

type LibRaw struct {
	data *C.libraw_data_t
}

func Version() string {
	return C.GoString(C.libraw_version())
}

func Init(flags uint) (*LibRaw, error) {
	var libRaw LibRaw

	libRaw.data = C.libraw_init(C.uint(flags))
	if libRaw.data == nil {
		return nil, errors.New("Failed to initialize C.libraw_init")
	} else {
		return &libRaw, nil
	}
}
func (r *LibRaw) UnpackFunctionName() string {
	return C.GoString(C.libraw_unpack_function_name(r.data))
}

func (r *LibRaw) Progress() (out []string) {
	for i := uint(0); i != 32; i++ {
		mask := C.uint(1 << i)
		if r.data.progress_flags&mask != 0 {
			out = append(out,
				fmt.Sprintf("%d: %s", mask,
					C.GoString(C.libraw_strprogress(int32(mask)))))
		}
	}
	return
}

func (r *LibRaw) OpenFile(path string) error {
	cpath := C.CString(path)
	defer C.free(unsafe.Pointer(cpath))
	code, err := C.libraw_open_file(r.data, cpath)
	return errconv(code, err)
}

func (r *LibRaw) Unpack() error {
	r.data.params.use_camera_wb = 1;
	r.data.params.use_camera_matrix = 1;
	r.data.params.output_bps = 16;
	r.data.params.gamm[0] = 1.0;
	r.data.params.gamm[1] = 1.0;

	code, err := C.libraw_unpack(r.data)
	return errconv(code, err)
}
func (r *LibRaw) DcrawProcess() error {
	code, err := C.libraw_dcraw_process(r.data)
	return errconv(code, err)
}
func (r *LibRaw) DcrawMakeMemImage() (*procImageProxy, error) {
	var code C.int
	cProcessedImage, err := C.libraw_dcraw_make_mem_image(r.data, &code)
	if code != 0 || err != nil {
		return nil, errconv(code, err)
	}
	procImage, err := extractProccessedImage(cProcessedImage)
	return procImage, err
}

func (r *LibRaw) Params() Params {
	return extractParams(&r.data.idata)
}
func (r *LibRaw) ImageSizes() ImageSizes {
	return extractImageSizes(&r.data.sizes)
}
func (r *LibRaw) Image() image.Image {
	fmt.Printf("r.data.image: %#v\n", r.data.image)
	return extractImageProxy(r.ImageSizes(), r.data.image)
}

// TODO(johng): Expose libraw_imgother_t (iso level, aperature, etc).
// TODO(johng): Expose colordata_t.

func (r *LibRaw) Close() error {
	_, err := C.libraw_close(r.data)
	return err
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
		return errors.New(C.GoString(C.strerror(code)))
	} else if code > 0 {
		return errors.New(C.GoString(C.libraw_strerror(code)))
	}
	// code == LIBRAW_SUCCESS
	return nil
}
