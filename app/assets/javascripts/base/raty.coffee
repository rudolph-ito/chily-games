raty_cyvasse_defaults =
  half: true
  hints: ['eh', 'on its way', 'good', 'great', 'brilliant']
  noRatedMsg: 'not rated'
  path: '/assets/'
  score: -> $(@).attr('data-score')

$.fn.raty.defaults = $.extend true, {}, $.fn.raty.defaults, raty_cyvasse_defaults
