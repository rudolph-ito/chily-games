class PlyCalculator::TurnPlyCalculator < SimpleDelegator

  def call
    _call(from, 0)
  end

  private

  def _call(coordinate, count)
    return [] if maximum && count >= maximum

    plies = []

    directional_functions.each do |directional_function|
      to = coordinate.clone
      directional_function.call(to)
      to = board.reduce_coordinate(to)

      # Stop if distance did not grow
      next if CoordinateDistance.calculate(from, coordinate) >= CoordinateDistance.calculate(from, to)

      valid, stop, new_movement_count = evaluator.call(to, count + 1)
      plies << to.clone if valid
      next if stop

      plies += _call(to, new_movement_count)
    end

    plies.uniq
  end

end
