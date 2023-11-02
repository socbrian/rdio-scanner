import { Injectable, OnDestroy } from '@angular/core';
import { WASI, File, OpenFile } from "@bjorn3/browser_wasi_shim";

type Codec2CreateFunc = (mode: number) => number;
type Codec2DestroyFunc = (codec2: number) => void;
type Codec2SamplesPerFrameFunc = (codec2: number) => number;
type Codec2SetNaturalOrGrayFunc = (codec2: number, natural_or_gray: number) => void;
type Codec2BitsPerFrameFunc = (codec2: number) => number;
type Codec2DecodeFunc = (codec2: number, out: Uint16Array, data: Uint8Array) => void;

@Injectable()
export class Codec2Service implements OnDestroy {
    private wasi: WASI;
    private instance: WebAssembly.Instance | null = null;
    private codec2: number | null = null;

    private codec2_create: Codec2CreateFunc | null = null;
    private codec2_destroy: Codec2DestroyFunc | null = null;
    private codec2_samples_per_frame: Codec2SamplesPerFrameFunc | null = null;
    private codec2_set_natural_or_gray: Codec2SetNaturalOrGrayFunc | null = null;
    private codec2_bits_per_frame: Codec2BitsPerFrameFunc | null = null;
    private codec2_decode: Codec2DecodeFunc | null = null;

    constructor() {
        this.wasi = new WASI([], [], [
            new OpenFile(new File([])), // stdin
            new OpenFile(new File([])), // stdout
            new OpenFile(new File([])), // stderr
        ]);

        const importObject = {
            env: {
                memory: new WebAssembly.Memory({ initial: 4 }),
            },
            wasi_snapshot_preview1: this.wasi.wasiImport,
        };
        fetch('libcodec2.so').then(
            (response) => response.arrayBuffer()
        ).then(
            (bytes) => WebAssembly.instantiate(bytes, importObject)
        ).then(
            (results) => {
                this.instance = results.instance
                this.codec2_create = this.instance.exports["codec2_create"] as Codec2CreateFunc;
                this.codec2_samples_per_frame = this.instance.exports["codec2_samples_per_frame"] as Codec2SamplesPerFrameFunc;
                this.codec2_set_natural_or_gray = this.instance.exports["codec2_set_natural_or_gray"] as Codec2SetNaturalOrGrayFunc;
                this.codec2_destroy = this.instance.exports["codec2_destroy"] as Codec2DestroyFunc;
                this.codec2_bits_per_frame = this.instance.exports["codec2_bits_per_frame"] as Codec2BitsPerFrameFunc;
                this.codec2_decode = this.instance.exports["codec2_decode"] as Codec2DecodeFunc;

                this.codec2 = this.codec2_create(0); // CODEC2_MODE_3200
                this.codec2_set_natural_or_gray(this.codec2, 1);
                const nSamples = this.codec2_samples_per_frame(this.codec2);
                console.log(nSamples);
            }
        );
        
    }

    decode(data: Uint8Array): Uint16Array {
        if (this.codec2 && this.codec2_samples_per_frame && this.codec2_bits_per_frame && this.codec2_decode) {
            const numFrames = Math.ceil(data.length / this.codec2_bits_per_frame(this.codec2));
            const out = new Uint16Array(this.codec2_samples_per_frame(this.codec2)*numFrames)

            for (let i=0; i<numFrames; i++) {
                const nBits = this.codec2_bits_per_frame(this.codec2);
                const frame = new Uint8Array(nBits)
                for (let i=0; i<nBits; i++) {
                    frame[i] = data[i];
                }
                this.codec2_decode(
                    this.codec2,
                    out.subarray(i*this.codec2_samples_per_frame(this.codec2), (i+1)*this.codec2_samples_per_frame(this.codec2)),
                    frame);
            }
            console.log(out);
            return out;
        }
        return new Uint16Array(0);
    }

    ngOnDestroy(): void {
        if (this.codec2 && this.codec2_destroy)
            this.codec2_destroy(this.codec2);
    }

}
