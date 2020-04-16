const gulp = require('gulp'),
	sass = require('gulp-sass'),
	browserSync = require('browser-sync'),
	concat = require('gulp-concat'),
	cleancss = require('gulp-clean-css'),
	sourcemaps = require('gulp-sourcemaps'),
	autoprefixer = require('gulp-autoprefixer'),
	newer = require('gulp-newer'),
	rename = require('gulp-rename'),
	imagemin = require('gulp-imagemin'),
	notify = require('gulp-notify'),
	debug = require('gulp-debug'),
	del = require('del'),
	webpack = require('webpack-stream'),
	path = require('path');

const isDev = process.env.NODE_ENV == 'development';

const src = './';
const phpPaths = '../../../../**/*.php';
const webpackConfig = {
	output: {
		filename: 'scripts.min.js'
	},
	module: {
			rules: [{
				test: /\.js$/,
				// loader: 'babel-loader',
				exclude: '/node_modules/'
			}]
	},
	mode: isDev ? 'development' : 'production',
	devtool: isDev ? 'source-map' : 'none',
	optimization: {
		minimize: true
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'js')
		}
	}
};

const bsReload = (done => {
	browserSync.reload();
	done();
});

// Local Server
gulp.task('browser-sync', () => {
	browserSync({
		proxy: 'bx-new-template',
		notify: false,
	})
});

// Styles
gulp.task('styles:page', () => {
	return gulp.src([
		src + 'scss/page/base/**/*.scss',
		src + 'scss/page/**/*.scss'
	])
		.pipe(sourcemaps.init())
		.pipe(concat('styles.scss'))
		.pipe(sass({
			outputStyle: 'expanded',
			includePaths: [__dirname + '/node_modules'] // check
		}))
		.on('error', notify.onError((err) => {
			return {
				title: 'styles-page',
				message: err.message
			}
		}))
		.pipe(concat('styles.css'))
		.pipe(autoprefixer({
			grid: true,
			overrideBrowserslist: ['last 10 versions']
		}))
		.pipe(cleancss({
			level: {
				1: {
					specialComments: 0
				}
			}
		})) // Optional. Comment out when debugging
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('../'))
		.pipe(browserSync.stream())
});

gulp.task('styles:template', () => {
	return gulp.src([
		src + 'scss/template/vendors/**/*.scss',
		src + 'scss/template/base/**/*.scss',
		src + 'scss/template/**/*.scss'
	])
		.pipe(sourcemaps.init())
		.pipe(concat('template_styles.scss'))
		.pipe(sass({
			outputStyle: 'expanded',
			includePaths: [__dirname + '/node_modules']
		}))
		.on('error', notify.onError((err) => {
			return {
				title: 'styles-template',
				message: err.message
			}
		}))
		.pipe(concat('template_styles.css'))
		.pipe(autoprefixer({
			grid: true,
			overrideBrowserslist: ['last 10 versions']
		}))
		.pipe(cleancss({
			level: {
				1: {
					specialComments: 0
				}
			}
		})) // Optional. Comment out when debugging
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('../'))
		.pipe(browserSync.stream())
});

// Scripts
gulp.task('scripts', () => {
	return gulp.src(src + 'js/index.js')
		.pipe(webpack(webpackConfig))
		.pipe(debug({
			title: 'webpack'
		}))
		.pipe(gulp.dest('../js'))
		.pipe(browserSync.reload({
			stream: true
		}))
});

// Images
gulp.task('images', async () => {
	return gulp.src(src + 'img/**/*.{png,jpg,jpeg,webp,raw,svg,gif}')
		.pipe(imagemin([
	    imagemin.gifsicle({interlaced: true}),
	    imagemin.mozjpeg({quality: 75, progressive: true}),
	    imagemin.optipng({optimizationLevel: 5}),
	    imagemin.svgo({
	        plugins: [
	            {removeViewBox: true},
	            {cleanupIDs: false}
	        ]
	    })
    ]))
		.pipe(newer('../img'))
		.pipe(rename((path => path.extname = path.extname.replace('jpeg', 'jpg'))))
		.pipe(gulp.dest('../img'))
});

gulp.task('img', gulp.series('images', bsReload));

// Clean IMG's
gulp.task('cleanimg', () => {
	return del([src + 'img/**/*', '!img/favicon.*'], {
		force: true
	})
});

// Code & Reload
gulp.task('code', () => {
	return gulp.src(phpPaths)
		.pipe(browserSync.reload({
			stream: true
		}))
});

// Watch
gulp.task('watch', () => {
	gulp.watch(src + 'scss/page/**/*.scss', gulp.parallel('styles:page'));
	gulp.watch(src + 'scss/template/**/*.scss', gulp.parallel('styles:template'));
	gulp.watch([src + 'js/*.js', `!${src}js/scripts.min.js`], gulp.parallel('scripts'));
	gulp.watch(src + '*.html', gulp.parallel('code'));
	gulp.watch(phpPaths, gulp.parallel('code'))
	gulp.watch(src + 'img/**/*', gulp.parallel('img'));
});

gulp.task('build', gulp.parallel('scripts'))
gulp.task('default', gulp.parallel('img', 'styles:page', 'styles:template', 'scripts', 'browser-sync', 'watch'));