var gulp = require('gulp'),
	sass = require('gulp-sass'),
	browserSync = require('browser-sync'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify-es').default,
	cleancss = require('gulp-clean-css'),
	autoprefixer = require('gulp-autoprefixer'),
	webp = require('gulp-webp'),
	clone = require('gulp-clone'),
	clonesink = clone.sink(),
	newer = require('gulp-newer'),
	rename = require('gulp-rename'),
	imagemin = require('gulp-imagemin'),
	notify = require('gulp-notify'),
	debug = require('gulp-debug'),
	del = require('del'),
	webpack = require('webpack-stream');

let isDev = true;
let isProd = !isDev;

let webpackConfig = {
	output: {
		filename: 'scripts.min.js'
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				loader: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env'
            ]
          }
        },
				exclude: '/node_modules/'
			}
		]
	},
	mode: isDev ? 'development' : 'production',
	devtool: isDev ? 'eval-source-map' : 'none'
};

// Local Server
gulp.task('browser-sync', function () {
	browserSync({
		server: {
			baseDir: 'src'
		},
		notify: false,
		// online: false, // Work offline without internet connection
		// tunnel: true, tunnel: 'projectname', // Demonstration page: http://projectname.localtunnel.me
	})
});

function bsReload(done) {
	browserSync.reload();
	done();
};

// Custom Styles
gulp.task('styles', function () {
	return gulp.src('src/sass/**/*.sass')
		.pipe(sass({
			outputStyle: 'expanded',
			includePaths: [__dirname + '/node_modules']
		}))
		.on('error', notify.onError(function (err) {
			return {
				title: 'Sass',
				message: err.message
			}
		}))
		.pipe(concat('styles.min.css'))
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
		.pipe(gulp.dest('src/css'))
		.pipe(browserSync.stream())
});

// Scripts
gulp.task('scripts', function () {
	return gulp.src('src/js/index.js')
		.pipe(webpack(webpackConfig))
		.pipe(debug({
			title: 'webpack'
		}))
		.pipe(gulp.dest('src/js'))
		.pipe(browserSync.reload({
			stream: true
		}))
});

// Images
gulp.task('images', async function () {
	return gulp.src('src/img/_src/**/*.{png,jpg,jpeg,webp,raw,svg,gif}')
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
		.pipe(newer('src/img'))
		.pipe(rename(function (path) {
			path.extname = path.extname.replace('jpeg', 'jpg')
		}))
		.pipe(clonesink) // start stream
		.pipe(webp()) // convert images to webp and save a copy of the original format
		.pipe(clonesink.tap()) // close stream
		
		.pipe(gulp.dest('src/img'))
});

gulp.task('img', gulp.series('images', bsReload));

// Clean IMG's
gulp.task('cleanimg', function () {
	return del(['src/img/**/*', '!src/img/_src', '!src/img/favicon.*'], {
		force: true
	})
});

// Code & Reload
gulp.task('code', function () {
	return gulp.src('src/**/*.html')
		.pipe(browserSync.reload({
			stream: true
		}))
});

// Build
gulp.task('css:build', function () {
	return gulp.src('src/css/*.css')
		.pipe(gulp.dest('dist/css'))
});

gulp.task('js:build', function () {
	return gulp.src('src/js/scripts.min.js')
		.pipe(uglify())
		.pipe(gulp.dest('dist/js/'))
});

gulp.task('html:build', function () {
	return gulp.src('src/*.{html,htaccess,access}')
		.pipe(gulp.dest('dist/'))
});

gulp.task('img:build', function () {
	return gulp.src('src/img/*.{png,jpg,jpeg,webp,raw,ico,svg}')
		.pipe(gulp.dest('dist/img/'))
});

gulp.task('fonts:build', function () {
	return gulp.src(['src/fonts/*', '!src/fonts/_src/**'])
		.pipe(gulp.dest('dist/fonts/'))
});

// Delete build
gulp.task('clean:build', function () {
	return del('dist')
});

gulp.task('build', gulp.series('clean:build', gulp.parallel('css:build', 'js:build', 'html:build', 'img:build', 'fonts:build')));

// Watch
gulp.task('watch', function () {
	gulp.watch('src/sass/**/*.sass', gulp.parallel('styles'));
	gulp.watch(['src/js/*.js', '!src/js/scripts.min.js'], gulp.parallel('scripts'));
	gulp.watch('src/*.html', gulp.parallel('code'));
	gulp.watch('src/img/_src/**/*', gulp.parallel('img'));
});

gulp.task('default', gulp.parallel('img', 'styles', 'scripts', 'browser-sync', 'watch'));