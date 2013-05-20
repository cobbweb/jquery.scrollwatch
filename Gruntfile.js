module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.initConfig({

    jshint: {
      all: {
        files: {
          src: ['Gruntfile.js', 'src/jquery.scrollwatch.js']
        }
      }
    },

    copy: {
      main: {
        files: [
          { expand: true, src: ['*.js'], dest: './', cwd: 'src/' }
        ]
      }
    },

    uglify: {
      main: {
        files: {
          'jquery.scrollwatch.min.js': ['jquery.scrollwatch.js']
        }
      }
    }

  });

  grunt.registerTask('default', ['jshint', 'copy', 'uglify']);
};