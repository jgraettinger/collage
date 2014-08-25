package model

import (
	"time"
)

type Exif struct {
	DateTime          time.Time
	Make              string
	Model             string

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

