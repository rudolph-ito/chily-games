class PlyCalculator::LinePlyCalculator < SimpleDelegator

  def call
    plies = []

    directional_functions.each do |directional_function|
      to = from.clone
      count = 0

      while !(maximum && count >= maximum)
        directional_function.call(to)
        to = board.reduce_coordinate(to)

        valid, stop, count = evaluator.call(to, count + 1)
        plies << to.clone if valid
        break if stop
      end
    end

    plies
  end

end
