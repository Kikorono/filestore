import { ByteBuffer } from '@runejs/common/buffer';
import { FileTranscoder, TranscodedFile } from '../file-transcoder';
import { FileInfo } from '../js5-transcoder';


export class MapData extends TranscodedFile {

    public tileHeights: Uint8Array[][] = new Array(4);
    public tileSettings: Uint8Array[][] = new Array(4);
    public tileOverlayIds: Int8Array[][] = new Array(4);
    public tileOverlayPaths: Int8Array[][] = new Array(4);
    public tileOverlayOrientations: Int8Array[][] = new Array(4);
    public tileOverlayOpcodes: Uint8Array[][] = new Array(4);
    public tileUnderlayIds: Int8Array[][] = new Array(4);

    public constructor(fileInfo: FileInfo) {
        super('maps', fileInfo);

        Object.keys(this).forEach(key => {
            if(!this[key] || !Array.isArray(this[key])) {
                return;
            }

            const tileInfoArray: Uint8Array[][] | Int8Array[][] = this[key];
            for(let plane = 0; plane < 4; plane++) {
                tileInfoArray[plane] = new Array(64);
                for(let x = 0; x < 64; x++) {
                    tileInfoArray[plane][x] = (tileInfoArray instanceof Uint8Array) ?
                        new Uint8Array(64) : new Int8Array(64);
                }
            }
        });
    }

    /**
     * Iterates over each individual tile space within this map file, calling the provided callback
     * function with the plane index, x coordinate, and y coordinate of the current tile in the loop.
     * @param callback The function to be called for each individual map tile.
     */
    public forEachTile(callback: (mapData: MapData, plane: number, x: number, y: number) => void): MapData {
        for(let plane = 0; plane < 4; plane++) {
            for(let x = 0; x < 64; x++) {
                for(let y = 0; y < 64; y++) {
                    callback(this, plane, x, y);
                }
            }
        }

        return this;
    }

}


const mapCodec: FileTranscoder<MapData> = {
    archive: 'maps',
    revision: '414-458',

    decode: (fileInfo, fileData: ByteBuffer) => {
        fileData.readerIndex = 0;

        const mapData = new MapData(fileInfo);

        mapData.forEachTile((mapData, plane, x, y) => {
            let run = true;

            while(run) {
                const opcode = fileData.get('byte', 'unsigned');

                if(opcode === 0) {
                    run = false;
                    break;
                } else if(opcode === 1) {
                    mapData.tileHeights[plane][x][y] = fileData.get('byte', 'unsigned');
                    run = false;
                    break;
                } else if(opcode <= 49) {
                    mapData.tileOverlayIds[plane][x][y] = fileData.get('byte');
                    mapData.tileOverlayPaths[plane][x][y] = (opcode - 2) / 4;
                    mapData.tileOverlayOrientations[plane][x][y] = opcode - 2 & 3;
                    mapData.tileOverlayOpcodes[plane][x][y] = opcode;
                } else if(opcode <= 81) {
                    mapData.tileSettings[plane][x][y] = opcode - 49;
                } else {
                    mapData.tileUnderlayIds[plane][x][y] = opcode - 81;
                }
            }
        });

        const jsonMapData = JSON.stringify(mapData, null, 4);
        mapData.setData('rjs', jsonMapData);
        return mapData;
    },

    encode: (fileInfo, fileData: string) => {
        const mapData: MapData = JSON.parse(fileData);

        const buffer = new ByteBuffer(100000);

        mapData.forEachTile((mapData, plane, x, y) => {
            const tileOverlayId = mapData.tileOverlayIds[plane][x][y];
            const tileOverlayOpcode = mapData.tileOverlayOpcodes[plane][x][y];
            const tileSetting = mapData.tileSettings[plane][x][y];
            const tileUnderlayId = mapData.tileUnderlayIds[plane][x][y];

            if(tileOverlayOpcode > 1) {
                buffer.put(tileOverlayOpcode);
                buffer.put(tileOverlayId, 'byte');
            }

            if(tileSetting > 0) {
                buffer.put(49 + tileSetting, 'byte');
            }

            if(tileUnderlayId > 0) {
                buffer.put(81 + tileUnderlayId, 'byte');
            }

            // Final byte for this tile
            const tileHeight = mapData.tileHeights[plane][x][y];
            if(tileHeight > 0) {
                buffer.put(1, 'byte');
                buffer.put(tileHeight, 'byte');
            } else {
                buffer.put(0, 'byte');
            }
        });

        const js5Data = buffer.flipWriter();
        mapData.setData('js5', js5Data);
        return mapData;
    }
};

export default mapCodec;
