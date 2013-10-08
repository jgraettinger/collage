package main

import (
	"fmt"
	"image"
	"image/png"
	"os"
	"path/filepath"

	"github.com/dademurphy/collage/server/ingest"
	"github.com/dademurphy/collage/server/model"
)

func main() {
	fmt.Println("Linked against libraw version:", ingest.LibRawVersion())

	testFile := "/home/johng/workspace/L1004220.DNG"
	//outputFile := "/home/johng/workspace/src/github.com/dademurphy/collage/client/app/images/foobar.png"
	baseDirectory := "/home/johng/workspace/src/github.com/dademurphy/collage/client/app/images/tiles"

	var err error
	var context *ingest.Context
	var render *image.RGBA64

	if context, err = ingest.NewContext(testFile); err != nil {
		fmt.Println("ingest.NewContext:: ", err)
		return
	}
	fmt.Printf("%#v\n", *context.Exif())

	if render, err = context.ProduceLinearizedImage(); err != nil {
		fmt.Println("ingest.ProduceLinearizedImage: ", err)
		return
	}
	fmt.Println("finished linearization")

	photo := model.Photo{Id: "foozing",
		Width: uint(render.Rect.Max.X), Height: uint(render.Rect.Max.Y)}
	rootTile := model.RootTile(&photo)

	tileCallback := func(tile model.Tile, high *image.RGBA, low *image.RGBA) {
		path := filepath.Join(baseDirectory,
			fmt.Sprintf("%v-%v-%v-%v", tile.Photo.Id,
				tile.Level, tile.WIndex, tile.HIndex))

		if file, err := os.Create(path + "-high.png"); err != nil {
			fmt.Println("Failed to open output file: ", err)
			return
		} else if err = png.Encode(file, high); err != nil {
			fmt.Println("Failed to encode PNG: ", err)
			return
		}
		if file, err := os.Create(path + "-low.png"); err != nil {
			fmt.Println("Failed to open output file: ", err)
			return
		} else if err = png.Encode(file, low); err != nil {
			fmt.Println("Failed to encode PNG: ", err)
			return
		}
		fmt.Println("Finished tile", path)
	}

	tiler := ingest.TileImageBuilder{Full: render, Callback: tileCallback}
	tiler.BuildTree(rootTile)

	fmt.Println("Done!")
}

/*
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
	* /
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
	* /

	fmt.Println("Done.")
}
*/
