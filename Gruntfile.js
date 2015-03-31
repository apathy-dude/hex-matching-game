module.exports = function(grunt) {
    grunt.initConfig({
            pkg: grunt.file.readJSON('package.json'),
            browserify: {
                dist: {
                    files: {
                        'bin/<%= pkg.name %>.js': [ 'src/game.js', 'src/states/*.js' ]
                    }
                }
            },
            jshint: {
                files: [ 'Gruntfile.js', 'src/game.js', 'src/states/*.js', 'test/**/*.js' ]
            },
            mochaTest: {
                test: {
                    options: {
                        reporter: 'spec'
                    },
                    src: ['test/**/*.js']
                }
            },
            toArray: {
                states: {
                    options: {
                        getFiles: true
                    },
                    files: {
                        'src/states.js': [ 'src/states/**/*.js' ]
                    }
                }
            },
            uglify: {
                options: {
                    banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
                },
                dist: {
                    files: {
                        'bin/<%= pkg.name %>.min.js': ['bin/<%=pkg.name%>.js']
                    }
                }
            },
            watch: {
                toArray: {
                    files: [ 'src/states/**/*.js' ],
                    tasks: [ 'toArray' ]
                }
            }
    });

    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-mocha-test');

    grunt.registerMultiTask('toArray', 'Put Files into proper format', function() {
        var data = [];

        var options = this.options();
        var states = this.target === 'states';

        this.files.forEach(function(file) {
            file.src.filter(function(filepath) {
                if(options.getFiles && options.getFolders)
                    return true;

                var isFile = grunt.file.isFile(filepath);

                return (options.getFiles && isFile) || (options.getFolders && !isFile);
            }).map(function(filepath) {
                if(states) {
                    var state = filepath.split('/');
                    state = state[state.length - 1].split('.')[0];

                    data.push('game.state.add("' + state + '", require("./states/' + state + '"));');
                }

                grunt.log.ok(filepath);
            });

            var dataString = '';
            for(var d in data) {
                dataString += data[d];
            }

            grunt.file.write(file.dest, 'module.exports = function() { ' + dataString + ' };');
        });
    });

    grunt.registerTask('default', [ 'toArray', 'jshint', 'mochaTest', 'browserify', 'uglify' ]);
    grunt.registerTask('test', [ 'jshint', 'mochaTest' ]);
};
