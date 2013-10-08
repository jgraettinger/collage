extern "C" {
#include "_cgo_export.h"
}

#if defined __GNUC__
	#define qLinux 1
	#define qWinOS 0
	#define qMacOS 0
	#if __BYTE_ORDER__ == __ORDER_LITTLE_ENDIAN__
		#define qDNGLittleEndian 1
		#define qDNGBigEndian 0
	#else
		#define qDNGLittleEndian 0
		#define qDNGBigEndian 1
	#endif
#endif

#include "dng_color_space.h"
#include "dng_date_time.h"
#include "dng_exceptions.h"
#include "dng_file_stream.h"
#include "dng_globals.h"
#include "dng_host.h"
#include "dng_ifd.h"
#include "dng_image_writer.h"
#include "dng_info.h"
#include "dng_linearization_info.h"
#include "dng_mosaic_info.h"
#include "dng_negative.h"
#include "dng_preview.h"
#include "dng_render.h"
#include "dng_simple_image.h"
#include "dng_tag_codes.h"
#include "dng_tag_types.h"
#include "dng_tag_values.h"
#include "dng_xmp.h"
#include "dng_xmp_sdk.h"

#include <iostream>
#include <memory>

void initialize_sdk() {
	dng_xmp_sdk::InitializeSDK();
}
void terminate_sdk() {
	dng_xmp_sdk::TerminateSDK();
}

struct context {
	dng_host host;
	std::auto_ptr<dng_file_stream> stream;
	dng_info info;
	std::auto_ptr<dng_negative> negative;
};

context* create_context(char* path) {
	std::auto_ptr<context> ctx(new context());

	ctx->stream.reset(new dng_file_stream(path));
	ctx->info.Parse(ctx->host, *ctx->stream);
	ctx->info.PostParse(ctx->host);

	if (!ctx->info.IsValidDNG()) {
		std::cout << "Not a valid DNG" << std::endl;
		return 0;
	} else {
		std::cout << "Valid DNG" << std::endl;
		return ctx.release();
	}
}

void destroy_context(context* ctx) {
	delete ctx;
}

int extract_exif(context* ctx, void* exif_golang) {
	const dng_exif& exif = *ctx->info.fExif;

	// Call back into go with extracted fields.
	loadExif(exif_golang,
			(char*)exif.fDateTime.Encode_ISO_8601().Get(),
			(char*)exif.fDateTimeDigitized.Encode_ISO_8601().Get(),
			(char*)exif.fDateTimeOriginal.Encode_ISO_8601().Get(),
			(void*)exif.fImageUniqueID.data,
			(char*)exif.fMake.Get(),
			(char*)exif.fModel.Get(),
			exif.fPixelXDimension,
			exif.fPixelYDimension);
	return 0;
}

uint ifd_count(context* ctx) {
	return ctx->info.fIFDCount;
}

int extract_ifd(context* ctx, void* ifd_golang, uint ifd_index) {
	const dng_ifd& ifd = *ctx->info.fIFD[ifd_index];

	loadIfd(ifd_golang,
			ifd.fXResolution,
			ifd.fYResolution,
			ifd.fImageWidth,
			ifd.fImageLength);
	return 0;
}

struct image {
	std::auto_ptr<dng_image> image;
	dng_pixel_buffer buffer;
};

image* produce_linearized_image(context* ctx) {
	std::auto_ptr<dng_negative> negative(ctx->host.Make_dng_negative());
	negative->Parse(ctx->host, *ctx->stream, ctx->info);
	negative->PostParse(ctx->host, *ctx->stream, ctx->info);

	// Build stage 1 image.
	negative->ReadStage1Image(ctx->host, *ctx->stream, ctx->info);
	negative->ValidateRawImageDigest(ctx->host);
	negative->SynchronizeMetadata();

	// Build stage 2 image.
	negative->BuildStage2Image(ctx->host, ttShort /*ttFloat*/);
	// Clear the stage 1 image.
	AutoPtr<dng_image> empty;
	negative->SetStage1Image(empty);

	// Mosaic plane is almost always 0, except for some cameras with multiple
	// sensor types at different response levels.
	negative->BuildStage3Image(ctx->host, 0);
	// Clear the stage 2 image.
	negative->SetStage2Image(empty);

	// TODO: output in linearized RGB space.
	dng_render renderer(ctx->host, *negative);
	renderer.SetFinalSpace(dng_space_sRGB::Get());
	renderer.SetFinalPixelType(ttShort);

	std::auto_ptr<image> img(new image());
	img->image.reset(renderer.Render());

	// Clear the stage 3 image.
	negative->SetStage3Image(empty);

	dng_simple_image* simple_image =
		dynamic_cast<dng_simple_image*>(img->image.get());
	if (!simple_image) {
		std::cerr << "Rendered image isn't a dng_simple_image" << std::endl;
		return 0;
	}
	// Verify assumptions about buffer data layout.
	simple_image->GetPixelBuffer(img->buffer);
	if (img->buffer.fPlanes != 3) {
		std::cerr << "buffer.fPlanes != 3: " << img->buffer.fPlanes << std::endl;
		return 0;
	}
	if (img->buffer.fPixelSize != 2) {
		std::cerr << "buffer.fPixelSize != 2: " << img->buffer.fPixelSize << std::endl;
		return 0;
	}
	if (img->buffer.fPlane != 0) {
		std::cerr << "buffer.fPlane != 0: " << img->buffer.fPlane << std::endl;
		return 0;
	}
	return img.release();
}

uint image_width(image* img) {
	return img->image->Width();
}
uint image_height(image* img) {
	return img->image->Height();
}

void destroy_image(image* img) {
	delete img;
}

struct accumulator_sample {
	uint32 r;
	uint32 g;
	uint32 b;
};

struct accumulator {
	uint level;
	uint wbegin;
	uint hbegin;
	std::vector<accumulator_sample> samples;
};

struct accumulator_stack {
	uint tile_size;
	std::vector<accumulator> stack;
	typedef std::vector<accumulator>::iterator iterator;
};

accumulator_stack* create_accumulator_stack(uint tile_size) {
	std::auto_ptr<accumulator_stack> stack(new accumulator_stack());
	stack->tile_size = tile_size;
	return stack.release();
}
void destroy_accumulator_stack(accumulator_stack* stack) {
	delete stack;
}

void push_accumulator(accumulator_stack* stack,
		uint level, uint wbegin, uint hbegin) {
	stack->stack.push_back(accumulator());

	stack->stack.back().level = level;
	stack->stack.back().wbegin = wbegin;
	stack->stack.back().hbegin = hbegin;
	stack->stack.back().samples.resize(stack->tile_size * stack->tile_size);
}

void pop_accumulator(accumulator_stack* stack, uint8_t* outHigh, uint8_t* outLow) {
	accumulator& accum = stack->stack.back();
	const std::vector<accumulator_sample>& samples(accum.samples);

	for(size_t i = 0; i != samples.size(); ++i) {
		uint8_t* h = outHigh + i * 4;
		uint8_t* l = outLow + i * 4;
		const accumulator_sample& sample(samples[i]);

		//std::cout << i << ": " << sample.r << " " << sample.g << " " << sample.b << std::endl;

		h[0] = uint8_t(sample.r >> (2 * accum.level + 8));
		l[0] = uint8_t(sample.r >> (2 * accum.level));
		h[1] = uint8_t(sample.g >> (2 * accum.level + 8));
		l[1] = uint8_t(sample.g >> (2 * accum.level));
		h[2] = uint8_t(sample.b >> (2 * accum.level + 8));
		l[2] = uint8_t(sample.b >> (2 * accum.level));
		h[3] = 0xff;
		l[3] = 0xff;

		//std::cout << " " << int(h[0]) << " " << int(h[1]) << " " << int(h[2]) << " " << int(h[3]) << std::endl;
	}
	stack->stack.pop_back();
}

void accumulate(accumulator_stack* stack_wrapper, image* img,
		uint wbegin, uint wend, uint hbegin, uint hend) {
	std::vector<accumulator>& stack(stack_wrapper->stack);
	uint tile_size = stack_wrapper->tile_size;

	const dng_pixel_buffer& buffer = img->buffer;
	uint16* data = (uint16*)(img->buffer.fData);

	for (uint h = hbegin; h != hend; ++h) {
		for (uint w = wbegin; w != wend; ++w) {
			const uint16* samples = data + buffer.fRowStep * h + buffer.fColStep * w;

			//std::cout << w << "x" << h << ": " << samples[0] << " " << samples[1] << " " << samples[2] << std::endl;

			for (accumulator_stack::iterator it = stack.begin();
					it != stack.end(); ++it) {
				uint tw = (w - it->wbegin) >> it->level;
				uint th = (h - it->hbegin) >> it->level;

				accumulator_sample& accum(it->samples[th * tile_size + tw]);
				accum.r += samples[0];
				accum.g += samples[1];
				accum.b += samples[2];
			}
		}
	}
}
