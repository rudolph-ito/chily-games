Array::any = (func) ->
  (func = (element) -> element) unless func?
  for element in @
    return true if func(element)
  false

Array::all = (func) ->
  (func = (element) -> element) unless func?
  for element in @
    return false unless func(element)
  true