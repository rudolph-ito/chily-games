$ ->
  $(document).on 'page:load', setupDependentInputs
  setupDependentInputs()

setupDependentInputs = ->
  $("[data-dependent]").each () ->
    $input = $(this)
    $dependencies = $("[data-dependency=#{$input.data("dependent")}]")

    $input.on 'change', () ->
      value = $input.val()
      for dependency in $dependencies
        $dependency = $(dependency)

        show = if $dependency.is('[data-value]')
          value is $dependency.data('value').toString()
        else if $dependency.is('[data-value-in]')
          value in $dependency.data('value-in')

        $dependency.toggle show

    $input.change() unless $input.is('[type=radio]') and !$input.is(':checked')
