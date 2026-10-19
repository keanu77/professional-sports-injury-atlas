# Third-party and media notices

The repository's MIT grant covers original software, as defined in [LICENSE-SCOPE.md](LICENSE-SCOPE.md). The following materials retain their original rights and conditions.

## Videos and thumbnails

The site embeds or links to videos delivered by their original platforms, including YouTube and MLB. It does not distribute the original video files. Event pages identify the publisher, video URL, and supporting sources. Those references and an embeddable player are not a license to copy the recording.

Current video covers use provider thumbnails. Thumbnail URLs and their derivation are checked by `scripts/verify-video-thumbnails.ts`; ownership remains with the relevant rights holders. Their presence is not an endorsement of this project.

## Historical photographs

Photograph registries are stored in `src/assets/players/player-photo-registry.v*.json`. They retain source pages, author attribution, license information, and applicable transformation records. Consult the exact asset's record and original source before reuse. A Creative Commons license on a photograph does not license the associated broadcast video, trademarks, or personality rights.

The site's [credits and notices page](https://injury.sportsmedicine.tw/credits-notices/) explains the public presentation. Historical source files remain in the repository for provenance; their existence does not mean they are currently displayed as video covers.

## Generated artwork

The current homepage artwork has a provenance record at `src/assets/hero/provenance.json`. Other illustration records live in `src/assets/heroes/provenance.json`, `src/assets/heroes/provenance/`, and `src/assets/videos/provenance.json`. These are separate asset records and are not included in the code's MIT grant. Generated illustrations are not documentary images of the athletes or injury events.

## Fonts and dependencies

Inter, Barlow Condensed, and Fraunces are supplied through their Fontsource packages. Their upstream font licenses apply. Other packages retain the licenses distributed with each package; `package-lock.json` identifies the installed versions.

The Noto Serif TC WOFF2 subsets under `public/fonts/` use the SIL Open Font License. The [upstream license and copyright notice](docs/licenses/NotoSerifTC-OFL.txt) are included; [Google Fonts' Noto Serif TC directory](https://github.com/google/fonts/tree/main/ofl/notoseriftc) provides the upstream source. The Ubuntu build dependency `fonts-noto-cjk` is installed separately and retains its package notices.

## Launch media

Files under `docs/media/` demonstrate the site's search, navigation, and source presentation. They do not include playback of an original injury video. Screenshots can still contain provider thumbnails and editorial text, whose rights remain separate. Do not interpret these recordings as blanket permission to redistribute third-party media.

For a missing attribution, rights concern, or removal request, use [the maintainer's contact page](https://sportsmedicine.tw/contact/) and include the affected page or asset URL.
