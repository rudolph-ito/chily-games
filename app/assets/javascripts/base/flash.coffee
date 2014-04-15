$ ->
  $(document).on 'page:load', clearFlash
  clearFlash()

clearFlash = ->
  setTimeout (-> $('.flash').fadeOut() ), 5000
