const {src, dest, series, parallel, watch} = require("gulp");
const sass = require("gulp-sass");
const cssnano = require("gulp-cssnano");
const autoprefixer = require("gulp-autoprefixer");
const rename = require("gulp-rename");
const babel = require("gulp-babel");
const uglify = require("gulp-uglify");
const clean = require('gulp-clean');
const sourcemaps = require("gulp-sourcemaps");
const browserSync = require("browser-sync").create();
const reload = browserSync.reload;
const kit = require("gulp-kit-2")
const plumber = require('gulp-plumber');
const replace = require('gulp-replace');
const htmlmin = require('gulp-htmlmin');
const htmlhint = require("gulp-htmlhint");
sass.compiler = require("node-sass");

const paths = {
    src: {
        sass: "./apps-front/sass/**/*.scss",
        js: "./apps-front/js/**/*.js",
        html: "./apps-front/html/**/*.kit"
    },
    dest: {
        css: "./data/css",
        js: "./data/js",
        img: "./dist/img",
        dist: "./data/*",
        root: "./",
    }
}

function sassCompiler(done) {
    src(paths.src.sass)
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(sass().on("error", sass.logError))
        .pipe(autoprefixer({cascade: false}))
        .pipe(cssnano())
        .pipe(rename({suffix: ".min"}))
        .pipe(sourcemaps.write())
        .pipe(dest(paths.dest.css));
    done();
}

function javaScript(done) {
    src(paths.src.js)
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(babel({presets: ["@babel/env"]}))
        .pipe(uglify())
        .pipe(rename({suffix: ".min"}))
        .pipe(sourcemaps.write())
        .pipe(dest(paths.dest.js));
    done();
}

function cleanDist(done) {
    src([paths.dest.dist], {read: false})
        .pipe(plumber())
        .pipe(clean());
    done()
}

function handleKits(done) {
    src(paths.src.html)
        .pipe(plumber())
        .pipe(kit())
        .pipe(replace(/\.\.\/\.\.\//g, function handleReplace(match, p1, offset, string) {
            // Replace "../../" and log a ton of information
            // See https://mdn.io/string.replace#Specifying_a_function_as_a_parameter
            console.log('Found ' + match);
            return "";
        }))
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(htmlhint())
        .pipe(dest(paths.dest.root))
    done();
}

function liveServer(done) {
    browserSync.init({server: {baseDir: "./data/"}});
    done()
}

function liveMonitor(done) {
    watch("*.html").on("change", reload);
    watch([paths.src.sass, paths.src.js, paths.src.html], parallel(handleKits, sassCompiler, javaScript)).on("change", reload)
    done()
}

const mainFunctions = parallel(handleKits, sassCompiler, javaScript);
exports.default = series(mainFunctions);
exports.live = series(mainFunctions, liveServer, liveMonitor);
exports.clean = cleanDist;
exports.test = sassCompiler
