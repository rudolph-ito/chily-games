$ ->
  flash = $(".flash")
  if flash.length > 0
    setTimeout (-> flash.slideUp()), 5000
