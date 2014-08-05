class PlyCalculator::LinePlyCalculator < SimpleDelegator

  def call
    plies = empty_plies

    directional_functions.each do |directional_function|
      to = from.clone
      count = 0

      while !(maximum && count >= maximum)
        directional_function.call(to)

        valid, flag, stop, count = evaluator.call(to, count + 1)
        plies[flag] << to.clone if valid
        break if stop
      end
    end

    plies
  end

end
