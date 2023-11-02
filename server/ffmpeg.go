// Copyright (C) 2019-2022 Chrystian Huot <chrystian.huot@saubeo.solutions>
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>

package main

import (
	"bytes"
	"errors"
	"fmt"
	"math"
	"os/exec"
	"path"
	"rdio-scanner/server/codec2"
	"regexp"
	"strconv"
	"strings"
)

type FFMpeg struct {
	available bool
	version43 bool
	warned    bool
}

func NewFFMpeg() *FFMpeg {
	ffmpeg := &FFMpeg{}

	stdout := bytes.NewBuffer([]byte(nil))

	cmd := exec.Command("ffmpeg", "-version")
	cmd.Stdout = stdout

	if err := cmd.Run(); err == nil {
		ffmpeg.available = true

		if l, err := stdout.ReadString('\n'); err == nil {
			s := regexp.MustCompile(`.*ffmpeg version .{0,1}([0-9])\.([0-9])\.[0-9].*`).ReplaceAllString(strings.TrimSuffix(l, "\n"), "$1.$2")
			v := strings.Split(s, ".")
			if len(v) > 1 {
				if major, err := strconv.Atoi(v[0]); err == nil {
					if minor, err := strconv.Atoi(v[1]); err == nil {
						if major > 4 || (major == 4 && minor >= 3) {
							ffmpeg.version43 = true
						}
					}
				}
			}
		}
	}

	return ffmpeg
}

func (ffmpeg *FFMpeg) Convert(call *Call, systems *Systems, tags *Tags, mode uint) error {
	var (
		args = []string{"-i", "-"}
		err  error
	)

	if mode == AUDIO_CONVERSION_DISABLED {
		return nil
	}

	if !ffmpeg.available {
		if !ffmpeg.warned {
			ffmpeg.warned = true

			return errors.New("ffmpeg is not available, no audio conversion will be performed")
		}
		return nil
	}

	if ffmpeg.version43 {
		if mode == AUDIO_CONVERSION_ENABLED_NORM {
			args = append(args, "-af", "apad=whole_dur=3s,loudnorm")
		} else if mode == AUDIO_CONVERSION_ENABLED_LOUD_NORM {
			args = append(args, "-af", "apad=whole_dur=3s,loudnorm=I=-16:TP=-1.5:LRA=11")
		}
	}

	args = append(args, "-f", "s16le", "-ac", "1", "-ar", "8k", "-")

	cmd := exec.Command("ffmpeg", args...)
	cmd.Stdin = bytes.NewReader(call.Audio)

	stdout := bytes.NewBuffer([]byte(nil))
	cmd.Stdout = stdout

	stderr := bytes.NewBuffer([]byte(nil))
	cmd.Stderr = stderr

	if err = cmd.Run(); err == nil {
		codec := codec2.NewCodec2(codec2.Codec2Mode3200)
		defer codec.Close()
		codec.SetGray(true)

		nsam := codec.SamplesPerFrame()
		nbits := codec.BitsPerFrame() / 8

		numFrames := int(math.Ceil(float64(len(stdout.Bytes())) / 2 / float64(nsam)))

		encoded := make([]byte, numFrames*nbits)
		for i := 0; i < numFrames; i += 1 {
			voice := make([]int16, nsam)
			for j := 0; j < nsam; j += 1 {
				index := i*nsam + j
				if index < len(stdout.Bytes())/2 {
					voice[j] = int16(stdout.Bytes()[index*2]) | int16(stdout.Bytes()[index*2+1])<<8
				}
			}
			bits, err := codec.Encode(voice)
			if err != nil {
				return err
			}
			for j := 0; j < nbits; j += 1 {
				index := i*nbits + j
				if index < len(encoded) {
					encoded[index] = bits[j]
				}
			}
		}

		call.Audio = encoded
		call.AudioType = "audio/codec2"

		switch v := call.AudioName.(type) {
		case string:
			call.AudioName = fmt.Sprintf("%v.c2", strings.TrimSuffix(v, path.Ext((v))))
		}

	} else {
		fmt.Println(stderr.String())
	}

	return nil
}
