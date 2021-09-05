import { jest } from '@jest/globals';

import { VariableManager } from '../../variable-manager';
import fs from 'fs';
import SpyInstance = jest.SpyInstance;

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
