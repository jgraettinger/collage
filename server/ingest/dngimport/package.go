package dngimport

/*
#cgo LDFLAGS: /home/johng/workspace/src/dng_sdk/dng_sdk_1_3/libdngsdk.a
#cgo LDFLAGS: /home/johng/workspace/src/dng_sdk/XMP-Toolkit-SDK-CC201306/public/libraries/i80386linux_x64/release/staticXMPCore.ar
#cgo LDFLAGS: /home/johng/workspace/src/dng_sdk/XMP-Toolkit-SDK-CC201306/public/libraries/i80386linux_x64/release/staticXMPFiles.ar

#include <stdlib.h>
#include "dng_import.h"
*/
import "C"

import (
	"fmt"
	"unsafe"
	"image"
	"image/png"
	"os"

	"github.com/dademurphy/collage/server/model"
)

func init() {
	C.initialize_sdk()
}

type Exif struct {
	DateTime          string
	DateTimeDigitized string
	DateTimeOriginal  string
	ImageUniqueID     []byte
	Make              string
	Model             string
	PixelXDimension   uint32
	PixelYDimension   uint32

	/*
		type Fractional struct {
			Numerator int
			Denominator int
		}
		ExposureTime Fractional
		FNumber Fractional
		ShutterSpeedValue Fractional
		ApertureValue Fractional
		BrightnessValue Fractional
		ExposureBiasValue Fractional
		MaxApertureValue Fractional
		FocalLength Franctional

		BatteryLevelA string

		ExposureProgram uint32
		MeteringMode uint32
		LightSource uint32
		Flash uint32
		FlashMask uint32
		SensingMethod uint32
		ColorSpace uint32
	*/
}

type Ifd struct {
	XResolution int
	YResolution int
	ImageWidth  int
	ImageLength int
}

func Bar() {
	cpath := C.CString("/home/johng/workspace/L1004220.DNG")
	defer C.free(unsafe.Pointer(cpath))
	context := C.create_context(cpath)

	var exif Exif
	C.extract_exif(context, unsafe.Pointer(&exif))
	fmt.Printf("%#v\n", exif)

	var ifd Ifd
	C.extract_ifd(context, unsafe.Pointer(&ifd), C.ifd_count(context)-1)
	fmt.Printf("%#v\n", ifd)

	image := C.produce_linearized_image(context)
	fmt.Println("Produced linearized image.")

	splitTiles(image,
		"/home/johng/workspace/src/github.com/dademurphy/collage/client/app/images/tiles/foobaz")

	C.destroy_image(image)
	fmt.Println("Destroyed image.")

	C.destroy_context(context)
	fmt.Println("Destroyed context.")
}

func splitTiles(img *C.image, basePath string) {
	photo := &model.Photo{"foobar", uint(C.image_width(img)), uint(C.image_height(img))}
	fmt.Printf("Photo: %#v\n", *photo)

	type tileStackEntry struct {
		tile     model.Tile
		children []model.Tile
	}

	accumulatorStack := C.create_accumulator_stack(C.uint(model.TileSize))

	root := model.NewRootTile(photo)
	tileStack := append([]*tileStackEntry{},
		&tileStackEntry{tile: root, children: root.Children()})
	C.push_accumulator(accumulatorStack,
		C.uint(root.Level), C.uint(root.WBegin()), C.uint(root.HBegin()))

	tileRect := image.Rect(0, 0, int(model.TileSize), int(model.TileSize))
	outputHigh, outputLow := image.NewNRGBA(tileRect), image.NewNRGBA(tileRect)

	for len(tileStack) != 0 {
		tail := tileStack[len(tileStack)-1]

		fmt.Printf("Examining %v: (%v, %v, %v, %v)@%v\n", tail.tile,
			tail.tile.WBegin(),
			tail.tile.HBegin(),
			tail.tile.WEnd(),
			tail.tile.HEnd(),
			tail.tile.Level)

		if tail.tile.Level == 0 {
			C.accumulate(accumulatorStack, img,
				C.uint(tail.tile.WBegin()), C.uint(tail.tile.WEnd()),
				C.uint(tail.tile.HBegin()), C.uint(tail.tile.HEnd()))
		}
		// Iteratively write and pop completed tiles off of the stack,
		// until the next child tile to visit is identified.
		for {
			if len(tail.children) != 0 {
				// Push the next child to visit onto the stack.
				child := tail.children[0]
				tail.children = tail.children[1:]

				fmt.Println("Pushing new child", child)

				tileStack = append(tileStack,
					&tileStackEntry{tile: child, children: child.Children()})
				C.push_accumulator(accumulatorStack,
					C.uint(child.Level), C.uint(child.WBegin()), C.uint(child.HBegin()))
				break
			} else {
				// This tile is complete. Write to disk and pop the stack,
				// but continue looking upstack for completed tiles.
				tileStack = tileStack[:len(tileStack)-1]
				C.pop_accumulator(accumulatorStack,
					(*C.uchar)(unsafe.Pointer(&outputHigh.Pix[0])),
					(*C.uchar)(unsafe.Pointer(&outputLow.Pix[0])))

				writeTileImage(tail.tile, outputHigh,
					fmt.Sprintf("%v-%v-%v-%v-high.png", basePath,
						tail.tile.Level, tail.tile.WIndex, tail.tile.HIndex))
				writeTileImage(tail.tile, outputLow,
					fmt.Sprintf("%v-%v-%v-%v-low.png", basePath,
						tail.tile.Level, tail.tile.WIndex, tail.tile.HIndex))

				if len(tileStack) != 0 {
					tail = tileStack[len(tileStack)-1]
					continue
				} else {
					break
				}
			}
		}

	}
	C.destroy_accumulator_stack(accumulatorStack)
}

func writeTileImage(tile model.Tile, img *image.NRGBA, path string) error {
	img = img.SubImage(image.Rect(0, 0,
		int(tile.WSpan()>>tile.Level),
		int(tile.HSpan()>>tile.Level))).(*image.NRGBA)

	if file, err := os.Create(path); err != nil {
		return err
	} else if err = png.Encode(file, img); err != nil {
		return err
	}
	return nil
}

//export loadExif
func loadExif(exifPtr unsafe.Pointer,
	dateTime *C.char,
	dateTimeDigitized *C.char,
	dateTimeOriginal *C.char,
	imageUniqueId unsafe.Pointer,
	make *C.char,
	model *C.char,
	pixelXDimension uint32,
	pixelYDimension uint32) {
	exif := (*Exif)(exifPtr)

	exif.DateTime = C.GoString(dateTime)
	exif.DateTimeDigitized = C.GoString(dateTimeDigitized)
	exif.DateTimeOriginal = C.GoString(dateTimeOriginal)
	exif.ImageUniqueID = C.GoBytes(imageUniqueId, 16)
	exif.Make = C.GoString(make)
	exif.Model = C.GoString(model)
	exif.PixelXDimension = pixelXDimension
	exif.PixelYDimension = pixelYDimension
}

//export loadIfd
func loadIfd(ifdPtr unsafe.Pointer,
	xResolution int,
	yResolution int,
	imageWidth int,
	imageLength int) {
	ifd := (*Ifd)(ifdPtr)

	ifd.XResolution = xResolution
	ifd.YResolution = yResolution
	ifd.ImageWidth = imageWidth
	ifd.ImageLength = imageLength
}
