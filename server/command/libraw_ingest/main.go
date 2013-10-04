package main

import (
	"fmt"
	"image"
	//"image/png"
	//"os"

	"github.com/dademurphy/collage/server/ingest"
	"github.com/dademurphy/collage/server/libraw"
)

type SubImager interface {
	SubImage(image.Rectangle) image.Image
}

func main() {
	fmt.Println("Linked against libraw version:", libraw.Version())

	var raw *libraw.LibRaw
	var err error

	if raw, err = libraw.Init(0); err != nil {
		fmt.Println("On open: ", err)
		return
	}
	defer func() {
		if err = raw.Close(); err != nil {
			fmt.Println("On close: ", err)
			return
		}
	}()

	fmt.Printf("Progress: %#v\n", raw.Progress())

	/*
		if err = raw.OpenFile(
			"/home/johng/workspace/RAW_HASSELBLAD_H3D39II.3FR"); err != nil {
			fmt.Println("On OpenFile: ", err)
			return
		}
	*/
	if err = raw.OpenFile(
		"/home/johng/workspace/L1004220.DNG"); err != nil {
		fmt.Println("On OpenFile: ", err)
		return
	}

	fmt.Printf("Progress: %#v\n", raw.Progress())

	fmt.Printf("Params: %#v\n", raw.Params())
	fmt.Printf("ImageSizes: %#v\n", raw.ImageSizes())
	fmt.Println("Unpacker: ", raw.UnpackFunctionName())

	if err = raw.Unpack(); err != nil {
		fmt.Println("On unpack: ", err)
		return
	}
	fmt.Printf("Progress: %#v\n", raw.Progress())

	if err = raw.DcrawProcess(); err != nil {
		fmt.Println("On dcraw_process: ", err)
		return
	}
	fmt.Printf("Progress: %#v\n", raw.Progress())

	var img image.Image
	if img, err = raw.DcrawMakeMemImage(); err != nil {
		fmt.Println("On dcraw_make_mem_image: ", err)
		return
	}
	fmt.Printf("Progress: %#v\n", raw.Progress())

	var tileSplitter ingest.TileSplitter
	tileSplitter.BaseDirectory =
		"/home/johng/workspace/src/github.com/dademurphy/collage/client/app/images/tiles"

	if err = tileSplitter.SplitTiles("foobar", img); err != nil {
		fmt.Println("On SplitTiles: ", err)
	}

	/*
	var tileMerger ingest.TileMerger
	tileMerger.BaseDirectory = 
		"/home/johng/workspace/src/github.com/dademurphy/collage/client/app/images/tiles"
	tileMerger.TileShift = 8
	*/

	/*
		subImager := img.(SubImager)
		sub := subImager.SubImage(image.Rect(0, 1024, 1024, 2048))

		if file, err := os.Create("/home/johng/workspace/src/github.com/dademurphy/collage/client/app/images/foobar.png"); err != nil {
			fmt.Println("Failed to open output file: ", err)
			return
		} else if err = png.Encode(file, sub); err != nil {
			fmt.Println("Failed to encode PNG: ", err)
			return
		}
	*/

	fmt.Println("Done.")
}
