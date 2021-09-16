# Skem
___
[![Unit and integration test](https://github.com/BertrandMarechal/skem/actions/workflows/github-test.yml/badge.svg)](https://github.com/BertrandMarechal/skem/actions/workflows/github-test.yml)

Your blueprint manager.

## Purpose

Skem was built to leverage the boilerplate it takes to create projects, or create file structures that are always very
similar. It helps in:

- Holding a local record of blueprints you created or added to your library
- Installing those blueprints on demand

## Installation

You can install Skem through your usual node package manager :

- npm
```shell
npm install -g skem
```

- yarn
```shell
yarn global add skem
```

## CLI usage

### Help

If you are looking for help on the commands, just run `skem`, `skem help` (or `skem h`) for the general help.
For help on the commands, run `skem <command> --help` or `skem <command> -h`

### Add

To add a blueprint to your library run `skem add` (or `skem a`).

#### Options

- Use the `--path` (or `-p`) option to tell where to source the blueprint from. The default is `.`.

- Use the `--name` (or `-n`) option to provide the name you want to give to your blueprint.
If none is provided, the CLI will prompt a message for you to provide the name.

- Use the `--repo` (or `-r`) option to add all the sub folder of a folder as individual blueprints.

- Use the `--git` (or `-g`) option to pull a git repository and add its blueprint(s) to the local library.

### Install

To install a blueprint, just run `skem install` (or `skem i`).

#### Options

- Use the `--path` (or `-p`) option to tell where to install the blueprint from. The default is `.`.

- Use the `--name` (or `-n`) option to provide the name of the blueprint you want to install.
If no name is provided, skem will list the available blueprints you can then select from.
If part of a name is provided, skem will filter the available blueprints that contain the value passed as parameter.

- Use the `--force` (or `-f`) option to remove the confirmation prompt on overwriting existing files.

- Use the `--pick` option to filter the files to install. Provide a value to filter the files. Passing no value will offer
the possibility pick amongst all the files.

- Use the `--variable` (or `-v`) option to give the value of a variable used in the blueprint.

The values have to be provided as follows : `--variable name=test` and `--variable text='Lorem ipsum...'`

You can use this option multiple time: `skem install --variable name=test --variable text='Lorem ipsum...'`

### Update

To update the blueprints from their source, just run `skem update` (or `skem u`).

This will go to the root of the blueprints, read the configuration and update the local library.

#### Options

- Use the `--name` (or `-n`) option to provide the name of the blueprint you want to update.
Updates all if no value is provided.

### Remove

To remove one or all the blueprints from the local library, just run `skem remove` (or `skem rm`).

#### Options

- Use the `--name` (or `-n`) option to provide the name of the blueprint you want to remove.
Clears the library if no value is provided.

- Use the `--force` (or `-f`) option to remove the confirmation prompt on clearing the blueprint library.

### List

To list the blueprints available in the local library, just run `skem list` (or `skem ls`).

### Print

To print information about a blueprint in the local library, just run `skem print` (or `skem p`).

#### Options

- Use the `--name` (or `-n`) option to provide the name of the blueprint you want to print.
If no name is provided, skem will list the available blueprints you can then select from.

## Variables

You can use variables in a blueprint file or blueprint path (folder and/or file names).
Just wrap your variable name with 3 underscores `___my-variable___` and skem will identify them, and prompt to ask for a
value on installation. You can also overwrite the wrapper. See the following section to see the options.

## Skem config file

### Purpose

To hold information about the blueprint or the repository of blueprints, you can use a file called `skem.comfig.json`.

### Options

- `name`: <string> Provides the name of the blueprint attached to this folder.
- `singleFile`: <string> Tells the blueprint is composed of a single file.
This value is to set to the file path relative to the config file.
This option is incompatible with `singleFiles`.
- `singleFiles`: {file: string, name?: string}[] Array containing a list of files and blueprint names attached to the
files.
Use this option if your folder holds a collection of files to be used individually.
- `variableWrapper`: <string> Overwrites the variable wrapper with the one provided.
The pattern has to contain both start and end wrappers and those should surround the `variable` word (i.e.
`<<variable>>`, `<%= variable %>`, `=variable>`).
- `variableWrapper`: {wrapper: string, extension: string}[] Array defining the wrappers to use per file type (identified
by their extensions). This helps with trying to keep a valid syntax whilst working with different file types.
- `fileNameVariableWrapper`: <string> Overwrites the variable wrapper with the one provided only for file names.
The rules are the same as `variableWrapper`.
- `hooks`: {command: string, type?: pre-install | post-install, path?: string}[] Array defining the extra steps to run
before or after the installation of the blueprint (i.e. `npm i`, `yarn i`).
- `variableTransform`: {[variableName: string]: { transform?: string, default?: string, skipIfDefined?: boolean }} Object defining the
variables that can be figuredOut through other variables.
  - Set `skipIfDefined` to true if you want to skip being prompted the variable value on installing the blueprint
  - Set `default` to be prompted with this value on choosing the value of the variable
  - The transform property is to be composed of other variable with transform functions. The available functions are:
    - `camelCase(value)` Transforms the parameter to camelCase.
    - `pascalCase(value)` Transforms the parameter to PascalCase.
    - `snakeCase(value)` Transforms the parameter to snake_case.
    - `upperSnakeCase(value)` Transforms the parameter to UPPER_SNAKE_CASE.
    - `kebabCase(value)` Transforms the parameter to kebab-case.
    - `spaceCase(value)` Transforms the parameter to space case
    - `upperCase(value)` Sets all characters to upper case
    - `lowerCase(value)` Sets all characters to lower case
    - `replace(value, replace, replaceWith, options?)` Replaces the in the `value` the `replace` string with
    `replaceWith`. The options are a string that tell the Regular expression how to behave (i.e. `ig` for insensitive
    and global)
    - `concat(...values)` Concatenates all the values passed as parameter (i.e. `concat('val1','val2')` outputs
    `val1val2`)
    - `join(separator, ...values)` Joins all the values passed as parameter with the separator (i.e.
    `join('-','val1','val2')` outputs `val1-val2`)
    - `splitPart(value, separator, nth)` Splits the `value` using the `separator`, and takes the `nth` part. `nth`
    starts at 0 

### Examples

You can check the [test-schematics](./test-schematics) folder for examples about how to use the config files. 
