package main

import (
	"github.com/dademurphy/collage/server/dngsdk"
	"fmt"
)

func main() {
	host := dngsdk.NewHost()
	fmt.Println(host)
}
