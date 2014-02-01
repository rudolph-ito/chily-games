$ ->
  $("[data-dependent]").each () ->
    input = $(this)
    name = input.data("dependent")
    dependencies = $("[data-dependency=#{name}]")

    input.on 'change', () ->
      value = input.val()
      for d in dependencies
        d = $(d)
        if value is d.data("value").toString()
          d.show()
        else
          d.hide()

    input.change()

