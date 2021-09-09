import fs from 'fs';
import Path from 'path';
import child_process from 'child_process';
import {
    SkemConfigVariableTransform,
    VariableTransformer,
    VariableTransformParamsWithDependencies
} from './variable-transformer';

export const CONFIGURATION_FILE_NAME = 'skem.config.json';
export const DEFAULT_VARIABLE_WRAPPER = '______';

export interface SkemConfigWrappers {
    fileNameVariableWrapper?: string;
    variableWrapper?: string;
    variableWrappers?: {
        wrapper: string;
        extension: string;
    }[];
}

export type SkemHookType =
    | 'post-install'
    | 'pre-install';

export class SkemHook {
    type: SkemHookType;
    command: string;
    path: string;

    constructor(params: Pick<SkemHook, 'type' | 'command' | 'path'>) {
        this.type = params.type;
        this.command = params.command;
        this.path = params.path || '.';
    }

    public isValid(): boolean {
        return !!this.command && (this.type === 'pre-install' || this.type === 'post-install');
    }
}
export interface SkemHooks {
    hooks: SkemHook[];
}
export interface SkemConfig extends SkemConfigWrappers, SkemHooks, SkemConfigVariableTransform {
    name?: string;
    singleFile?: string;
    singleFiles?: {
        name: string;
        file: string;
    }[];
}

export class SkemConfigManager {
    private _config: SkemConfig | undefined;
    private readonly _fileName;

    constructor(configFileName: string) {
        if (!configFileName) {
            return;
        }
        this._fileName = configFileName;
        try {
            const fileContent = fs.readFileSync(configFileName, 'ascii');
            if (!fileContent) {
                console.error(`File "${this._fileName}" is empty.`);
                return;
            }
            try {
                this._config = JSON.parse(fileContent);
                if (this._config) {
                    this._config.hooks = (this._config?.hooks || []).map(h => new SkemHook(h)) || [];
                }
            } catch {
                console.error(`Invalid JSON in "${this._fileName}".`);
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

    public get isSingleFile(): boolean {
        return !!this._config?.singleFile;
    }

    public get isSingleFiles(): boolean {
        return !!this._config?.singleFiles?.length;
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

    public get skemWrappers(): SkemConfigWrappers {
        const skemWrappers: SkemConfigWrappers = {};
        if (this._config?.fileNameVariableWrapper) {
            skemWrappers.fileNameVariableWrapper = this._config.fileNameVariableWrapper;
        }
        if (this._config?.variableWrapper) {
            skemWrappers.variableWrapper = this._config.variableWrapper;
        }
        if (this._config?.variableWrappers) {
            skemWrappers.variableWrappers = this._config.variableWrappers;
        }
        return skemWrappers;
    }

    public get hooks(): SkemHook[] {
        return this._config?.hooks || [];
    }

    public get variableTransform(): Record<string, VariableTransformParamsWithDependencies> {
        if (this._config?.variableTransform) {
            const variableTransformWithDependencies: Record<string, VariableTransformParamsWithDependencies> = {};
            const keys = Object.keys(this._config.variableTransform);
            for (const key of keys) {
                variableTransformWithDependencies[key] =
                    VariableTransformer.parseTransformer(this._config.variableTransform[key]);
            }
            return variableTransformWithDependencies;
        }
        return {};
    }

    public static getFileNameVariableWrapper(config: SkemConfigWrappers): [string, string] {
        return SkemConfigManager.splitWrapperIn2(config.fileNameVariableWrapper || DEFAULT_VARIABLE_WRAPPER);
    }

    public static getVariableWrapper(fileName: string, config: SkemConfigWrappers): [string, string] {
        if (config.variableWrappers?.length) {
            for (const variableWrapper of config.variableWrappers) {
                const extensionRegExp = new RegExp(variableWrapper.extension + '$');
                if (extensionRegExp.test(fileName)) {
                    return SkemConfigManager.splitWrapperIn2(variableWrapper.wrapper || DEFAULT_VARIABLE_WRAPPER);
                }
            }
        }
        return SkemConfigManager.splitWrapperIn2(config.variableWrapper || DEFAULT_VARIABLE_WRAPPER);
    }

    public static runHooks(skemHooks: SkemHook[], type: SkemHookType, root: string): void {
        const hooks = skemHooks.filter(({type: hookType}) => hookType === type);
        for (const { command, path } of hooks) {
            child_process.execSync(command, {
                stdio: [0, 1, 2],
                cwd: Path.resolve(root, path)
            });
        }
    }

    private static splitWrapperIn2(wrapper: string): [string, string] {
        return [wrapper.slice(0, (wrapper.length / 2)), wrapper.slice(-1 * (wrapper.length / 2))];
    }

    private _validateConfig() {
        if (this._config?.singleFile && this._config?.singleFiles?.length) {
            console.error(`Invalid config in "${this._fileName}": Please provide either singleFile or singleFiles, but not both.`);
            process.exit(1);
            return;
        }
        if (this._config?.fileNameVariableWrapper && !SkemConfigManager._validateWrapper(this._config?.fileNameVariableWrapper)) {
            console.error(`Invalid config in "${this._fileName}": fileNameVariableWrapper should be of even length. i.e. <<<>>>.`);
            process.exit(1);
            return;
        }
        if (this._config?.variableWrapper && !SkemConfigManager._validateWrapper(this._config?.variableWrapper)) {
            console.error(`Invalid config in "${this._fileName}": variableWrapper should be of even length. i.e. <<<>>>.`);
            process.exit(1);
            return;
        }

        if (this._config?.variableWrappers) {
            const extensions: string[] = [];
            for (const variableWrapper of this._config.variableWrappers) {
                if (extensions.some(e => e === variableWrapper.extension)) {
                    console.error(`Invalid config in "${this._fileName}": variableWrappers has 2 wrapper set up for the same extension.`);
                    process.exit(1);
                    return;
                } else {
                    extensions.push(variableWrapper.extension);
                }
                if (!SkemConfigManager._validateWrapper(variableWrapper.wrapper)) {
                    console.error(`Invalid config in "${this._fileName}": variableWrappers has one wrapper that is not of even length. i.e. <<<>>>.`);
                    process.exit(1);
                    return;
                }
            }
        }
        if (this._config?.hooks.length) {
            for (const hook of this._config.hooks) {
                if (!hook.isValid()) {
                    console.error(`Invalid config in "${this._fileName}": one of the hooks is invalid.`);
                    process.exit(1);
                    return;
                }
            }
        }
        if (this._config?.variableTransform) {
            let errorMessage: string | undefined = VariableTransformer.validateDependencies(this.variableTransform);

            if (errorMessage) {
                console.error(`Invalid config in "${this._fileName}": variableTransform has an error: ${errorMessage}.`);
                process.exit(1);
                return;
            }

            const keys = Object.keys(this._config.variableTransform);
            for (const key of keys) {
                errorMessage = VariableTransformer.validateTransform(this._config?.variableTransform[key].transform);

                if (errorMessage) {
                    console.error(`Invalid config in "${this._fileName}": variableTransform "${key}" has an error: ${errorMessage}.`);
                    process.exit(1);
                    return;
                }
            }
        }
    }

    private static _validateWrapper(wrapper: string): boolean {
        return wrapper.length % 2 === 0;
    }
}
