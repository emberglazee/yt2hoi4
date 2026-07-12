# yt2hoi4 v0.3.6

> This project is a proof of concept. Unless you have [yt-dlp](https://github.com/yt-dlp/yt-dlp), [FFmpeg](https://ffmpeg.org), and [Bun](https://bun.sh) installed and ready to go, you will probably be better off with an alternative project, like the [Music Mod Creation Tool for Paradox Interactive Games](https://runite-drill.github.io/music-mod-creation-tool)

Download a YouTube video or a playlist and generate a full Hearts of Iron 4 radio station (music) mod.

## Requirements

This project requires:

- Bun
- yt-dlp
- ffmpeg

And was tested on:

- Windows 11 24H2, build 26120
- Arch Linux (7.1.3-zen1-1-zen)
- Hearts of Iron IV v1.19.2.0

with:

- Bun v1.3.14
- yt-dlp v2026.07.04
- ffmpeg v8.1.2
- ImageMagick v7.1.2-26 Q16-HDRI

## Installation

> ImageMagick is optional, for the `--use-thumbnail` option (see [Usage](#usage))

(Windows) Manually install [yt-dlp](https://github.com/yt-dlp/yt-dlp?tab=readme-ov-file#installation), [FFmpeg](https://ffmpeg.org/download.html), [Bun](https://bun.sh), and [ImageMagick](https://imagemagick.org/script/download.php)

  * Or simply with [WinGet](https://learn.microsoft.com/en-us/windows/package-manager/winget): `winget install Oven-sh.Bun yt-dlp.yt-dlp ImageMagick.Q16-HDRI`

(Arch) `sudo pacman -Sy bun yt-dlp ffmpeg imagemagick`

```bash
# ! Ensure yt-dlp, ffmpeg, bun, and magick are in the PATH environment variable !
# If the following commands run, you're fine

$ yt-dlp --version
2026.07.04

$ ffmpeg -version
ffmpeg version n8.1.2 Copyright (c) 2000-2026 the FFmpeg developers
...

$ bun -v
1.3.14

$ magick --version
Version: ImageMagick 7.1.2-26 Q16-HDRI x86_64 702175ac4:20260621 https://imagemagick.org
...

# Clone the repository
$ git clone https://github.com/emberglazee/yt2hoi4
$ cd yt2hoi4

# Then install project dependencies
$ bun install
```

## Usage

```bash
# Basic usage
$ bun start --url <yt-dlp_compatible_link> --mod-name <mod-name>

# Automatically use the video/playlist thumbnail as the radio station faceplate (requires ImageMagick)
$ bun start --url <yt-dlp_compatible_link> --mod-name <mod-name> --use-thumbnail

# Pass extra yt-dlp args
$ bun start --url ... --mod-name ... --ytdlp-args --cookies-from-browser firefox --proxy socks5://localhost:1080 ...

# To clean up the `output` and `downloads` folders:
$ bun cleanup

# Update yt2hoi4:
$ git pull
# Update the dependencies:
$ bun install
```

## Screenshot

![screenshot](https://github.com/user-attachments/assets/e26f222a-966c-435c-a41b-cf78787fb7ed)

## Steam Workshop examples

- [Bo's HoI4 MP In A Nutshell - The Podcast](https://steamcommunity.com/sharedfiles/filedetails/?id=3529621862) - 391 YouTube videos with a combined length of 58.5 hours in a single radio station

- [Project Wingman: Frontline-59 OST Music Mod](https://steamcommunity.com/sharedfiles/filedetails/?id=3488744542)

## Why?

i was bored
