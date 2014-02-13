$ ->
  $("[data-dependent]").each () ->
    input = $(this)
    name = input.data("dependent")
    dependencies = $("[data-dependency=#{name}]")

    input.on 'change', () ->
      value = input.val()
      for d in dependencies
        d = $(d)
        data_value = d.data("value")?.toString()
        data_value_in = d.data("value-in") ? []

        if value is data_value || value in data_value_in
          d.show()
        else
          d.hide()

    input.change()

