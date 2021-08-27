import fs from 'fs';

export const CONFIGURATION_FILE_NAME = 'skem.config.json';

export interface SkemConfig {
    name?: string;
    singleFile?: string;
    singleFiles?: {
        name: string;
        file: string;
    }[];
}

export class SkemConfigManager {
    private _config: SkemConfig | undefined;
    private _fileName = '';

    constructor(configFileName: string) {
        if (!configFileName) {
            return;
        }
        this._fileName = configFileName;
        try {
            const fileContent = fs.readFileSync(configFileName, 'ascii');
            if (!fileContent) {
                return;
            }
            try {
                this._config = JSON.parse(fileContent);
            } catch {
                return;
            }
        } catch {
            return;
        }
        this._validateConfig();
    }

    public get name(): string {
        return this._config?.name || '';
    }

    public get isSingleFiles(): boolean {
        return !!this._config?.singleFile || !!this._config?.singleFiles?.length;
    }

    public get singleFiles(): { file: string, name?: string }[] {
        if (this._config?.singleFile) {
            return [{
                file: this._config.singleFile,
                name: this._config?.name
            }];
        } else if (this._config?.singleFiles) {
            return this._config?.singleFiles;
        }
        return [];
    }

    private _validateConfig() {
        if (this._config?.singleFile && this._config?.singleFiles?.length) {
            console.error(`Invalid config in "${this._fileName}": Please provide either singleFile or singleFiles, but not both.`);
            process.exit(1);
        }
    }
}
