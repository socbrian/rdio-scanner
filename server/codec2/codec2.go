package codec2

// #cgo LDFLAGS: -static -lm -lcodec2
/*
#include <inttypes.h>
#include <codec2/codec2.h>

typedef struct CODEC2 codec2_t;

*/
import "C"
import (
	"errors"
	"fmt"
	"unsafe"
)

var (
	ErrClosed = errors.New("voice stream not open")
)

const (
	Codec2Mode3200 uint8 = iota
	Codec2Mode2400
	Codec2Mode1600
	Codec2Mode1400
	Codec2Mode1300
	Codec2Mode1200
	Codec2Mode700
	Codec2Mode700B
)

type Codec2 struct {
	codec2          *C.codec2_t
	samplesPerFrame int
	bitsPerFrame    int
}

func NewCodec2(mode uint8) *Codec2 {
	vs := &Codec2{}
	vs.codec2 = C.codec2_create(C.int(mode))
	vs.samplesPerFrame = int(C.codec2_samples_per_frame(vs.codec2))
	vs.bitsPerFrame = int(C.codec2_bits_per_frame(vs.codec2))
	return vs
}

func (vs *Codec2) Close() error {
	if vs.codec2 == nil {
		return ErrClosed
	}

	C.codec2_destroy(vs.codec2)
	vs.codec2 = nil

	return nil
}

func (vs *Codec2) Decode(bits []byte) ([]uint16, error) {
	if len(bits) != vs.bitsPerFrame {
		return nil, fmt.Errorf("codec2 required %d bits per frame, got %d", vs.bitsPerFrame, len(bits))
	}
	var (
		u = make([]uint16, vs.samplesPerFrame)
	)
	C.codec2_decode(vs.codec2, (*C.short)(unsafe.Pointer(&u[0])), (*C.uchar)(unsafe.Pointer(&bits[0])))
	return u, nil
}

func (vs *Codec2) Encode(samples []int16) ([]byte, error) {
	if len(samples) != vs.samplesPerFrame {
		return nil, fmt.Errorf("codec2 required %d samples per frame, got %d", vs.samplesPerFrame, len(samples))
	}
	var (
		s    = samples
		bits = make([]byte, vs.bitsPerFrame/8)
	)
	C.codec2_encode(vs.codec2, (*C.uchar)(unsafe.Pointer(&bits[0])), (*C.short)(unsafe.Pointer(&s[0])))
	return bits, nil
}

func (vs *Codec2) BitsPerFrame() int {
	return int(C.codec2_bits_per_frame(vs.codec2))
}

func (vs *Codec2) SamplesPerFrame() int {
	return int(C.codec2_samples_per_frame(vs.codec2))
}

func (vs *Codec2) SetGray(gray bool) {
	grayInt := 0
	if gray {
		grayInt = 1
	}
	C.codec2_set_natural_or_gray(vs.codec2, C.int(grayInt))
}
