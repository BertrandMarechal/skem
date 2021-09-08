import { jest } from '@jest/globals';

import { VariableManager } from '../../variable-manager';
import fs from 'fs';

jest.mock('fs');

describe('variable-manager', function () {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('parseOptionsVariables', () => {
        it('should exit if one of the variables is not defined', () => {
            const exitSpy = jest.spyOn(process, 'exit')
                .mockImplementationOnce(jest.fn());

            const variableManager = new VariableManager();
            variableManager.parseOptionsVariables(['']);

            expect(exitSpy).toHaveBeenCalledWith(1);
        });
        it('should exit if one of the variables is not correctly formatted', () => {
            const exitSpy = jest.spyOn(process, 'exit')
                .mockImplementationOnce(jest.fn());

            const variableManager = new VariableManager();
            variableManager.parseOptionsVariables(['test-true']);

            expect(exitSpy).toHaveBeenCalledWith(1);
        });
        it('should return the variables as expected', () => {
            const exitSpy = jest.spyOn(process, 'exit')
                .mockImplementationOnce(jest.fn());

            const variableManager = new VariableManager();
            variableManager.parseOptionsVariables([
                'name=skem',
                'test=this is a test'
            ]);

            expect(exitSpy).not.toHaveBeenCalled();
        });
    });
    describe('resolveVariables', function () {
        it('should not return any variables if no variables are needed', function () {
            const result = VariableManager.resolveVariables(
                {
                    variables: [],
                    fileVariables:{},
                    variablesInFiles: [],
                },
                {},
                [],
                [],
                {}
            );
            expect(Object.keys(result).length).toEqual(0);
        });
        it('should filter the needed variables on the selected files only', function () {
            const result = VariableManager.resolveVariables(
                {
                    variables: ['var1', 'var2', 'var3'],
                    fileVariables:{
                        1: ['var2']
                    },
                    variablesInFiles: [],
                },
                {},
                ['file1', 'file2'],
                ['file2'],
                {}
            );
            expect(Object.keys(result).length).toEqual(1);
            expect(result).toEqual({ var2: null });
        });
        it('should add to the variables to get the variables that are listed as dependencies', function () {
            const result = VariableManager.resolveVariables(
                {
                    variables: ['var1', 'var2', 'var3'],
                    fileVariables:{
                        1: ['var3']
                    },
                    variablesInFiles: [],
                },
                {},
                ['file1', 'file2'],
                ['file2'],
                {
                    var3: {
                        transform: 'camelCase(var2)',
                        dependencies: ['var2']
                    }
                }
            );
            expect(Object.keys(result).length).toEqual(2);
            expect(result).toEqual({ var2: null, var3: null });
        });
        it('should default the values correctly if provided', function () {
            const result = VariableManager.resolveVariables(
                {
                    variables: ['var1', 'var2', 'var3'],
                    fileVariables:{
                        1: ['var3']
                    },
                    variablesInFiles: [],
                },
                { var2: 'var2Value'},
                ['file1', 'file2'],
                ['file2'],
                {
                    var3: {
                        transform: 'camelCase(var2)',
                        dependencies: ['var2']
                    }
                }
            );
            expect(Object.keys(result).length).toEqual(2);
            expect(result).toEqual({ var2: 'var2Value', var3: null });
        });
    });
    describe('replaceVariableInFileName', () => {
        it('should not replace if nothing is to be replaced', () => {
            const fileName = VariableManager.replaceVariableInFileName(
                'test.js',
                ['name'],
                { name: 'theTest' },
                ['---', '---']
            );
            expect(fileName).toEqual('test.js');
        });
        it('should replace if we have something to replace', () => {
            const fileName = VariableManager.replaceVariableInFileName(
                '---name---.js',
                ['name'],
                { name: 'theTest' },
                ['---', '---']
            );
            expect(fileName).toEqual('theTest.js');
        });
    });
    describe('replaceVariablesInFile', () => {
        it('should not replace if nothing is to be replaced', () => {
            jest.spyOn(fs, 'readFileSync')
                .mockImplementationOnce(() => 'test');
            const fileContent = VariableManager.replaceVariablesInFile(
                'test.js',
                ['name'],
                { name: 'theTest' },
                ['---', '---']
            );
            expect(fileContent).toEqual('test');
        });
        it('should replace if we have something to replace', () => {
            jest.spyOn(fs, 'readFileSync')
                .mockImplementationOnce(() => '---name---');
            const fileContent = VariableManager.replaceVariablesInFile(
                'test.js',
                ['name'],
                { name: 'theTest' },
                ['---', '---']
            );
            expect(fileContent).toEqual('theTest');
        });
    });
    describe('getVariables', () => {
        it('should get all the variables', () => {
            const fsMock = jest.spyOn(fs, 'readFileSync')
                .mockImplementation((fileName) =>
                    fileName === 'test.js' ?
                        '{{{jsVariable}}}---doNotCaptureMe---' :
                        '---captureMe---{{{butNotMe}}}'
                );
            const { fileVariables, variables } = VariableManager.getVariables(
                ['test.js', '___variable-name___.ts'],
                {
                    variableWrapper: '------',
                    fileNameVariableWrapper: '______',
                    variableWrappers: [
                        { wrapper: '{{{}}}', extension: 'js' }
                    ]
                }
            );
            expect(variables.length).toEqual(3);
            expect(variables.includes('jsVariable')).toEqual(true);
            expect(variables.includes('captureMe')).toEqual(true);
            expect(variables.includes('variable-name')).toEqual(true);

            expect(fileVariables[0].includes('jsVariable')).toEqual(true);
            expect(fileVariables[1].includes('captureMe')).toEqual(true);
            expect(fileVariables[1].includes('variable-name')).toEqual(true);

            fsMock.mockReset();
        });
    });
    describe('validateName', function () {
        let exitSpy = jest.spyOn(process, 'exit');
        beforeEach(() => {
            exitSpy = jest.spyOn(process, 'exit')
                .mockImplementationOnce(jest.fn());
        });
        afterEach(() => {
            exitSpy.mockReset();
        });
        it('should reject if name is 1 character', function () {
            expect(VariableManager.validateName('a')).toEqual(false);
        });
        it('should reject if name contains forbidden chars', function () {
            expect(VariableManager.validateName('a$')).toEqual(false);
        });
        it('should reject if name starts with no letter', function () {
            expect(VariableManager.validateName('-a')).toEqual(false);
            expect(VariableManager.validateName('_a')).toEqual(false);
            expect(VariableManager.validateName('0a')).toEqual(false);
        });
        it('should reject if name ends with no letter or number', function () {
            expect(VariableManager.validateName('a-')).toEqual(false);
            expect(VariableManager.validateName('a_')).toEqual(false);
        });
        it('should still accept some names', function () {
            expect(VariableManager.validateName('abcd')).toEqual(true);
            expect(VariableManager.validateName('ab12')).toEqual(true);
            expect(VariableManager.validateName('snake_case_name_123')).toEqual(true);
            expect(VariableManager.validateName('camelCaseName123')).toEqual(true);
            expect(VariableManager.validateName('kebab-case-name-123')).toEqual(true);
        });
    });
});
