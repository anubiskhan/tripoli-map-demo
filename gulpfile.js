// *************************************
//
//	 HTML
//   Gulp
//   Yarn
//
// *************************************
//
// Available tasks:
//   `gulp` - build files in .tmp folder for development
//   'gulp --eng=production' - build all production files
//   `gulp serve` - launch browserSync
//   `gulp yarn` - download and concat external scripts
//
// *************************************

// Gulp config files
const pkg = require('./package.json');
const getPackageJson = function () {
	return JSON.parse(fs.readFileSync('./package.json', 'utf8'));
};


// Gulp consts
const {
	series,
	parallel,
	src,
	dest,
	watch,
	task,
	gulp
} = require('gulp');
const plugin = require('gulp-load-plugins')();

// Non Gulp Plugins
const browserSync = require('browser-sync')
	.create();
const beep = require('beepbeep');
const streameries = require( 'stream-series' );
const fs = require('fs');



// -------------------------------------
//   Argument Setup
//   default --env development
//   production --env production
// -------------------------------------

const minimist = require('minimist');
const knownOptions = {
	string: 'env',
	string: 'bump',
	string: 'minor',
	string: 'major',
	default: {
		env: process.env.NODE_ENV || 'development',
		bump: 'patch'
	}
};
const options = minimist(process.argv.slice(2), knownOptions);
const productionDest = plugin.if(options.env === 'production', pkg.paths.dist, pkg.paths.temp);
const production = (options.env === 'production');



// -------------------------------------
//   Error function
// -------------------------------------

const onError = function (err) {
	plugin.notify.onError({
		title: "Gulp error in " + err.plugin,
		message: err.message.toString()
	})(err.message);
	browserSync.notify(err.message, 3000);
	beep(3);
	this.emit('end');
};


// -------------------------------------
//   Task: Lists
// -------------------------------------

exports.serve = series(browsersync, watchTask);
exports.default = series(clean, yarnDownload, yarnMove, yarnClean, parallel(yarnFonts, yarnImages, yarnJs, series(yarnWiredep, yarnScss, yarnCss, yarnConcat, yarnDeltemp)), scripts, styles, html, inject, fonts, imagemin, svgmin, video, copyMaps, favicon);
exports.inject = inject;
exports.yarnCleanDownload = yarnCleanDownload;
exports.yarn = series(yarnDownload, yarnMove, yarnClean, parallel(yarnFonts, yarnImages, yarnJs, series(yarnWiredep, yarnScss, yarnCss, yarnConcat, yarnDeltemp)));


// gulp.task( 'build', function ( callback ) {
// 	runSequence( 'yarn:download', 'yarn:move', 'yarn:clean', 'yarn:fonts', 'yarn:js', 'yarn:wiredep', 'yarn:scss', 'yarn:css', 'yarn:concat', 'yarn:deltemp',  'scripts', 'styles', 'inject',  'fonts', 'imagemin', 'svgmin', 'video', 'copyMaps', 'favicon', callback )
// } );

// gulp.task('tag', function() {
// 	return gulp.src(['./package.json']).pipe(plugin.tagVersion());
// })

// -------------------------------------
//   Task: clean
//   Deletes .tmp fold or build folder depeding on env flag
// -------------------------------------


function clean() {
	return src(productionDest)
		.pipe(plugin.clean());
}




// -------------------------------------
//   Task: serve
//   Description: Set up local server and watch files for auto refresh
// -------------------------------------

function watchTask() {

	watch([pkg.paths.src.substr(2) + '/**/*.html'], browserSyncReload)

	// gulp.watch( pkg.paths.src.substr( 2 ) + '/**/*.html', [ 'html', 'inject' ] );
	// 	gulp.watch( pkg.paths.src.substr( 2 ) + '/**/*.mustache', [ 'mustache' ] );

	// gulp.watch( pkg.paths.src.substr( 2 ) + pkg.paths.styles + '/**/*.scss', [ 'styles' ] );
	// gulp.watch( pkg.paths.src.substr( 2 ) + pkg.paths.scripts + '/**/*.js', [ 'scripts:watch' ] );
	// gulp.watch( pkg.paths.src.substr( 2 ) + pkg.paths.images + '/**/*.{jpg,jpeg,png,gif}', [ 'imagemin' ] );
	// gulp.watch( pkg.paths.src.substr( 2 ) + pkg.paths.images + '/**/*.svg', [ 'svgmin' ] );
};


function browserSyncReload(done) {
	browserSync.reload();
	done();
}

function browsersync(done) {
	browserSync.init({
		server: {
			baseDir: pkg.paths.temp
		}
	});
	done();
};

// -------------------------------------
//   Yarn Functions
//   These will download and parce frontend libraries
// -------------------------------------

function yarnDownload() {
	return src(['./package.json', './yarn.lock'])
		.pipe(dest('./vendor_modules/'))
		.pipe(plugin.yarn({
			production: true
		}))
};

function yarnCleanDownload() {
	return src('./vendor_modules', {
			allowEmpty: true
		})
		.pipe(plugin.clean());
};

function yarnMove() {
	return src('./vendor_modules/node_modules/**/*')
		.pipe(dest('./vendor_modules'))
};

function yarnClean() {
	return src(['./vendor_modules/node_modules/', './vendor_modules/package.json', './vendor_modules/yarn.lock'])
		.pipe(plugin.clean());
};

function yarnFonts() {
	var fontsFilter = plugin.filter('**/*.{eot,svg,ttf,woff,woff2}', {
		restore: true
	});

	return src(pkg.overrides.main, {
			allowEmpty: true
		})
		.pipe(fontsFilter)
		.pipe(plugin.flatten())
		.pipe(dest(productionDest + pkg.paths.fonts))
		.pipe(browserSync.stream());
};

function yarnImages() {
	var imagesFilter = plugin.filter('**/*.{jpg,jpeg,gif,png,svg}', {
		restore: true
	});
	return src(pkg.overrides.main, {
			allowEmpty: true
		})
		.pipe(imagesFilter)
		.pipe(plugin.flatten())
		.pipe(plugin.imagemin())
		.pipe(dest(productionDest + pkg.paths.styles + '/images'))
		.pipe(browserSync.stream())
};

function yarnJs() {
	var jsFilter = plugin.filter('**/*.js', {
		restore: true
	});

	return src(pkg.overrides.main, {
			allowEmpty: true
		})
		.pipe(jsFilter)
		.pipe(plugin.concat('vendor.js'))
		.pipe(plugin.if(options.env === 'production', plugin.minify()))
		.pipe(dest(productionDest + pkg.paths.scripts))
		.pipe(browserSync.stream());
};

function yarnWiredep() {
	var scssFilter = plugin.filter('**/*.scss', {
		restore: true,
		allowEmpty: true
	});
	var sources = src(pkg.overrides.main, {
		allowEmpty: true
	});

	return src(pkg.paths.src + pkg.paths.styles + '/yarnscss.scss', {
			allowEmpty: true
		})
		.pipe(plugin.plumber({
			errorHandler: onError
		}))
		.pipe(plugin.inject(sources, {
			starttag: '// inject:{{ext}}',
			endtag: '// endinject',
			transform: function (filepath) {
				return '@import \'.' + filepath + '\';';
			}
		}))
		.pipe(dest(productionDest + pkg.paths.styles))
};

function yarnScss() {
	return src(productionDest + pkg.paths.styles + '/yarnscss.scss', {
			allowEmpty: true
		})
		//.pipe(plugin.sassGlob())
		.pipe(plugin.plumber({
			errorHandler: onError
		}))
		.pipe(plugin.sass({
			outputStyle: 'nester',
			precision: 10,
			includePaths: ['.']
		}))
		.on('error', function (err) {
			browserSync.notify(err.message, 3000);
			this.emit('end');
		})
		.pipe(plugin.autoprefixer())
		.pipe(plugin.if(options.env === 'production', plugin.cssnano({
			safe: true
		})))
		.pipe(dest(productionDest + pkg.paths.styles));
};

function yarnCss() {
	var cssFilter = plugin.filter('**/*.css', {
		restore: true
	});

	return src(pkg.overrides.main, {
			allowEmpty: true
		})
		.pipe(cssFilter)
		.pipe(plugin.concat('yarncss.css'))
		.pipe(plugin.if(options.env === 'production', plugin.cssnano({
			safe: true
		})))
		.pipe(dest(productionDest + pkg.paths.styles))
		.pipe(cssFilter.restore);
};

function yarnConcat() {
	return src([productionDest + pkg.paths.styles + '/yarnscss.css', productionDest + pkg.paths.styles + '/yarncss.css'], {
			allowEmpty: true
		})
		.pipe(plugin.concat('vendor.css'))
		.pipe(plugin.cssnano({
			safe: true
		}))
		.pipe(dest(productionDest + pkg.paths.styles))
		.pipe(browserSync.stream());
};

function yarnDeltemp() {
	return src([productionDest + pkg.paths.styles + '/yarnscss.scss', productionDest + pkg.paths.styles + '/yarncss.css', productionDest + pkg.paths.styles + '/yarnscss.css'], {
			allowEmpty: true
		})
		.pipe(plugin.clean())
};





// -----------------------------------
//  Main Assets Tasks
// -----------------------------------


function html() {
	return src(pkg.paths.src + '/index.html')
		.pipe(dest(productionDest))
};

function copyMaps() {
	return src(pkg.paths.src + '/tripoli-slippy-maps/**/*')
		.pipe(dest(productionDest + '/tripoli-slippy-maps'))
}

function favicon() {
	return src(pkg.paths.src + '/favicon.ico')
		.pipe(dest(productionDest))
}

function fonts() {
	return src(pkg.paths.src + pkg.paths.fonts + '/**/*.{eot,svg,ttf,woff,woff2}')
		.pipe(plugin.flatten())
		.pipe(dest(productionDest + pkg.paths.fonts))
		.pipe(browserSync.stream());
}

function scripts() {
	return src([pkg.paths.src + pkg.paths.scripts + '/*.js'])
		.pipe(plugin.if(!production, plugin.sourcemaps.init()))
		.pipe(plugin.concat('main.js'))
		.pipe(plugin.if(!production, plugin.sourcemaps.write('./')))
		.pipe(dest(productionDest + pkg.paths.scripts))
};

function styles() {
	return src(pkg.paths.src + pkg.paths.styles + '/main.scss')
		.pipe(plugin.if(!production, plugin.sourcemaps.init()))
		.pipe(plugin.plumber({
			errorHandler: onError
		}))
		.pipe(plugin.sassGlob())
		.pipe(plugin.replace(/{PKG_VERSION}/g, pkg.version))
		.pipe(plugin.sass({
			outputStyle: 'nester',
			precision: 10,
			includePaths: ['.']
		}))
		.pipe(plugin.autoprefixer())
		.pipe(plugin.if(production, plugin.cssnano({
			discardComments: {
				removeAll: true
			},
			discardDuplicates: true,
			discardEmpty: true,
			minifyFontValues: true,
			minifySelectors: true
		})))
		.pipe(plugin.if(!production, plugin.sourcemaps.write('./')))
		.pipe(dest(productionDest + pkg.paths.styles))
		.pipe(browserSync.stream());
}

function inject() {
	const target = src(productionDest + '/index.html');
	const vendorSources = src([productionDest + pkg.paths.styles + '/vendor.css', productionDest + pkg.paths.scripts + '/vendor.js'], {read: false}, {relative: true});
	const mainSources = src([productionDest + pkg.paths.styles + '/main.css', productionDest + pkg.paths.scripts + '/main.js'], {read: false}, {relative: true});
	return target.pipe(plugin.inject(streameries(vendorSources, mainSources), {
			relative: true
		}))
		.pipe(dest(productionDest))
		.pipe(browserSync.stream())
}

function imagemin() {
	return src(pkg.paths.src + pkg.paths.images + '/**/*.{jpg,jpeg,png,gif}')
		.pipe(plugin.imagemin())
		.pipe(dest(productionDest + pkg.paths.images))
		.pipe(browserSync.stream());
}

function svgmin() {
	return src(pkg.paths.src + pkg.paths.images + '/**/*.svg')
		.pipe(plugin.svgmin())
		.pipe(dest(productionDest + pkg.paths.images))
		.pipe(browserSync.stream());
}

function video() {
	return src(pkg.paths.src + pkg.paths.video + '/**/*')
		.pipe(dest(productionDest + pkg.paths.video));
}



// gulp.task( 'assets', function ( done ) {
// 	gulp.start( 'assets:sequence' )
// 	done();
// } );

// gulp.task( 'assets:sequence', function ( callback ) {
// 	runSequence( 'fonts', 'scripts', 'styles', 'imagemin', 'svgmin', 'video', callback )
// } );

// gulp.task( 'scripts:watch', [ 'scripts' ], function ( done ) {
// 	browserSync.reload();
// 	done();
// } );