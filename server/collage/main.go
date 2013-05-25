package main

import (
	"flag"
	"github.com/gorilla/mux"
	"image"
	"image/jpeg"
	"io/ioutil"
	"log"
	"net"
	"net/http"
	"os"
	"path"
)

type CollageServer struct {
	mux    *mux.Router
	photos map[string]*image.YCbCr
}

func NewCollageServer(assetsBase string) *CollageServer {
	s := &CollageServer{mux: mux.NewRouter(),
		photos: make(map[string]*image.YCbCr)}

	s.mux.PathPrefix("/").HandlerFunc(
		func(w http.ResponseWriter, r *http.Request) {
			fullPath := path.Join(assetsBase, r.URL.Path)
			log.Print("Static Asset ", fullPath)
			http.ServeFile(w, r, fullPath)
		})

	return s
}

func (s *CollageServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	log.Print("Request ", r.URL)
	s.mux.ServeHTTP(w, r)
}

func main() {
	assetsBase := flag.String("assets-base",
		"/home/johng/workspace/src/github.com/dademurphy/collage/client/app",
		"Path to client app assets directory")
	photoBase := flag.String("photo-base",
		"/home/johng/Pictures",
		"Path to photo assets directory")

	flag.Parse()
	collage := NewCollageServer(*assetsBase)
	log.Print("Serving from client app assets directory: ", *assetsBase)

	{
		log.Print("Looking at photos in ", *photoBase)
		photoList, err := ioutil.ReadDir(*photoBase)
		if err != nil {
			log.Fatal(err)
		}
		for _, photoInfo := range photoList {
			if photoInfo.IsDir() {
				continue
			}
			photoPath := path.Join(*photoBase, photoInfo.Name())
			if photoIn, err := os.Open(photoPath); err != nil {
				log.Fatal(err)
			} else if photo, err := jpeg.Decode(photoIn); err != nil {
				log.Fatal(err)
			} else {
				collage.photos[photoInfo.Name()] = photo.(*image.YCbCr)
				log.Print("Loaded photo ", photoInfo.Name())
			}
		}
	}

	ln, err := net.Listen("tcp", ":8080")
	if err != nil {
		log.Fatal(err)
	}

	s := &http.Server{Handler: collage}
	log.Fatal(s.Serve(ln))
}
