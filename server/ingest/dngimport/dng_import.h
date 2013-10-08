#ifndef DNG_IMPORT_H
#define DNG_IMPORT_H

void initialize_sdk();
void terminate_sdk();

typedef struct context context;
context* create_context(char* path);
void destroy_context(context*);

int extract_exif(context*, void*);
uint ifd_count(context*);
int extract_ifd(context*, void*, uint index);

typedef struct image image;
image* produce_linearized_image(context*);

uint image_width(image*);
uint image_height(image*);

void destroy_image(image*);

typedef struct accumulator_stack accumulator_stack;
accumulator_stack* create_accumulator_stack(uint tile_size);

void destroy_accumulator_stack(accumulator_stack*);

void push_accumulator(accumulator_stack*,
		uint level, uint wbegin, uint hbegin);

void pop_accumulator(accumulator_stack*, unsigned char*, unsigned char*);

void accumulate(accumulator_stack*, image*,
		uint wbegin, uint wend, uint hbegin, uint hend);

#endif
