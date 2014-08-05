class PlyCalculator::TurnPlyCalculator < SimpleDelegator

  def call
    _call(from, 0)
  end

  private

  def _call(coordinate, count)
    return {} if maximum && count >= maximum

    plies = empty_plies

    directional_functions.each do |directional_function|
      to = coordinate.clone
      directional_function.call(to)

      # Stop if distance did not grow
      old_distance = board.distance(from, coordinate)
      new_distance = board.distance(from, to)
      next if old_distance >= new_distance || new_distance <= count

      valid, flag, stop, new_count = evaluator.call(to, count + 1)
      plies[flag] << to.clone if valid
      next if stop

      child_plies = _call(to, new_count)
      child_plies.each { |k, v| plies[k] += v }
    end

    plies.each { |k, v| plies[k] = v.uniq }
    plies
  end

end
