require('json5/lib/register');


export type ArchiveName =
    'anims' |
    'bases' |
    'config' |
    'interfaces' |
    'synth_sounds' |
    'maps' |
    'midi_songs' |
    'models' |
    'sprites' |
    'textures' |
    'binary' |
    'midi_jingles' |
    'clientscripts' |
    // 435 archives ^^^
    // post-435 archives vvv
    'fontmetrics' |
    'vorbis' |
    'midi_instruments' |
    'config_loc' |
    'config_enum' |
    'config_npc' |
    'config_obj' |
    'config_seq' |
    'config_spot' |
    'config_var_bit' |
    'worldmapdata' |
    'quickchat' |
    'quickchat_global' |
    'materials' |
    'config_particle' |
    'defaults';

export type IndexName = 'main' | ArchiveName;

export type FileCompression = 'uncompressed' | 'bzip' | 'gzip';
export type ArchiveContentType = 'groups' | 'files';

export type ArchiveConfigurations = { [key in IndexName]: ArchiveConfig };

export const archiveConfig: ArchiveConfigurations = require('../../../config/archives.json5');


export const compressionKey: { [key in FileCompression]: number } = {
    uncompressed: 0,
    bzip: 1,
    gzip: 2
};


export interface ArchiveContentConfig {
    type?: ArchiveContentType;
    fileExtension?: string;
    saveFileNames?: boolean;
    defaultFileNames?: { [key: string]: number };
}


export interface ArchiveConfig {
    index: number;
    name?: IndexName;
    format?: number;
    compression: FileCompression;
    content?: ArchiveContentConfig;
}


export const getGroupNames = (archive: ArchiveName): { [key: string]: number } => {
    return archiveConfig[archive].content?.defaultFileNames ?? {};
};


export const getIndexName = (index: number): IndexName | undefined => {
    return Object.keys(archiveConfig).find(key => key && archiveConfig[key]?.index === index) as IndexName | undefined;
};

export const getArchiveName = (archiveIndex: number): ArchiveName | undefined => {
    return Object.keys(archiveConfig).find(key => key && archiveConfig[key]?.index === archiveIndex) as ArchiveName | undefined;
};

export const getArchiveIndex = (archiveName: ArchiveName): number => {
    return archiveConfig[archiveName]?.index ?? -1;
};

export const getArchiveConfig = (indexId: number): ArchiveConfig | undefined => {
    const indexName = getIndexName(indexId);
    if(!indexName) {
        return undefined;
    }
    const config = archiveConfig[indexName as IndexName];
    if(!config) {
        return undefined;
    } else {
        return { name: indexName, ...config };
    }
};
