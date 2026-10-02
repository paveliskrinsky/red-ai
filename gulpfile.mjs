import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { Transform } from 'node:stream';
import gulp from 'gulp';
import gulpSass from 'gulp-sass';
import * as dartSass from 'sass';
import browserSync from 'browser-sync';
import autoprefixer from 'gulp-autoprefixer';
import fileinclude from 'gulp-file-include';

const sass = gulpSass(dartSass);
const server = browserSync.create();

const pages = 'src/html-layouts';
const dist = 'app';

function reload() {
  return server.reload({ stream: true });
}

export function clean(done) {
  fs.readdirSync(dist)
    .filter(file => file.endsWith('.html') && !fs.existsSync(path.join(pages, file)))
    .forEach(file => fs.unlinkSync(path.join(dist, file)));
  done();
}

function styles() {
  return gulp.src('src/scss/style.scss')
    .pipe(sass({ style: 'compressed' }).on('error', sass.logError))
    .pipe(autoprefixer({
      overrideBrowserslist: ['defaults']
    }))
    .pipe(gulp.dest(`${dist}/css`))
    .pipe(reload());
}

const asset = /^([^?#]+\.(?:css|js|webp|png|jpe?g|gif|svg|avif|ico|woff2?|webm|mp4))(?:\?v=\w+)?$/i;
const hashes = new Map();

function versioned(url, base = dist) {
  const match = url.match(asset);
  if (!match || /^(?:[a-z]+:|\/\/)/i.test(url)) return url;

  const file = path.join(base, match[1]);
  if (!fs.existsSync(file)) return url;

  const key = `${file}:${fs.statSync(file).mtimeMs}`;
  if (!hashes.has(key)) {
    hashes.set(key, crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex').slice(0, 8));
  }
  return `${match[1]}?v=${hashes.get(key)}`;
}

function revision() {
  return new Transform({
    objectMode: true,
    transform(file, encoding, callback) {
      const html = file.contents.toString().replace(/\b(src|href|srcset|poster|data-[\w-]+)="([^"]+)"/g, (all, name, value) => {
        const url = name === 'srcset'
          ? value.split(',').map(item => item.trim().replace(/^\S+/, src => versioned(src))).join(', ')
          : versioned(value);
        return `${name}="${url}"`;
      });
      file.contents = Buffer.from(html);
      callback(null, file);
    }
  });
}

function html() {
  return gulp.src(`${pages}/*.html`)
    .pipe(fileinclude({
      prefix: '@',
      basepath: '@file'
    }))
    .pipe(revision())
    .pipe(gulp.dest(dist))
    .pipe(reload());
}

function serve(done) {
  server.init({
    server: {
      baseDir: `${dist}/`
    }
  });
  done();
}

export function watch() {
  gulp.watch('src/scss/**/*.scss', gulp.series(styles, html));
  gulp.watch(`${pages}/**/*.html`, gulp.series(clean, html));
  gulp.watch(`${dist}/js/*.js`, html);
  gulp.watch([`${dist}/media/**/*`, `${dist}/css/*.min.css`, `${dist}/*.{ico,svg,png}`], html);
}

export const build = gulp.series(styles, clean, html);

export { styles as sass, html as fileinclude };

export default gulp.series(build, gulp.parallel(watch, serve));
