import { Injectable, OnDestroy } from '@angular/core';
import { WASI, File, OpenFile } from "@bjorn3/browser_wasi_shim";

type Codec2CreateFunc = (mode: number) => number;
type Codec2DestroyFunc = (codec2: number) => void;
type Codec2SamplesPerFrameFunc = (codec2: number) => number;
type Codec2SetNaturalOrGrayFunc = (codec2: number, natural_or_gray: number) => void;
type Codec2BitsPerFrameFunc = (codec2: number) => number;
type Codec2DecodeFunc = (codec2: number, out: number, data: number) => void;

@Injectable()
export class Codec2Service implements OnDestroy {
    private wasi: WASI;
    private instance: WebAssembly.Instance | null = null;
    private codec2: number | null = null;
    private memory: WebAssembly.Memory | null = null;

    private codec2_create: Codec2CreateFunc | null = null;
    private codec2_destroy: Codec2DestroyFunc | null = null;
    private codec2_samples_per_frame: Codec2SamplesPerFrameFunc | null = null;
    private codec2_set_natural_or_gray: Codec2SetNaturalOrGrayFunc | null = null;
    private codec2_bits_per_frame: Codec2BitsPerFrameFunc | null = null;
    private codec2_decode: Codec2DecodeFunc | null = null;

    constructor() {
        console.log("Codec2Service constructor");
        this.wasi = new WASI([], [], [
            new OpenFile(new File([])), // stdin
            new OpenFile(new File([])), // stdout
            new OpenFile(new File([])), // stderr
        ]);

        const importObject = {
            wasi_snapshot_preview1: this.wasi.wasiImport,
        };
        fetch('libcodec2.so').then(
            (response) => response.arrayBuffer()
        ).then(
            (bytes) => WebAssembly.instantiate(bytes, importObject)
        ).then(
            (results) => {
                this.instance = results.instance
                this.memory = this.instance.exports["memory"] as WebAssembly.Memory;
                this.wasi.start(this.instance as {
                    exports: {
                        memory: WebAssembly.Memory;
                        _start: () => void;
                    };
                });

                this.codec2_create = this.instance.exports["codec2_create"] as Codec2CreateFunc;
                this.codec2_samples_per_frame = this.instance.exports["codec2_samples_per_frame"] as Codec2SamplesPerFrameFunc;
                this.codec2_set_natural_or_gray = this.instance.exports["codec2_set_natural_or_gray"] as Codec2SetNaturalOrGrayFunc;
                this.codec2_destroy = this.instance.exports["codec2_destroy"] as Codec2DestroyFunc;
                this.codec2_bits_per_frame = this.instance.exports["codec2_bits_per_frame"] as Codec2BitsPerFrameFunc;
                this.codec2_decode = this.instance.exports["codec2_decode"] as Codec2DecodeFunc;

                this.codec2 = this.codec2_create(0); // CODEC2_MODE_3200
                this.codec2_set_natural_or_gray(this.codec2, 1);

                console.log("Codec2Service constructed");
            }
        );
    }

    decode(data: Uint8Array): Int16Array {
        if (!this.memory || !this.codec2 || !this.codec2_decode || !this.codec2_samples_per_frame || !this.codec2_bits_per_frame) {
            console.log(`Codec2 not initialized: memory=${this.memory} codec2=${this.codec2} codec2_decode=${this.codec2_decode} codec2_samples_per_frame=${this.codec2_samples_per_frame} codec2_bits_per_frame=${this.codec2_bits_per_frame}`);
            return new Int16Array(0);
        }

        const bitsPerFrame = this.codec2_bits_per_frame(this.codec2)/8;
        const samplesPerFrame = this.codec2_samples_per_frame(this.codec2);
        const numFrames = Math.ceil(data.length / bitsPerFrame);
        const out = new Int16Array(numFrames * samplesPerFrame);

        for (let i=0; i<numFrames; i++) {
            let offset = 0;
            const voice = new Int16Array(this.memory.buffer, offset, samplesPerFrame);
            offset += samplesPerFrame * Int16Array.BYTES_PER_ELEMENT
            const frame = new Uint8Array(this.memory.buffer, offset, bitsPerFrame);

            for (let j=0; j<bitsPerFrame; j++) {
                const index = i*bitsPerFrame + j;
                if (index >= data.length)
                    frame[j] = 0;
                else
                    frame[j] = data[index];
            }

            this.codec2_decode(
                this.codec2,
                voice.byteOffset,
                frame.byteOffset);

            // add voice to out
            for (let j=0; j<voice.length; j++) {
                out[i*samplesPerFrame + j] = voice[j];
            }
        }

        return out;
    }

    ngOnDestroy(): void {
        if (this.codec2 && this.codec2_destroy)
            this.codec2_destroy(this.codec2);
    }

}
