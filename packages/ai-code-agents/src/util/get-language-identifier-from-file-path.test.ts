import { describe, it, expect } from 'vitest';
import { getLanguageIdentifierFromFilePath } from './get-language-identifier-from-file-path';

describe('getLanguageIdentifierFromFilePath', () => {
  it('should return javascript for .js files', () => {
    expect(getLanguageIdentifierFromFilePath('file.js')).toBe('javascript');
  });

  it('should return javascript for .jsx files', () => {
    expect(getLanguageIdentifierFromFilePath('component.jsx')).toBe(
      'javascript',
    );
  });

  it('should return typescript for .ts files', () => {
    expect(getLanguageIdentifierFromFilePath('script.ts')).toBe('typescript');
  });

  it('should return typescript for .tsx files', () => {
    expect(getLanguageIdentifierFromFilePath('component.tsx')).toBe(
      'typescript',
    );
  });

  it('should return python for .py files', () => {
    expect(getLanguageIdentifierFromFilePath('script.py')).toBe('python');
  });

  it('should return java for .java files', () => {
    expect(getLanguageIdentifierFromFilePath('Main.java')).toBe('java');
  });

  it('should return c for .c files', () => {
    expect(getLanguageIdentifierFromFilePath('program.c')).toBe('c');
  });

  it('should return cpp for .cpp files', () => {
    expect(getLanguageIdentifierFromFilePath('program.cpp')).toBe('cpp');
  });

  it('should return chsarp for .cs files', () => {
    expect(getLanguageIdentifierFromFilePath('Program.cs')).toBe('chsarp');
  });

  it('should return go for .go files', () => {
    expect(getLanguageIdentifierFromFilePath('main.go')).toBe('go');
  });

  it('should return rust for .rs files', () => {
    expect(getLanguageIdentifierFromFilePath('lib.rs')).toBe('rust');
  });

  it('should return php for .php files', () => {
    expect(getLanguageIdentifierFromFilePath('index.php')).toBe('php');
  });

  it('should return ruby for .rb files', () => {
    expect(getLanguageIdentifierFromFilePath('script.rb')).toBe('ruby');
  });

  it('should return swift for .swift files', () => {
    expect(getLanguageIdentifierFromFilePath('app.swift')).toBe('swift');
  });

  it('should return kotlin for .kt files', () => {
    expect(getLanguageIdentifierFromFilePath('Main.kt')).toBe('kotlin');
  });

  it('should return scala for .scala files', () => {
    expect(getLanguageIdentifierFromFilePath('App.scala')).toBe('scala');
  });

  it('should return html for .html files', () => {
    expect(getLanguageIdentifierFromFilePath('index.html')).toBe('html');
  });

  it('should return css for .css files', () => {
    expect(getLanguageIdentifierFromFilePath('styles.css')).toBe('css');
  });

  it('should return sass for .sass files', () => {
    expect(getLanguageIdentifierFromFilePath('styles.sass')).toBe('sass');
  });

  it('should return scss for .scss files', () => {
    expect(getLanguageIdentifierFromFilePath('styles.scss')).toBe('scss');
  });

  it('should return less for .less files', () => {
    expect(getLanguageIdentifierFromFilePath('styles.less')).toBe('less');
  });

  it('should return json for .json files', () => {
    expect(getLanguageIdentifierFromFilePath('data.json')).toBe('json');
  });

  it('should return markdown for .md files', () => {
    expect(getLanguageIdentifierFromFilePath('README.md')).toBe('markdown');
  });

  it('should return toml for .toml files', () => {
    expect(getLanguageIdentifierFromFilePath('config.toml')).toBe('toml');
  });

  it('should return yaml for .yml files', () => {
    expect(getLanguageIdentifierFromFilePath('config.yml')).toBe('yaml');
  });

  it('should return yaml for .yaml files', () => {
    expect(getLanguageIdentifierFromFilePath('config.yaml')).toBe('yaml');
  });

  it('should return xml for .xml files', () => {
    expect(getLanguageIdentifierFromFilePath('data.xml')).toBe('xml');
  });

  it('should return sql for .sql files', () => {
    expect(getLanguageIdentifierFromFilePath('query.sql')).toBe('sql');
  });

  it('should return graphql for .graphql files', () => {
    expect(getLanguageIdentifierFromFilePath('schema.graphql')).toBe('graphql');
  });

  it('should return bash for .sh files', () => {
    expect(getLanguageIdentifierFromFilePath('script.sh')).toBe('bash');
  });

  it('should return bash for .ps1 files', () => {
    expect(getLanguageIdentifierFromFilePath('script.ps1')).toBe('bash');
  });

  it('should handle case insensitive extensions', () => {
    expect(getLanguageIdentifierFromFilePath('FILE.JS')).toBe('javascript');
    expect(getLanguageIdentifierFromFilePath('file.TS')).toBe('typescript');
    expect(getLanguageIdentifierFromFilePath('file.Py')).toBe('python');
  });

  it('should return empty string for files without extensions', () => {
    expect(getLanguageIdentifierFromFilePath('README')).toBe('');
    expect(getLanguageIdentifierFromFilePath('Makefile')).toBe('');
  });

  it('should return empty string for unknown extensions', () => {
    expect(getLanguageIdentifierFromFilePath('file.unknown')).toBe('');
    expect(getLanguageIdentifierFromFilePath('file.xyz')).toBe('');
  });

  it('should handle files with multiple dots (take last extension)', () => {
    expect(getLanguageIdentifierFromFilePath('archive.tar.gz')).toBe('');
    expect(getLanguageIdentifierFromFilePath('file.min.js')).toBe('javascript');
    expect(getLanguageIdentifierFromFilePath('styles.min.css')).toBe('css');
  });

  it('should return empty string for empty input', () => {
    expect(getLanguageIdentifierFromFilePath('')).toBe('');
  });

  it('should return empty string for just a dot', () => {
    expect(getLanguageIdentifierFromFilePath('.')).toBe('');
  });

  it('should return empty string for extension-only paths', () => {
    expect(getLanguageIdentifierFromFilePath('.js')).toBe('');
    expect(getLanguageIdentifierFromFilePath('.ts')).toBe('');
  });

  it('should handle paths with directories', () => {
    expect(getLanguageIdentifierFromFilePath('src/index.js')).toBe(
      'javascript',
    );
    expect(getLanguageIdentifierFromFilePath('/path/to/file.py')).toBe(
      'python',
    );
    expect(getLanguageIdentifierFromFilePath('./relative/path/file.ts')).toBe(
      'typescript',
    );
  });
});
