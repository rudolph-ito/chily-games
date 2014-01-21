# This is a manifest file that'll be compiled into application.js, which will include all the files
# listed below.
#
# Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
# or vendor/assets/javascripts of plugins, if any, can be referenced here using a relative path.
#
# It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
# the compiled file.
#
# WARNING: THE FIRST BLANK LINE MARKS THE END OF WHAT'S TO BE PROCESSED, ANY BLANK LINE SHOULD
# GO AFTER THE REQUIRES BELOW.
#
#= require sprockets/commonjs
#= require jquery
#= require jquery_ujs
#= require underscore
#= require bootstrap-modal
#= require kinetic
#= require ruby
#= require socket.io.js
#
#= require_directory ./base
#
#= require controller.module
#= require_directory ./controllers
#
#= require space.module
#= require_directory ./spaces
#
#= require piece.module
#
#= require board.module
#= require_directory ./boards
